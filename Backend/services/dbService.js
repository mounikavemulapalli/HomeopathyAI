/** @format */

const Rubric = require("../models/Rubric.js");

class DBService {
  /**
   * Insert or update a rubric (Upsert logic converted from ON CONFLICT)
   */
  async upsertRubric(id, book, chapter, rubric, remedy, embedding = []) {
    try {
      let parsedRemedies = remedy;
      if (typeof remedy === "string") {
        try {
          parsedRemedies = JSON.parse(remedy);
        } catch (e) {
          /* Fallback string */
        }
      }

      return await Rubric.findOneAndUpdate(
        { id },
        {
          book,
          chapter,
          rubric,
          remedy: parsedRemedies,
          embedding,
        },
        { upsert: true, new: true, runValidators: true },
      );
    } catch (error) {
      console.error(`❌ MongoDB Upsert failed for id ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Exact and FTS Search (Converted from SQLite FTS5 BM25 Ranking)
   */
  async searchRubricsFTS(query, limit = 50) {
    const escapedQuery = query.replace(/[""]/g, "");

    try {
      // MongoDB uses text score algorithm which runs analogously to SQLite's BM25
      const rows = await Rubric.find(
        { $text: { $search: escapedQuery } },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();

      return rows.map((row) => this._parseRow(row));
    } catch (error) {

      return this.searchRubricsByKeyword(query, limit);
    }
  }

  /**
   * Keyword search for rubrics (Fallback converted to MongoDB Regex)
   */
  async searchRubricsByKeyword(query, limit = 100) {
    // Split keywords to match the split patterns from original query
    const keywords = query
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((k) => k.length > 2);
    if (keywords.length === 0) return [];

    try {
      // Constructs individual condition groups for: (rubric LIKE %k% OR chapter LIKE %k%)
      const matchConditions = keywords.map((k) => ({
        $or: [
          { rubric: { $regex: k, $options: "i" } },
          { chapter: { $regex: k, $options: "i" } },
        ],
      }));

      const rows = await Rubric.find({ $and: matchConditions })
        .limit(limit)
        .lean();

      return rows.map((row) => this._parseRow(row));
    } catch (error) {
      console.error("❌ Fallback search failed:", error.message);
      return [];
    }
  }

  /**
   * Get all rubrics
   */
  async getAllRubrics() {
    const rows = await Rubric.find({}).lean();
    return rows.map((row) => this._parseRow(row));
  }

  /**
   * Get total rubrics count
   */
  async getRubricsCount() {
    return await Rubric.countDocuments({});
  }

  /**
   * Get rubric by ID
   */
  async getRubricById(id) {
    const row = await Rubric.findOne({ id }).lean();
    return row ? this._parseRow(row) : null;
  }

  /**
   * Parse rows smoothly - Arrays translate natively in MongoDB,
   * removing the need for complex Buffer/Float32 conversions.
   */
  _parseRow(row) {
    if (!row) return null;
    return {
      ...row,
      remedies:
        typeof row.remedy === "string" ? JSON.parse(row.remedy) : row.remedy,
    };
  }
}

module.exports = new DBService();