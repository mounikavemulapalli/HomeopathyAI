/** @format */

const mongoose = require("mongoose");

const RubricSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    book: { type: String, default: "" },
    chapter: { type: String, required: true },
    rubric: { type: String, required: true },
    remedy: { type: mongoose.Schema.Types.Mixed }, // Handles JSON arrays/strings directly
    embedding: { type: [Number], default: [] }, // Stores vector floats smoothly as arrays
  },
  {
    timestamps: true,
  },
);

// FTS5 alternate compound Text Index for ultra-fast matching
RubricSchema.index(
  { rubric: "text", chapter: "text", book: "text" },
  { weights: { rubric: 10, chapter: 5, book: 1 }, name: "RubricTextIndex" },
);

const Rubric = mongoose.model("Rubric", RubricSchema);
module.exports = Rubric;
