/** @format */
const fs = require("fs");
const path = require("path");
const { Index } = require("flexsearch");
const {
  splitMultiSymptoms,
  splitStructuredSymptoms,
} = require("../services/clinicalSymptomNormalizer");
const {
  loadMasterRepertory,
} = require("../services/repertoryLoaderService.cjs");

const RepertoryEngine = require("../services/RepertoryEngine.js"); // Import RepertoryEngine
const clinicalRedFlagService = require("../services/clinicalRedFlagService.js");
const physicianThinkingService = require("../services/physicianThinkingService.js"); // Import physicianThinkingService

// Initialize global.masterRepertory and the single RepertoryEngine instance
let repertoryEngineInstance; // Declare here so it's accessible globally within the module

// Function to initialize the repertory engine and master repertory
const initializeRepertoryEngine = async () => {
  if (!global.masterRepertory) {
    console.log(
      "Controller: global.masterRepertory not found, loading master repertory...",
    );
    const { masterRepertory, loadedCounts } = await loadMasterRepertory();
    global.masterRepertory = masterRepertory;
    console.log("Master repertory loaded:");
    console.log(`Total rubrics: ${global.masterRepertory.length}`);
    console.log("Source files loaded:", loadedCounts);
  } else {
    console.log("Controller using existing master repertory.");
    console.log(`Total rubrics: ${global.masterRepertory.length}`);
  }

  if (!repertoryEngineInstance) {
    // Only initialize if not already initialized
    repertoryEngineInstance = new RepertoryEngine();
    await repertoryEngineInstance.init();
    console.log("âœ… RepertoryEngine (singleton) initialized successfully.");
  }
};

// ðŸš€ 2. CLIENT`S ANATOMY ANCHOR MAP
const ANATOMY_ANCHOR_MAP = {
  menses: ["GENITALIA FEMALE"],
  uterus: ["GENITALIA FEMALE"],
  leucorrhoea: ["GENITALIA FEMALE"],
  urine: ["URINARY ORGANS"],
  bladder: ["URINARY ORGANS"],
  cough: ["COUGH", "EXPECTORATION"],
  expectoration: ["COUGH", "EXPECTORATION"],
  stomach: ["STOMACH"],
  gastric: ["STOMACH"],
  head: ["HEAD"],
  chest: ["CHEST"],
  heart: ["HEART"],
  lungs: ["LUNGS"],
  skin: ["SKIN"],
  eye: ["EYE"],
  ear: ["EAR"],
  nose: ["NOSE"],
  mouth: ["MOUTH"],
  face: ["FACE"],
  throat: ["THROAT"],
  rectum: ["RECTUM"],
  extremities: ["EXTREMITIES"],
  sleep: ["SLEEP"],
  dreams: ["DREAMS"],
  fever: ["FEVER"],
  chill: ["CHILL"],
  sweat: ["SWEAT"],
  vertigo: ["VERTIGO"],
  respiration: ["RESPIRATION"],
  back: ["BACK"],
  neck: ["NECK"],
  abdomen: ["ABDOMEN"],
  stool: ["STOOL"],
  kidney: ["KIDNEY"],
  sexual: ["GENITALIA FEMALE", "GENITALIA MALE"],
  male: ["GENITALIA MALE"],
  female: ["GENITALIA FEMALE"],
};

// ðŸš€ 3. FlexSearch Fast Index Setup
// The global searchIndex is now managed by masterRubricSearchService.cjs.
// We need to ensure that the initial setup uses `global.masterRepertory`
// and that `masterRubricSearchService.cjs`'s `getRubricSearchIndex()`
// is correctly initializing and returning the index.
// The following block which was previously initializing `searchIndex` directly in this file is removed.

// Load remedy explanations
let remedyExplanation = [];
try {
  const remedyExplanationsPath = path.join(
    __dirname,
    "../utils/brain/remedyExplanation.json",
  );
  if (fs.existsSync(remedyExplanationsPath)) {
    const remedyData = fs.readFileSync(remedyExplanationsPath, "utf8");
    remedyExplanation = JSON.parse(remedyData);
    console.log(`âœ… Loaded ${remedyExplanation.length} remedy explanations.`);
  } else {
    console.log("âš ï¸ Warning: remedyExplanation.json not found.");
  }
} catch (error) {
  console.error("âŒ Error reading remedyExplanation.json:", error);
}

/**
 * ðŸ” DYNAMIC SEARCH WITH ANATOMY ROUTING (Formatted Like Reference App)
 */
const searchRubrics = async (req, res) => {
  try {
    const query = req.query.q;
    const category = req.query.category || "";

    if (!query)
      return res.status(400).json({ error: "Search text `q` is required." });

    // 1. Accept multiple symptoms
    const symptoms = splitMultiSymptoms(query);

    if (symptoms.length === 0) {
      return res.status(200).json([]);
    }

    // Extract all context words/keywords from all symptoms for maintaining context
    const stopWords = new Set([
      "a",
      "an",
      "the",
      "of",
      "in",
      "on",
      "at",
      "with",
      "for",
      "from",
      "to",
      "and",
      "or",
      "but",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
    ]);
    const allContextWords = [];
    symptoms.forEach((sym) => {
      const words = sym
        .toLowerCase()
        .split(/[^a-zA-Z]/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
      allContextWords.push(...words);
    });
    const uniqueContextWords = [...new Set(allContextWords)];

    let allResults = [];

    // 2. Generate related Kent rubrics for every symptom
    // Use repertoryEngineInstance for intelligent rubric finding
    for (const symptom of symptoms) {
      const intelligentResults =
        await repertoryEngineInstance.findIntelligentRubrics(symptom);
      const finalRubricsForSymptom =
        intelligentResults[0]?.rubrics?.finalRubrics || [];

      finalRubricsForSymptom.forEach((entry) => {
        const bookPrefix = entry.source ? `[${entry.source}] ` : "[Complete] ";
        const chapterPrefix = entry.chapter ? `[${entry.chapter}]` : "";
        const fullDisplayString = `${bookPrefix}${chapterPrefix}${entry.rubric}`;

        allResults.push({
          target: fullDisplayString,
          id: entry.id,
          category: category,
          rating: entry.score, // Use score from intelligentResults
          symptomSource: symptom,
          chapter: entry.chapter,
          grade: entry.grade,
        });
      });
    }

    // Deduplicate results by rubric target/id
    const seen = new Set();
    const finalResponse = [];
    allResults.forEach((resItem) => {
      if (!seen.has(resItem.target)) {
        seen.add(resItem.target);
        finalResponse.push(resItem);
      }
    });

    // Sort final response by rating (highest context score first)
    finalResponse.sort((a, b) => b.rating - a.rating);

    // Slice to top 50 to keep the list clean and fast
    return res.status(200).json(finalResponse.slice(0, 50));
  } catch (err) {
    console.error("âŒ searchRubrics error:", err);
    return res.status(500).json({ error: "Live search execution failure." });
  }
};

// New function to generate rubric suggestions from a case summary

/**
 * Helper function to create structured symptom objects.
 * @param {string} fieldName - The field name (e.g., "Dreams").
 * @param {string} value - The raw symptom value (e.g., "Snakes").
 * @returns {object|null} A structured symptom object or null if value is empty.
 */
function createStructuredSymptom(fieldName, value) {
  if (!value) return null;
  return { field: fieldName, value: value.trim() };
}

/**
 * Helper function to process symptom values, handling comma-separated inputs and returning structured objects.
 * @param {string} fieldName - The field name for the structured symptom (e.g., "Cravings").
 * @param {string|string[]} value - The raw symptom value(s) from caseData.
 * @returns {object[]} An array of structured symptom objects.
 */
function processStructuredSymptomValue(fieldName, value) {
  if (!value) return [];

  let values = [];
  if (Array.isArray(value)) {
    values = value.map((v) => v.trim()).filter(Boolean);
  } else if (typeof value === "string") {
    // For backend processing, most personal history fields are treated as single symptoms
    // unless they are known to contain multiple values that need splitting (e.g., Modalities)
    // As the frontend now handles complex splitting for most fields, we largely take the value as is.
    values = [value.trim()];
  }

  return values
    .map((v) => createStructuredSymptom(fieldName, v))
    .filter(Boolean);
}

/**
 * Helper function to build a list of general symptoms from case data.
 * This now returns structured symptom objects.
 * @param {object} caseData - The case data object containing general symptoms.
 * @returns {object[]} An array of structured symptom objects.
 */
function buildGeneralSymptoms(caseData) {
  const generalSymptoms = [];

  // Helper to add a symptom if its value exists in caseData
  const addIfPresent = (fieldName, caseDataKey, label) => {
    if (caseData[caseDataKey]) {
      generalSymptoms.push(
        createStructuredSymptom(label || fieldName, caseData[caseDataKey]),
      );
    }
  };

  addIfPresent("Appetite", "appetite");
  addIfPresent("Cravings", "cravings");
  addIfPresent("Aversions", "Aversions"); // Correct casing
  addIfPresent("Thirst", "thirst");
  addIfPresent("Bowel", "bowel");
  addIfPresent("Urine", "urine"); // Added
  addIfPresent("Sleep", "sleep");
  addIfPresent("Dreams", "dreams");
  addIfPresent("Sweat", "sweat");
  addIfPresent("Habits", "habits"); // Added
  addIfPresent("Menstrual History", "menstrual"); // Added with label

  return generalSymptoms.filter(Boolean);
}

/**
 * Helper function to get a consistent string representation of a symptom.
 * @param {string|object} symptom - The symptom, which can be a string or a structured object {field, value}.
 * @returns {string} A string representation of the symptom.
 */
function getSymptomIdentifier(symptom) {
  if (
    typeof symptom === "object" &&
    symptom !== null &&
    symptom.field &&
    symptom.value
  ) {
    return `[${symptom.field}] ${symptom.value}`;
  }
  return String(symptom); // Ensure it's always a string
}

const analyzeCaseLegacy = async (req, res) => {
  console.log("Legacy analyzeCase API HIT");
  // For now, delegate to generateRubricSuggestionsFromCase
  await generateRubricSuggestionsFromCase(req, res);
};

const generateRubricSuggestionsFromCase = async (req, res) => {
  await initializeRepertoryEngine();
  console.log("AI Rubric API HIT");
  console.log("REQ BODY:", JSON.stringify(req.body, null, 2));
  console.log(
    "[AI-RUBRIC GENERATION DEBUG] Symptoms Type:",
    typeof req.body.symptoms,
  );
  console.log(
    "[AI-RUBRIC GENERATION DEBUG] Symptoms Is Array:",
    Array.isArray(req.body.symptoms),
  );
  console.log(
    "[AI-RUBRIC GENERATION DEBUG] Received Symptoms:",
    JSON.stringify(req.body.symptoms, null, 2),
  );
  console.log("Authorization Header:", req.headers.authorization);
  try {
    let groupedRubrics = {};
    const {
      structuredSymptoms = [],
      caseSummary,
      thermal,
      ...caseData
    } = req.body;

    console.log(
      "ðŸ” [API ROUTE HIT] Structured Symptoms (from frontend):",
      JSON.stringify(structuredSymptoms, null, 2),
    );
    console.log("ðŸŒ¡ï¸ [REQUEST BODY THERMAL STATE]:", thermal); // Log directly from req.body

    let allExtractedSymptoms = [...structuredSymptoms];

    // Extract physical generals from the entire caseData object (which now includes all personalHistory fields)
    // The frontend sends personalHistory fields directly at the top level of caseData.
    const personalHistorySymptoms = buildGeneralSymptoms(
      caseData.personalHistory || {},
    );
    console.log(
      "[CASE SHEET EXTRACTION] Personal History Generals:",
      JSON.stringify(personalHistorySymptoms, null, 2),
    );
    allExtractedSymptoms.push(...personalHistorySymptoms);

    // Handle caseSummary if it's still present and not handled by structuredSymptoms
    if (caseSummary) {
      const processedCaseSummarySymptoms = caseSummary
        .split(/[.!?]|\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => createStructuredSymptom("Case Summary", s)); // Add field information
      allExtractedSymptoms.push(...processedCaseSummarySymptoms);
    }

    // Deduplicate symptoms based on field and value
    const seenSymptoms = new Map();
    const uniqueFinalSymptoms = [];
    allExtractedSymptoms.flatMap(splitStructuredSymptoms).forEach((symptom) => {
      const symptomKey = `${symptom.field}:${symptom.value.toLowerCase()}`;
      if (!seenSymptoms.has(symptomKey)) {
        seenSymptoms.set(symptomKey, symptom);
        uniqueFinalSymptoms.push(symptom);
      }
    });

    // Filter out thermal-related symptoms from the final list for normal rubric search
    // A. repertoryController: req.body.structuredSymptoms
    console.log(
      "[DIAG] A. repertoryController - req.body.structuredSymptoms:",
      JSON.stringify(structuredSymptoms),
    );

    // A. repertoryController: exact symptom object for Cravings
    const cravingsSymptom = structuredSymptoms.find(
      (s) => s.field && s.field.toLowerCase() === "cravings",
    );
    if (cravingsSymptom) {
      console.log(
        "[DIAG] A. repertoryController - Exact symptom object for Cravings:",
        JSON.stringify(cravingsSymptom),
      );
    }
    // A. repertoryController: req.body.structuredSymptoms
    console.log(
      "[DIAG] A. repertoryController - req.body.structuredSymptoms:",
      JSON.stringify(structuredSymptoms),
    );
    // A. repertoryController: req.body.structuredSymptoms
    console.log(
      "[DIAG] A. repertoryController - req.body.structuredSymptoms:",
      JSON.stringify(structuredSymptoms),
    );
    const finalSymptomsForRubricSearch = uniqueFinalSymptoms.filter(
      (symptom) =>
        !(
          symptom.field === "Thermal" ||
          (typeof symptom.value === "string" &&
            (symptom.value.toLowerCase().includes("hot") ||
              symptom.value.toLowerCase().includes("chilly")) &&
            symptom.field === "Thermal")
        ),
    );
    const normalizedSymptoms = finalSymptomsForRubricSearch.flatMap((s) => {
      if (typeof s === "object" && s !== null && s.field && s.value) {
        return [s]; // Preserve structured symptom objects
      } else {
        console.log(
          "[TRACE CONTROLLER] clinicalInterpretation =",
          JSON.stringify(clinicalInterpretation, null, 2),
        );
        // Check if the string matches the "Field: Value" pattern
        const symptomString = String(s);
        const colonIndex = symptomString.indexOf(":");
        if (colonIndex > 0) {
          const field = symptomString.substring(0, colonIndex).trim();
          const value = symptomString.substring(colonIndex + 1).trim();
          // Ensure both field and value are not empty after trimming
          if (field && value) {
            return [{ field, value }];
          }
        }
        console.log(
          "[TRACE CONTROLLER] arguments to findIntelligentRubrics =",
          JSON.stringify(
            { enrichedSymptoms, clinicalInfo, isMatrixGeneration: true },
            null,
            2,
          ),
        );
        // If not a "Field: Value" pattern or if field/value are empty, use existing splitMultiSymptoms
        return splitMultiSymptoms(symptomString);
      }
    });
    console.log(
      "[DIAG] After flatMap - normalizedSymptoms:",
      JSON.stringify(normalizedSymptoms),
    );

    if (normalizedSymptoms.length === 0) {
      return res.status(400).json({
        error:
          "No symptoms provided for rubric suggestion after normalization.",
      });
    }

    console.log("[NORMAL RUBRIC SYMPTOMS] (Thermal excluded):");
    normalizedSymptoms.forEach((s) => console.log(`  ${s.field}: ${s.value}`));

    console.log("[PATIENT THERMAL STATE]:", thermal || "UNKNOWN");

    if (finalSymptomsForRubricSearch.length === 0) {
      return res.status(400).json({
        error:
          "No valid symptoms for rubric generation after extraction and thermal exclusion.",
      });
    }

    console.time("SymptomSearch");

    const symptomPromises = normalizedSymptoms.map(async (symptom) => {
      const symptomIdentifier = getSymptomIdentifier(symptom);
      let symptomRubricSuggestions = [];
      try {
        // Determine if it's a MIND symptom using physicianThinkingService
        const clinicalInterpretation =
          physicianThinkingService.inferClinicalMeaning(symptom);
        const isMindSymptom = clinicalInterpretation.isMindSymptom;

        // Use the singleton instance
        const intelligentResults =
          await repertoryEngineInstance.findIntelligentRubrics(
            symptom,
            isMindSymptom,
            clinicalInterpretation,
          );

        let finalRubricsForSymptom = [];
        intelligentResults.forEach((resEntry) => {
          if (resEntry?.rubrics?.finalRubrics) {
            finalRubricsForSymptom = finalRubricsForSymptom.concat(
              resEntry.rubrics.finalRubrics,
            );
          }
        });

        finalRubricsForSymptom.forEach((entry) => {
          const bookPrefix = entry.source
            ? `[${entry.source}] `
            : "[Complete] ";
          const chapterPrefix = entry.chapter ? `[${entry.chapter}]` : "";
          const fullDisplayString = `${bookPrefix}${chapterPrefix}${entry.rubric}`;

          symptomRubricSuggestions.push({
            target: fullDisplayString,
            id: entry.id,
            chapter: entry.chapter || "",
            grade: entry.grade || 1, // Default grade to 1 if not specified
            confidence: 1, // Placeholder for now, can be improved with more advanced scoring
            symptomSource: symptomIdentifier,
          });
        });
      } catch (error) {
        console.error(
          `âŒ Error processing symptom "${symptomIdentifier}":`,
          error,
        );
        // Return empty for this symptom on error. symptomRubricSuggestions will be empty.
      }
      return { symptomIdentifier, symptomRubricSuggestions };
      console.log(
        `[TRACE STAGE 1] interpretation: clinicalInterpretation: ${JSON.stringify(clinicalInterpretation, null, 2)}`,
      );
      console.log(
        `[TRACE STAGE 1] interpretation: allClinicalInterpretations: ${JSON.stringify(allClinicalInterpretations, null, 2)}`,
      );
    });

    const results = await Promise.all(symptomPromises);
    console.timeEnd("SymptomSearch");

    results.forEach(({ symptomIdentifier, symptomRubricSuggestions }) => {
      // Handle sympathy / wants sympathy specifically
      const lowerSymptomIdentifier = symptomIdentifier.toLowerCase();

      if (
        lowerSymptomIdentifier.includes("sympathy") ||
        lowerSymptomIdentifier.includes("wants sympathy")
      ) {
        if (!groupedRubrics["wants sympathy"]) {
          groupedRubrics["wants sympathy"] = [];
        }
        groupedRubrics["wants sympathy"].push(...symptomRubricSuggestions);
      } else if (symptomRubricSuggestions.length > 0) {
        groupedRubrics[symptomIdentifier] = symptomRubricSuggestions; // Removed slice to ensure full array of suggested rubrics
      } else {
        groupedRubrics[symptomIdentifier] = []; // Ensure all symptoms have an entry, even if empty
      }
    });

    const allRubrics = Object.values(groupedRubrics).flat();
    console.log(
      "Grouped Rubrics keys (to confirm all symptoms processed):",
      Object.keys(groupedRubrics),
    );
    console.log("ðŸ“¦ [BACKEND SENDING RESPONSE]:", {
      totalSymptomGroups: Object.keys(groupedRubrics).length,
      totalRubricsAcrossAllGroups: allRubrics.length,
      chaptersPresent: [...new Set(allRubrics.map((r) => r.chapter))],
    });
    console.log("ðŸ“¦ [SENDING GROUPED RUBRICS]:", Object.keys(groupedRubrics));

    // Log for Response

    return res.status(200).json(groupedRubrics);
  } catch (error) {
    console.error(
      "[AI-RUBRIC GENERATION ERROR] âŒ generateRubricSuggestionsFromCase error:",
      error.message,
    );
    console.error("[AI-RUBRIC GENERATION ERROR] Stack:", error.stack);
    return res
      .status(500)
      .json({ error: "Rubric suggestion generation failure." });
  }
};

const generateRepertoryMatrixData = async (req, res) => {
  console.log("Matrix Generation API HIT");
  await initializeRepertoryEngine();
  console.log("REQ BODY:", req.body);
  try {
    const rawSelectedRubrics = req.body.selectedRubrics || [];
    const thermal = req.body.thermal; // Extract thermal if needed, though not directly used in the output structure
    const caseData = req.body.caseData || {};
    // Safely handle selectedRubrics whether items are strings OR objects
    const selectedRubrics = rawSelectedRubrics
      .map((r) => {
        let rubricText = "";
        let rubricId = "";

        if (typeof r === "string") {
          rubricText = r;
          rubricId = r;
        } else if (typeof r === "object" && r !== null) {
          rubricText = r.rubric || r.name || "";
          rubricId = r.id || r.rubric || r.name || "";
        }

        // Strip out '[file.json]' and '[CHAPTER]' prefixes to get clean rubric name
        const cleanRubric = rubricText.replace(/^(\[.*?\]\s*)+/, "").trim();

        if (!cleanRubric) return null; // Filter out entries with empty clean rubrics

        return {
          rubric: cleanRubric,
          id: rubricId,
          chapter: r.chapter,
          grade: r.grade,
          source: r.source,
        };
      })
      .filter(Boolean);

    console.log(
      "Matrix Gen - Cleaned Selected Rubrics:",
      JSON.stringify(selectedRubrics, null, 2),
    );

    if (selectedRubrics.length === 0) {
      return res
        .status(400)
        .json({ error: "No rubrics selected for matrix generation." });
    }

    // Call the RepertoryEngine to analyze the case and build the matrix, passing thermal state separately
    const analysisResult = await repertoryEngineInstance.analyzeCase(
      selectedRubrics,
      {},
      { thermal: thermal },
    );

    // 9E SAFETY: existing red-flag service runs separately from remedy/repertory scoring.
    const safetySymptoms = [
      ...selectedRubrics.map((r) => r.rubric),
      ...(Array.isArray(req.body.structuredSymptoms)
        ? req.body.structuredSymptoms.flatMap((s) => {
            if (typeof s?.value !== "string") return [];
            return s.value
              .split(/,|;|\n/)
              .map((v) => v.trim())
              .filter(Boolean);
          })
        : []),
      ...(Array.isArray(caseData.mentalSymptoms)
        ? caseData.mentalSymptoms
        : []),
      ...(Array.isArray(caseData.chiefComplaints)
        ? caseData.chiefComplaints.flatMap((c) => [
            c?.complaint,
            c?.description,
            c?.modalities,
          ])
        : []),
      caseData.chiefComplaint,
      caseData.chiefComplaintDescription,
      caseData.historyPresentIllness,
      caseData.observationsByDoctor,
      caseData.familyHistory,
      caseData.generalRemarks,
      ...(caseData.pastHistory && typeof caseData.pastHistory === "object"
        ? Object.values(caseData.pastHistory)
        : []),
      ...(caseData.personalHistory &&
      typeof caseData.personalHistory === "object"
        ? Object.values(caseData.personalHistory)
        : []),
    ]
      .filter((v) => typeof v === "string" && v.trim())
      .map((v) => v.trim().toLowerCase());

    const safetyHistory = [
      caseData.historyPresentIllness,
      caseData.familyHistory,
      ...(caseData.pastHistory && typeof caseData.pastHistory === "object"
        ? Object.values(caseData.pastHistory)
        : []),
    ]
      .filter((v) => typeof v === "string" && v.trim())
      .join(" ")
      .toLowerCase();

    const safetyRemarks = [
      caseData.generalRemarks,
      caseData.observationsByDoctor,
    ]
      .filter((v) => typeof v === "string" && v.trim())
      .join(" ")
      .toLowerCase();

    const safetyAnalysis = clinicalRedFlagService.analyze({
      symptoms: safetySymptoms,
      age:
        caseData.age !== undefined &&
        caseData.age !== null &&
        String(caseData.age).trim() !== ""
          ? Number(caseData.age)
          : undefined,
      history: safetyHistory,
      remarks: safetyRemarks,
    });
    console.log(
      "Matrix Gen - Analysis Result:",
      JSON.stringify(analysisResult, null, 2),
    );

    // The analysisResult.matrix likely contains the mapping of rubrics to remedies and their grades.
    // The analysisResult.remedies should contain the graded remedies.

    const allRemedies = analysisResult.remedies; // All remedies with their scores and matched rubrics
    const allRubricsWithGrades = analysisResult.matrix; // The matrix already has rubric-remedy grades

    // Prepare remedies data for the response
    const remediesResponse = allRemedies.map((remedy, index) => {
      let symptomsCoveredCount = 0;
      const matchedRubricsData = remedy.matchedRubrics.map((mr) => {
        if (mr.grade > 0) {
          symptomsCoveredCount++;
        }
        return {
          name: mr.rubric,
          grade: mr.grade,
          effectiveGrade: mr.effectiveGrade,
          id: mr.id,
        };
      });

      const totalPossibleRubrics = selectedRubrics.length;
      const matchPercentage =
        totalPossibleRubrics > 0
          ? parseFloat(
              ((symptomsCoveredCount / totalPossibleRubrics) * 100).toFixed(2),
            )
          : 0;

      return {
        rank: index + 1, // Assign a rank based on the sorted order
        remedy: remedy.name,
        name: remedy.name, // Also include 'name' for consistency with matrix
        score: remedy.score || 0, // This is the 'score' from backend (weighted grade sum, pre-bonuses)
        finalScore: remedy.finalScore || 0, // This is the 'finalScore' from backend (weighted + bonuses)
        matchPercentage: matchPercentage,
        dominantMiasm: remedy.dominantMiasm || "N/A",
        thermalInfluence: remedy.thermalInfluence || "N/A",
        keynotes: remedy.keynotes || [], // Assuming keynotes are available in remedy object
        matchedRubrics: matchedRubricsData, // Ensure this includes name and grade
        explanation: remedy.explanation || "",
        justification: remedy.justification || "",
      };
    });

    // Prepare rubrics data for the response
    const flattenedMatrixRubrics = (
      Array.isArray(allRubricsWithGrades) ? allRubricsWithGrades : []
    ).flatMap((group) =>
      Array.isArray(group?.rubrics) ? group.rubrics : group ? [group] : [],
    );

    const rubricsResponse = selectedRubrics.map((selectedRubric) => {
      const rubricEntry = flattenedMatrixRubrics.find(
        (matrixRubric) => String(matrixRubric.id) === String(selectedRubric.id),
      );

      return {
        id: selectedRubric.id,
        rubric: selectedRubric.rubric,
        chapter: selectedRubric.chapter,
        priority_weight: selectedRubric.grade,
        remedies: rubricEntry ? rubricEntry.remedies : [],
      };
    });

    console.log(
      "Generated Matrix Data - Remedies Count:",
      remediesResponse.length,
    );
    console.log(
      "Generated Matrix Data - Remedies Count:",
      remediesResponse.length,
    );
    console.log(
      "Generated Matrix Data - ALL REMEDIES:",
      JSON.stringify(remediesResponse, null, 2),
    );
    console.log(
      "Generated Matrix Data - Rubrics Count:",
      rubricsResponse.length,
    );

    return res.status(200).json({
      success: true,
      safety: safetyAnalysis,
      matrixData: {
        remedies: remediesResponse, // Array of remedy objects (for compatibility, though classicalRankedRemedies will be primary for matrix display)
        classicalRankedRemedies: analysisResult.classicalRankedRemedies, // Full list of classically ranked remedies (up to 30) for the matrix
        top5ClassicalRemediesForPanel:
          analysisResult.top5ClassicalRemediesForPanel, // Top 5 for the panel
        rubrics: rubricsResponse, // Array of rubric objects with remedy grades mapping
      },
    });
    console.log(
      `[TRACE STAGE 7] controller final result: Finished processing request.`,
    );
  } catch (error) {
    console.error("âŒ generateRepertoryMatrixData error:", error);
    return res
      .status(500)
      .json({
        error: "Repertory matrix generation failure.",
        details: error.message,
      });
  }
};

module.exports = {
  searchRubrics,
  analyzeCaseLegacy, // Export analyzeCaseLegacy
  generateRubricSuggestionsFromCase,
  generateRepertoryMatrixData, // Export the new function
  initializeRepertoryEngine, // Export the initialization function
};
