const SOURCE_GRADE_CONFIG = {
  KENT: 3,
  CLINICAL_GPT: 3,
  CLARKE: 3,
  CONFIRMATORY_GPT: 3,
  CONFIRMATORY_RUBRICS: 3,
  CLINICAL_SMART_TIPS_INDEXED: 3,
  BBCR: 4,
  BOGER: 4,
};

function normalizeRepertoryGrade(rawGrade, sourceFile) {
  // Extract source name from file, e.g., "kent_master_db.json" -> "KENT"
  // Handles both "_master_db.json" and ".json.json" (for confirmatory_rubrics.json.json)
  let cleanedFileName = sourceFile.replace(/_master_db\.json$/, '')
                                  .replace(/\.json\.json$/, '') // Specific for confirmatory_rubrics.json.json
                                  .replace(/\.json$/, '');       // Generic for any .json at the end

  // Convert to uppercase and replace any remaining hyphens with underscores
  // to match the SOURCE_GRADE_CONFIG keys.
  const sourceName = cleanedFileName.toUpperCase().replace(/-/g, '_');


  const N = SOURCE_GRADE_CONFIG[sourceName];

  if (N === undefined) {
    console.warn(`[GRADE_NORMALIZATION] Unknown source: ${sourceName}. Cannot normalize grade ${rawGrade}. Returning raw grade.`);
    return rawGrade; 
  }

  // Ensure rawGrade is a number and within valid range
  const grade = Number(rawGrade);
  if (isNaN(grade) || grade < 1 || grade > N) {
    console.warn(`[GRADE_NORMALIZATION] Invalid rawGrade: ${rawGrade} for source ${sourceName} (expected 1 to ${N}). Returning raw grade.`);
    return rawGrade;
  }

  // Normalization formula
  // normalizedGrade = 0.25 + 0.75 * (rawGrade - 1) / (N - 1)
  // Handle N=1 case to avoid division by zero (though current sources don't have N=1 in the provided list)
  if (N - 1 === 0) {
    return 0.25; // If only one grade, it normalizes to 0.25 based on the formula structure
  }

  const normalizedGrade = 0.25 + 0.75 * (grade - 1) / (N - 1);
  return parseFloat(normalizedGrade.toFixed(4)); // Round to 4 decimal places for consistency
}

module.exports = {
  normalizeRepertoryGrade,
  SOURCE_GRADE_CONFIG
};

