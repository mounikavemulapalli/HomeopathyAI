/** @format */
const express = require("express");
const router = express.Router();
const {
  searchRubrics,
  analyzeCaseLegacy,
  generateRubricSuggestionsFromCase,
  generateRepertoryMatrixData,
} = require("../controllers/repertoryController.js");
const { searchExactRubrics, searchPartialRubrics, searchTokenOverlapRubrics } = require("../services/masterRubricSearchService.cjs");

// క్లైంట్ మరియు పాత ఫ్రంటెండ్ పేలోడ్స్ అన్నింటికీ డ్యూయల్ రూటింగ్
router.get("/repertory/search", searchRubrics);
router.get("/search", searchRubrics);

router.post("/repertarize", analyzeCaseLegacy);
router.post("/analyze", analyzeCaseLegacy);

router.post("/ai-rubrics/generate", generateRubricSuggestionsFromCase);
router.post("/repertory/matrix", generateRepertoryMatrixData);

router.get("/master-repertory/search", (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ success: false, message: "Query parameter 'q' is required." });
  }

  let results = [];

  // 1. Exact match
  results = searchExactRubrics(query);
  if (results.length > 0) {
    return res.json({ success: true, total: results.length, results: results });
  }

  // 2. Partial match (contains)
  results = searchPartialRubrics(query);
  if (results.length > 0) {
    return res.json({ success: true, total: results.length, results: results });
  }

  // 3. Token overlap match
  results = searchTokenOverlapRubrics(query);
  
  res.json({ success: true, total: results.length, results: results });
});

module.exports = router;
