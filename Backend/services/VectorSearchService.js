/** @format */

const NodeCache = require("node-cache");
const localVectorStoreService = require("./localVectorStoreService");

// Safe import for stabilization layers
let normalizationMap = { anatomyChapterMap: {} };
try {
  const nm = require("../synonyms/normalizationMap.cjs");
  normalizationMap = nm.normalizationMap || nm.default || { anatomyChapterMap: {} };
} catch (e) {
  console.warn("⚠️ normalizationMap not found at default location, fallback initialized.");
}

class VectorSearchService {
  constructor() {
    this.searchCache = new NodeCache({ stdTTL: 3600, maxKeys: 1000 });
  }

  _getMasterPool() {
    return Array.isArray(global.masterRepertory) ? global.masterRepertory : [];
  }

  _lookupRubricById(id) {
    const pool = this._getMasterPool();
    return pool.find((item) => String(item.id) === String(id)) || null;
  }

  _searchLocalKeyword(queryText, allowedChapters = null) {
    const pool = this._getMasterPool();
    const terms = String(queryText || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);
    if (!terms.length || !pool.length) return [];

    const chapterSet =
      Array.isArray(allowedChapters) && allowedChapters.length > 0
        ? new Set(allowedChapters.map((c) => String(c).trim().toUpperCase()))
        : null;

    return pool
      .filter((r) => {
        if (!r || !r.rubric) return false;
        if (
          chapterSet &&
          !chapterSet.has(String(r.chapter || "").trim().toUpperCase())
        ) {
          return false;
        }
        const text = String(r.rubric).toLowerCase();
        return terms.every((t) => text.includes(t));
      })
      .slice(0, 100);
  }

  /**
   * Hybrid search: Combines Local MasterRepertory Keyword scoring with Local Vector Search
   */
  async hybridSearch(query, queryEmbedding, topK = 50, parsedQuery = null) {
    const cacheKey = `hybrid_${query}_${JSON.stringify(parsedQuery?.allowedChapters || [])}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) return cached;

    console.log(`🚀 Executing Local-First Hybrid Search for: "${query}"`);

    // --- DEBUG ENGINE LOGS (Preserved for clinical auditing) ---
    this._runDebugLogging(parsedQuery);

    // Parse advanced logic (NOT/Exclude)
    const { positiveQuery, negativeTerms } = this._parseAdvancedLogic(query);

    // Filter out relation stop words for query normalization
    const cleanQuery = positiveQuery
      .replace(/\b(during|before|after|while|from|with|when)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const allowedChapters = Array.isArray(parsedQuery?.allowedChapters)
      ? parsedQuery.allowedChapters
      : null;

    // 1. Local Keyword Search over masterRepertory
    const keywordMatches = this._searchLocalKeyword(
      cleanQuery || positiveQuery,
      allowedChapters,
    );

    // 2. Local Embedded Semantic Search
    let semanticMatches = [];
    try {
      let activeEmbedding = queryEmbedding;
      if (!Array.isArray(activeEmbedding) || activeEmbedding.length === 0) {
        activeEmbedding = await localVectorStoreService.embedQuery(
          cleanQuery || positiveQuery,
        );
      }
      if (Array.isArray(activeEmbedding) && activeEmbedding.length > 0) {
        semanticMatches = await localVectorStoreService.search(
          activeEmbedding,
          100,
          { allowedChapters: allowedChapters || undefined },
        );
      }
    } catch (error) {
      console.error("❌ Local semantic search failed:", error.message);
    }

    // 3. Merge and Initial Scoring Engine Matchmaker Map
    const mergedResultsMap = new Map();

    keywordMatches.forEach((r) => {
      mergedResultsMap.set(r.id, {
        ...r,
        keywordScore: 1.0,
        semanticScore: 0,
        finalScore: 1.0,
        debug: {
          fts: 1.0,
          semantic: 0,
          retrievalSource: "Local MasterRepertory Keyword",
        },
      });
    });

    semanticMatches.forEach((sm) => {
      if (mergedResultsMap.has(sm.id)) {
        const existing = mergedResultsMap.get(sm.id);
        existing.semanticScore = sm.score;
        existing.finalScore = existing.finalScore * 0.4 + sm.score * 0.6;
        existing.debug.semantic = sm.score;
        existing.debug.retrievalSource = "Hybrid (Local Keyword + Local Vector)";
      } else {
        const rubric = this._lookupRubricById(sm.id);
        if (rubric) {
          mergedResultsMap.set(sm.id, {
            ...rubric,
            keywordScore: 0,
            semanticScore: sm.score,
            finalScore: sm.score * 0.6,
            debug: {
              fts: 0,
              semantic: sm.score,
              retrievalSource: "Local Embedded Vector",
            },
          });
        }
      }
    });

    // --- Advanced Homeopathic Clinical Weighting System ---
    const lowerQuery = positiveQuery.toLowerCase();
    const targetChapters = this._detectTargetChapters(lowerQuery);
    const tokens = lowerQuery.split(/\s+/).filter((t) => t.length > 2);

    const medicalWeights = {
      menses: 2.5,
      menstruation: 2.5,
      scanty: 2.0,
      fear: 1.8,
      darkness: 1.8,
      thirst: 2.0,
      burning: 1.5,
      soles: 2.2,
      constipation: 2.0,
      jealousy: 2.5,
      aversion: 1.5,
      desire: 1.5,
      headache: 1.8,
      aggravation: 1.5,
      amelioration: 1.5,
      summer: 3.0,
      winter: 3.0,
      heat: 2.5,
      cold: 2.5,
      weather: 2.0,
    };

    const noiseTerms = [
      "condylomata",
      "cauliflower",
      "growth",
      "excrescence",
      "wart",
      "tumor",
      "cancer",
    ];

    let candidates = Array.from(mergedResultsMap.values()).map((c) => {
      let score = c.finalScore;
      const rubricText = (c.rubric || "").toLowerCase();
      const chapter = (c.chapter || "").toUpperCase();

      c.debug = {
        ...(c.debug || {}),
        chapterBoost: 0,
        tokenBoost: 0,
        negativeFilter: 0,
        advancedLogic: 0,
        modalityBoost: 0,
        pathologyLock: 0,
        pathologyBoost: 0,
        mentalLock: 0,
        mentalBoost: 0,
        relationalBoost: 0,
      };

      // A. Relational Clinical Boosting
      if (parsedQuery?.relations?.length > 0) {
        parsedQuery.relations.forEach((rel) => {
          const symptom = rel.primarySymptom.toLowerCase();
          const condition = rel.contextCondition.toLowerCase();

          const s_syns = [
            symptom,
            "exhaustion",
            "debility",
            "faintness",
            "fatigue",
            "prostration",
            "tiredness",
            "weakness",
          ];
          const c_syns = [
            condition,
            "menstruation",
            "periods",
            "menstrual",
            "menses",
          ];

          if (
            s_syns.some((s) => rubricText.includes(s)) &&
            c_syns.some((c) => rubricText.includes(c))
          ) {
            const relationBoost = 100.0;
            score += relationBoost;
            c.debug.relationalBoost += relationBoost;
          }
        });
      }

      // B. Clinical Pathology Lock & Penalty Configurations
      if (parsedQuery?.detectedPathologies?.length > 0) {
        parsedQuery.detectedPathologies.forEach((p) => {
          if (
            p.chapters.some(
              (tc) =>
                chapter.includes(tc.toUpperCase()) ||
                tc.toUpperCase().includes(chapter),
            )
          ) {
            score += 5.0;
            c.debug.pathologyLock += 5.0;
          } else if (chapter !== "GENERALITIES" && chapter !== "GENERAL") {
            score += -8.0;
            c.debug.pathologyLock += -8.0;
          }
          p.related_terms.forEach((term) => {
            if (rubricText.includes(term.toLowerCase())) {
              score += 3.0;
              c.debug.pathologyBoost += 3.0;
            }
          });
        });
      }

      // C. Mental Ontology Enforcement
      if (parsedQuery?.detectedMentalSymptoms?.length > 0) {
        let matchesAnyMentalChapter = false;
        let matchesAnyMentalSynonym = false;

        parsedQuery.detectedMentalSymptoms.forEach((m) => {
          if (
            m.chapters.some(
              (tc) =>
                chapter.includes(tc.toUpperCase()) ||
                tc.toUpperCase().includes(chapter),
            )
          ) {
            matchesAnyMentalChapter = true;
          }
          if (
            m.synonyms.some((s) => rubricText.includes(s.toLowerCase())) ||
            m.keywords.some((k) => rubricText.includes(k.toLowerCase()))
          ) {
            matchesAnyMentalSynonym = true;
          }
          m.related.forEach((term) => {
            if (rubricText.includes(term.toLowerCase())) {
              score += 5.0;
              c.debug.mentalBoost += 5.0;
            }
          });
        });

        if (matchesAnyMentalChapter) {
          score += 10.0;
          c.debug.mentalLock += 10.0;
        } else if (!matchesAnyMentalSynonym) {
          score += -15.0;
          c.debug.mentalLock += -15.0;
        }

        if (parsedQuery.tokenPriorities) {
          parsedQuery.tokenPriorities.dominant.forEach((t) => {
            if (rubricText.includes(t.toLowerCase())) {
              score += 3.0;
              c.debug.mentalBoost += 3.0;
            }
          });
          parsedQuery.tokenPriorities.modifiers.forEach((t) => {
            if (rubricText.includes(t.toLowerCase())) {
              score += 0.2;
              c.debug.mentalBoost += 0.2;
            }
          });
        }
      }

      // D. NOT / Advanced filter logical matching
      if (negativeTerms.some((nt) => rubricText.includes(nt))) {
        score -= 5.0;
        c.debug.advancedLogic = -5.0;
      }

      // E. Standard Chapter Matching Weights
      if (
        targetChapters.some(
          (tc) => chapter.includes(tc) || tc.includes(chapter),
        )
      ) {
        score += 0.5;
        c.debug.chapterBoost = 0.5;
      }

      // F. Token Weights Multipliers
      tokens.forEach((token) => {
        if (rubricText.includes(token)) {
          const weight = (medicalWeights[token] || 1.0) * 0.2;
          score += weight;
          c.debug.tokenBoost += weight;
        }
      });

      // G. Modalities Context Upgrades
      if (parsedQuery?.modalities?.length > 0) {
        parsedQuery.modalities.forEach((m) => {
          if (
            rubricText.includes(m.value) &&
            (rubricText.includes("agg") || rubricText.includes("amel"))
          ) {
            score += 2.0;
            c.debug.modalityBoost += 2.0;
          }
        });
      }

      // H. Noise Exclusion Mitigation
      if (
        noiseTerms.some(
          (nt) => rubricText.includes(nt) && !lowerQuery.includes(nt),
        )
      ) {
        score -= 2.0;
        c.debug.negativeFilter = -2.0;
      }


      // [MODIFIER_TERM_BOOST]
      const modifierTerms = [
        "bland", "acrid", "profuse", "scanty", "thick", "thin",
        "milky", "yellow", "white", "greenish", "offensive", "clotted", "corrosive"
      ];
      for (const mod of modifierTerms) {
        if (lowerQuery.includes(mod) && rubricText.includes(mod)) {
          score += 0.35;
          c.debug.modifierBoost = (c.debug.modifierBoost || 0) + 0.35;
        }
      }

      // I. Exact Match Boost
      if (rubricText.includes(lowerQuery)) {
        score += 0.5;
        c.debug.exactBoost = 0.5;
      }

      c.finalScore = score;
      return c;
    });

    candidates = candidates.filter((c) => c.finalScore > 0);
    candidates.sort((a, b) => b.finalScore - a.finalScore);

    const finalResult = candidates.slice(0, topK);
    this.searchCache.set(cacheKey, finalResult);

    // [DEDUP_HYBRID_BY_RUBRIC_TEXT]
    if (Array.isArray(finalResult) && finalResult.length > 1) {
      const seenRubricText = new Map();
      for (const item of finalResult) {
        const normKey = String((item && item.rubric) || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
        if (!normKey) continue;
        const prev = seenRubricText.get(normKey);
        const currScore = Number(item && item.finalScore) || 0;
        const prevScore = Number(prev && prev.finalScore) || 0;
        if (!prev || currScore > prevScore) {
          seenRubricText.set(normKey, item);
        }
      }
      const dedupedFinalResult = Array.from(seenRubricText.values());
      return dedupedFinalResult;
    }

    return finalResult;
  }

  async checkHealth() {
    return localVectorStoreService.checkHealth();
  }

  _parseAdvancedLogic(query) {
    const parts = query
      .toLowerCase()
      .split(/\s+not\s+|\s+exclude\s+|\s+except\s+/);
    const positiveQuery = parts[0].trim();
    const negativeTerms = parts.slice(1).map((p) => p.trim());
    return { positiveQuery, negativeTerms };
  }

  _detectTargetChapters(query) {
    const targets = new Set();
    if (!normalizationMap?.anatomyChapterMap) return [];
    for (const [keyword, chapters] of Object.entries(
      normalizationMap.anatomyChapterMap,
    )) {
      if (query.includes(keyword.toLowerCase())) {
        chapters.forEach((ch) => targets.add(ch.toUpperCase()));
      }
    }
    return Array.from(targets);
  }

  _runDebugLogging(parsedQuery) {
    if (!parsedQuery) return;
    if (parsedQuery.detectedPathologies?.length > 0) {
      console.log("\n--- CLINICAL ONTOLOGY DEBUG ---");
      parsedQuery.detectedPathologies.forEach((p) => {
        console.log(`Applied chapter locks: ${p.chapters.join(", ")}`);
      });
    }
    if (parsedQuery.detectedMentalSymptoms?.length > 0) {
      console.log("\n--- MENTAL ONTOLOGY DEBUG ---");
      if (parsedQuery.tokenPriorities) {
        console.log(
          `Dominant tokens: ${parsedQuery.tokenPriorities.dominant.join(", ")}`,
        );
      }
    }
  }
}

module.exports = new VectorSearchService();
