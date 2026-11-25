/** @format */

// /** @format */

// // routes/analyzeCase.js or your app's main logic
// const getRemediesForRubric = require("../helpers/getRemediesForRubric");

// function analyzeRubric(rubricInput) {
//   const result = getRemediesForRubric(rubricInput);

//   if (!result) {
//     return { success: false, message: "Rubric not found" };
//   }

//   return {
//     success: true,
//     rubric: rubricInput,
//     grading: result,
//   };
// }

// // // Example usage
// // const result = analyzeRubric("Mouth - Ulcers inside cheek or lips");
// // console.log(JSON.stringify(result, null, 2));
/** @format */
/** @format */

const express = require("express");
const router = express.Router();

// 🚀 Fixed: Loading both analyze logic and our Intelligent Search logic from the controller
const {
  analyzeCaseLegacy,
  searchRubrics,
} = require("../controllers/repertoryController.js");

// New Core Matrix Endpoint (Mapping to your working legacy controller logic)
router.post("/analyze", analyzeCaseLegacy);

// Old Single Rubric Endpoint (Safely mapping to the same working controller logic)
router.post("/analyze-single", analyzeCaseLegacy);

// 🔍 1st Objective Endpoint: Intelligent Rubric Search Gateway
// Frontend nundi vache search requests ni idi handle chestundi
router.get("/search", searchRubrics);

// Export router via CommonJS
module.exports = router;
