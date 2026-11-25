/** @format */

// /** @format */

// const clinicalSymptomNormalizer = require("./clinicalSymptomNormalizer");
// const {
//   consultOntology,
//   normalizeChapterName,
//   getClinicalField,
// } = require("./clinicalOntologyService"); // Import normalizeChapterName and getClinicalField
// // const clinicalChapterIntelligenceService = require("./clinicalChapterIntelligenceService"); // Removed as per refactoring
let loadedClinicalAliases = {};
try {
  loadedClinicalAliases = require("../database/loadedClinicalAliases.json");
} catch (_) {
  try {
    loadedClinicalAliases = require("../../database/loadedClinicalAliases.json");
  } catch (__) {
    loadedClinicalAliases = {};
  }
}
// const ThermalInterpreter = require("./interpreters/ThermalInterpreter"); // New import
// const ThirstInterpreter = require("./interpreters/ThirstInterpreter"); // New import for ThirstInterpreter
// const AppetiteInterpreter = require("./interpreters/AppetiteInterpreter"); // New import for AppetiteInterpreter
// const SweatInterpreter = require("./interpreters/SweatInterpreter"); // New import for SweatInterpreter
// const SleepInterpreter = require("./interpreters/SleepInterpreter"); // New import for SleepInterpreter
// const DreamsInterpreter = require("./interpreters/DreamsInterpreter"); // New import for DreamsInterpreter
// const CravingsInterpreter = require("./interpreters/CravingsInterpreter"); // New import
// const AversionsInterpreter = require("./interpreters/AversionsInterpreter"); // New import
// const ChiefComplaintsInterpreter = require("./interpreters/ChiefComplaintsInterpreter"); // New import

// class PhysicianThinkingService {
//   constructor() {
//     // No longer need chapter-specific maps or problematic mappings here, removed for clarity and refactoring goals.
//     // Old chapter-specific maps and problematic ontology mappings have been removed as per refactoring requirements.
//   }

//   /**
// - Infers the clinical meaning of a symptom, its primary and secondary chapters, confidence, and search terms.
// - This refactored version uses clinical fields and ontology to determine chapter locking.
// - @param {object|string} symptomInput - The raw symptom text from the user (can be string or structured object).
// - @returns {object} An object containing original symptom, canonical symptom, primary chapter, secondary chapters,
// -                   global allowed chapters, rejected chapters, confidence, and search terms.

//    */
//   inferClinicalMeaning(symptomInput) {
//     let symptomValue =
//       typeof symptomInput === "object" &&
//       symptomInput !== null &&
//       symptomInput.value
//         ? symptomInput.value
//         : symptomInput;
//     console.log(`[DEBUG inferClinicalMeaning] symptomValue: ${symptomValue}`);

//     let fieldInterpreterResult = null;

//     const thermalInterpretation = ThermalInterpreter.interpret(symptomValue);
//     console.log(
//       `[DEBUG inferClinicalMeaning] ThermalInterpretation.handled: ${thermalInterpretation.handled}`,
//     );

//     if (thermalInterpretation.handled) {
//       // Populate chapterCandidates for direct interpreter results
//       let chapterCandidates = {};
//       if (thermalInterpretation.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(
//             thermalInterpretation.primaryChapter,
//           ).toUpperCase()
//         ] = 0.95;
//       }
//       (thermalInterpretation.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });
//       // Add GENERALITIES with a lower weight if not already covered
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       return {
//         ...thermalInterpretation,
//         detectedClinicalField: "THERMAL",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//       console.log(
//         `[DEBUG inferClinicalMeaning] ThirstInterpretation.handled: ${thirstInterpretation.handled}`,
//       );
//     }

//     // Interpret thirst-related symptoms
//     const thirstInterpretation = ThirstInterpreter.interpret(symptomValue);

//     if (thirstInterpretation.handled) {
//       let chapterCandidates = {};
//       if (thirstInterpretation.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(
//             thirstInterpretation.primaryChapter,
//           ).toUpperCase()
//         ] = 0.95;
//       }
//       (thirstInterpretation.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       return {
//         ...thirstInterpretation,
//         detectedClinicalField: "THIRST",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//       console.log(
//         `[DEBUG inferClinicalMeaning] AppetiteInterpretation.handled: ${appetiteInterpretation.handled}`,
//       );
//     }

//     // Interpret appetite-related symptoms
//     const appetiteInterpretation = AppetiteInterpreter.interpret(symptomValue);
//     if (appetiteInterpretation.handled) {
//       let chapterCandidates = {};
//       if (appetiteInterpretation.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(
//             appetiteInterpretation.primaryChapter,
//           ).toUpperCase()
//         ] = 0.95;
//       }
//       (appetiteInterpretation.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       return {
//         ...appetiteInterpretation,
//         detectedClinicalField: "APPETITE",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//       console.log(
//         `[DEBUG inferClinicalMeaning] SweatInterpretation.handled: ${sweatInterpretation.handled}`,
//       );
//     }

//     // Interpret sweat-related symptoms
//     const sweatInterpretation = SweatInterpreter.interpret(symptomValue);
//     if (sweatInterpretation.handled) {
//       let chapterCandidates = {};
//       if (sweatInterpretation.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(sweatInterpretation.primaryChapter).toUpperCase()
//         ] = 0.95;
//       }
//       (sweatInterpretation.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });

//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       return {
//         ...sweatInterpretation,
//         detectedClinicalField: "PERSPIRATION",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//       console.log(
//         `[DEBUG inferClinicalMeaning] SleepInterpretation.handled: ${sleepInterpretation.handled}`,
//       );
//     }

//     // Interpret sleep-related symptoms
//     let sleepInterpretationResult = { handled: false };
//     if (
//       typeof symptomInput === "object" &&
//       symptomInput !== null &&
//       symptomInput.field === "Sleep"
//     ) {
//       console.log(
//         `[PhysicianThinkingService] Calling SleepInterpreter for field 'Sleep' with value: ${symptomInput.value}`,
//       );
//       const sleepInterpreter = new SleepInterpreter();
//       sleepInterpretationResult = sleepInterpreter.interpret(
//         symptomInput.value,
//       );
//     } else if (typeof symptomInput === "string") {
//       console.log(
//         `[PhysicianThinkingService] Calling SleepInterpreter for string input: ${symptomInput}`,
//       );
//       const sleepInterpreter = new SleepInterpreter();

//       sleepInterpretationResult = sleepInterpreter.interpret(symptomInput);
//     }

//     if (sleepInterpretationResult.handled) {
//       let chapterCandidates = {};

//       console.log(
//         `[DEBUG inferClinicalMeaning] DreamsInterpretation.handled: ${dreamsInterpretation.handled}`,
//       );
//       if (sleepInterpretationResult.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(
//             sleepInterpretationResult.primaryChapter,
//           ).toUpperCase()
//         ] = 0.95;
//       }
//       (sleepInterpretationResult.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       console.log(
//         `[PhysicianThinkingService] SleepInterpreter handled: ${JSON.stringify(sleepInterpretationResult)}`,
//       );
//       return {
//         ...sleepInterpretationResult,
//         detectedClinicalField: "SLEEP / DREAMS",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//     }

//     // Interpret dreams-related symptoms

//     let dreamsInterpretationResult = { handled: false };
//     if (
//       typeof symptomInput === "object" &&
//       symptomInput !== null &&
//       symptomInput.field === "Dreams"
//     ) {
//       console.log(
//         `[PhysicianThinkingService] Calling DreamsInterpreter for field 'Dreams' with value: ${symptomInput.value}`,
//       );
//       const dreamsInterpreter = new DreamsInterpreter();
//       dreamsInterpretationResult = dreamsInterpreter.interpret(
//         symptomInput.value,
//       );
//     } else if (typeof symptomInput === "string") {
//       console.log(
//         `[PhysicianThinkingService] Calling DreamsInterpreter for string input: ${symptomInput}`,
//       );
//       const dreamsInterpreter = new DreamsInterpreter();
//       dreamsInterpretationResult = dreamsInterpreter.interpret(symptomInput);
//     }

//     if (dreamsInterpretationResult.handled) {
//       let chapterCandidates = {};
//       if (dreamsInterpretationResult.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(
//             dreamsInterpretationResult.primaryChapter,
//           ).toUpperCase()
//         ] = 0.95;
//       }
//       (dreamsInterpretationResult.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       console.log(
//         `[PhysicianThinkingService] DreamsInterpreter handled: ${JSON.stringify(dreamsInterpretationResult)}`,
//       );
//       return {
//         ...dreamsInterpretationResult,
//         detectedClinicalField: "SLEEP / DREAMS",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//     }

//     // Interpret cravings-related symptoms
//     let cravingsInterpretationResult = { handled: false };
//     if (
//       typeof symptomInput === "object" &&
//       symptomInput !== null &&
//       symptomInput.field === "cravings"
//     ) {
//       console.log(
//         `[PhysicianThinkingService] Calling CravingsInterpreter for structured symptomInput: ${JSON.stringify(symptomInput)}`,
//       );
//       const cravingsInterpreter = new CravingsInterpreter();
//       cravingsInterpretationResult =
//         cravingsInterpreter.interpret(symptomInput);
//     }
//     if (cravingsInterpretationResult.handled) {
//       let chapterCandidates = {};
//       if (cravingsInterpretationResult.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(
//             cravingsInterpretationResult.primaryChapter,
//           ).toUpperCase()
//         ] = 0.95;
//         // Add STOMACH to allowed chapters if it\'s a food/drinks craving, as many repertory rubrics are there.
//         if (
//           normalizeChapterName(
//             cravingsInterpretationResult.primaryChapter,
//           ).toUpperCase() ===
//           normalizeChapterName("FOOD AND DRINKS").toUpperCase()
//         ) {
//           chapterCandidates[normalizeChapterName("STOMACH").toUpperCase()] =
//             Math.max(
//               chapterCandidates[
//                 normalizeChapterName("STOMACH").toUpperCase()
//               ] || 0,
//               0.8,
//             );
//         }
//       }
//       (cravingsInterpretationResult.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       console.log(
//         `[PhysicianThinkingService] CravingsInterpreter handled: ${JSON.stringify(cravingsInterpretationResult)}`,
//       );
//       return {
//         ...cravingsInterpretationResult,
//         detectedClinicalField: "FOOD AND DRINKS",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//     }

//     let processedSymptomInput = symptomInput;

//     // Existing logic for general structured symptom input (legacy compatibility)
//     if (
//       typeof symptomInput === "object" &&
//       symptomInput !== null &&
//       "field" in symptomInput &&
//       "value" in symptomInput
//     ) {
//       // Convert structured object to legacy string format internally for backward compatibility
//       processedSymptomInput = `[${symptomInput.field}] ${symptomInput.value}`;
//       console.log(
//         `[PhysicianThinkingService] Converted structured input to legacy string: ${processedSymptomInput}`,
//       );
//     }

//     const normalizedSymptom = clinicalSymptomNormalizer.normalizeSymptom(
//       processedSymptomInput,
//     );
//     let canonicalSymptom = normalizedSymptom;
//     let interpretation = `Symptom: ${processedSymptomInput}`;
//     let chapterCandidates = {}; // New: stores { chapterName: weight }
//     let confidence = 0; // Overall confidence, will be adjusted
//     let detectedClinicalField = "UNKNOWN";
//     let isMindSymptomFlag = false; // Initialize the flag

//     // --- Specific handling for known problematic terms with desired canonical routing ---
//     if (
//       normalizedSymptom.includes("delayed menses") ||
//       normalizedSymptom.includes("scanty menses")
//     ) {
//       return {
//         originalSymptom: symptomInput,
//         canonicalSymptom: normalizedSymptom.includes("scanty")
//           ? "Scanty menses"
//           : "Delayed menses",
//         primaryChapter: normalizeChapterName("GENITALIA FEMALE").toUpperCase(),
//         chapterCandidates: {
//           [normalizeChapterName("GENITALIA FEMALE").toUpperCase()]: 0.95,
//           [normalizeChapterName("FEMALE").toUpperCase()]: 0.95,
//         },
//         confidence: 0.99, // High confidence as it's a direct override
//         searchTerms: [
//           normalizedSymptom,
//           "menses delayed",
//           "menses absent",
//           "menses scanty",
//         ],
//         detectedClinicalField: "GENITALIA FEMALE",
//         isMindSymptom: isMindSymptomFlag,
//       };
//     } else if (
//       normalizedSymptom.includes("weeping") ||
//       normalizedSymptom.includes("grief")
//     ) {
//       isMindSymptomFlag = true;
//       return {
//         originalSymptom: symptomInput,
//         canonicalSymptom: normalizedSymptom.includes("weeping")
//           ? "Weeping tendency"
//           : "Long lasting grief",
//         chapterCandidates: {
//           [normalizeChapterName("MIND").toUpperCase()]: 0.95,
//         },
//         confidence: 0.99,
//         searchTerms: [normalizedSymptom, "weeping", "grief", "sadness"],
//         detectedClinicalField: "MIND",
//         isMindSymptom: isMindSymptomFlag,
//       };
//     } else if (
//       /\b(headache|cephalalgia|head pain|pain in (?:the )?head|aching head)\b/i.test(
//         normalizedSymptom,
//       )
//     ) {
//       const canonicalHeadache = /\bthrobbing\b/i.test(normalizedSymptom)
//         ? "Throbbing headache"
//         : "Headache";
//       const headChapter = normalizeChapterName("HEAD").toUpperCase();
//       return {
//         originalSymptom: symptomInput,
//         canonicalSymptom: canonicalHeadache,
//         primaryChapter: headChapter,
//         chapterCandidates: {
//           [headChapter]: 0.99,
//         },
//         confidence: 0.99,
//         searchTerms: [
//           ...new Set([
//             normalizedSymptom,
//             canonicalHeadache,
//             "headache",
//             "head pain",
//             ...(canonicalHeadache === "Throbbing headache"
//               ? ["throbbing", "pulsating headache"]
//               : []),
//           ]),
//         ],
//         detectedClinicalField: "HEAD",
//         isMindSymptom: false,
//       };
//     } else if (
//       normalizedSymptom.includes("sympathy") ||
//       normalizedSymptom.includes("consolation")
//     ) {
//       isMindSymptomFlag = true;
//       return {
//         originalSymptom: symptomInput,
//         canonicalSymptom: "Wants sympathy",
//         chapterCandidates: {
//           [normalizeChapterName("MIND").toUpperCase()]: 0.99,
//         },
//         confidence: 0.99,
//         searchTerms: [
//           "consolation",
//           "consolation amel",
//           "sympathy",
//           "sympathy desire for",
//           "wants sympathy",
//           "desire sympathy",
//         ],
//         detectedClinicalField: "MIND",
//         isMindSymptom: isMindSymptomFlag,
//       };
//     }
//     // --- End specific handling ---

//     const aversionsInterpreterInstance = new AversionsInterpreter();
//     const aversionsInterpretation =
//       aversionsInterpreterInstance.interpret(symptomInput);
//     console.log(
//       `[DEBUG inferClinicalMeaning] AversionsInterpretation.handled: ${aversionsInterpretation.handled}`,
//     );
//     // Interpret aversions-related symptoms

//     if (aversionsInterpretation.handled) {
//       let chapterCandidates = {};
//       if (aversionsInterpretation.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(
//             aversionsInterpretation.primaryChapter,
//           ).toUpperCase()
//         ] = 0.95;
//       }
//       (aversionsInterpretation.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       console.log(
//         "\n--- physicianThinkingService.interpretSymptom() return object (Aversions) ---",
//       );
//       console.log(
//         "  canonicalSymptom:",
//         aversionsInterpretation.canonicalSymptom,
//       );
//       console.log("  primaryChapter:", aversionsInterpretation.primaryChapter);
//       console.log("  chapterCandidates:", chapterCandidates);
//       console.log("  searchTerms:", aversionsInterpretation.searchTerms);
//       console.log(
//         "------------------------------------------------------------------",
//       );

//       return {
//         ...aversionsInterpretation,
//         detectedClinicalField: "AVERSIONS",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//     }

//     // Interpret chief complaint symptoms
//     const chiefComplaintInterpretation =
//       new ChiefComplaintsInterpreter().interpret(symptomInput);
//     if (chiefComplaintInterpretation.handled) {
//       let chapterCandidates = {};
//       if (chiefComplaintInterpretation.primaryChapter) {
//         chapterCandidates[
//           normalizeChapterName(
//             chiefComplaintInterpretation.primaryChapter,
//           ).toUpperCase()
//         ] = 0.95;
//       }
//       (chiefComplaintInterpretation.secondaryChapters || []).forEach((chap) => {
//         chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
//           chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
//           0.7,
//         );
//       });
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();

//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities] || 0,
//         0.5,
//       );

//       console.log(
//         "\n--- physicianThinkingService.interpretSymptom() return object (Chief Complaint) ---",
//       );
//       console.log(
//         "  canonicalSymptom:",
//         chiefComplaintInterpretation.canonicalSymptom,
//       );
//       console.log(
//         "  primaryChapter:",
//         chiefComplaintInterpretation.primaryChapter,
//       );
//       console.log("  chapterCandidates:", chapterCandidates);
//       console.log("  searchTerms:", chiefComplaintInterpretation.searchTerms);
//       console.log(
//         "------------------------------------------------------------------",
//       );

//       return {
//         ...chiefComplaintInterpretation,
//         detectedClinicalField: "CHIEF_COMPLAINT",
//         chapterCandidates,
//         confidence: 0.95,
//       };
//     }

//     // Step 1: Consult Ontology for canonical symptom and initial chapter/field
//     const ontologyMatch = consultOntology(processedSymptomInput);
//     if (ontologyMatch) {
//       canonicalSymptom = ontologyMatch.canonicalSymptom;

//       interpretation = `Ontological interpretation: ${ontologyMatch.canonicalSymptom}`;

//       const primaryChapterFromOntology = normalizeChapterName(
//         this._getChapterFromClinicalField(ontologyMatch.clinicalField) ||
//           ontologyMatch.chapter,
//       ).toUpperCase();
//       detectedClinicalField = ontologyMatch.clinicalField;

//       // Set initial confidence based on ontology match type
//       let ontologyConfidence = 0;

//       switch (ontologyMatch.matchType) {
//         case "ontology_exact":
//           ontologyConfidence = 0.92;
//           break;
//         case "exact_synonym":
//           ontologyConfidence = 0.97;
//           break;
//         case "profile_alias":
//           ontologyConfidence = 0.95;
//           break;
//         case "ontology_synonym":
//           ontologyConfidence = 0.88;
//           break;

//         case "semantic_similarity":
//           ontologyConfidence = 0.8;
//           break;
//         case "token_similarity_only":
//           ontologyConfidence = 0.7;
//           break;
//         default:
//           ontologyConfidence = 0.5; // Fallback if matchType is unrecognized
//       }

//       // If the structured field maps directly to its dedicated knowledge profile, set confidence to 0.99.
//       const dedicatedKnowledgeProfiles = [
//         "thermal",
//         "thirst",
//         "dreams",
//         "sleep",
//         "sweat",
//         "appetite",
//         "stool",
//         "urine",
//         "cravings",
//         "aversions",
//       ];
//       if (
//         typeof symptomInput === "object" &&
//         symptomInput !== null &&
//         dedicatedKnowledgeProfiles.includes(symptomInput.field)
//       ) {
//         ontologyConfidence = 0.99;
//       }

//       // Populate chapterCandidates with the primary chapter from ontology and its weight
//       if (primaryChapterFromOntology) {
//         chapterCandidates[primaryChapterFromOntology.toUpperCase()] =
//           ontologyConfidence;
//       }
//       confidence = ontologyConfidence; // Set overall confidence based on ontology match
//       console.log(
//         `[ONTOLOGY MATCH] Input: "${processedSymptomInput}" -> Canonical: ${canonicalSymptom}, Chapter: ${primaryChapterFromOntology}, Field: ${detectedClinicalField}, Confidence: ${confidence}`,
//       );
//     }

//     // If no specific chapter candidates yet, or confidence is low, try clinical field detection to add more candidates or refine weights
//     if (Object.keys(chapterCandidates).length === 0 || confidence < 0.7) {
//       const fieldFromSymptomText = getClinicalField(processedSymptomInput);
//       if (fieldFromSymptomText !== "UNKNOWN") {
//         const chapterFromField =
//           this._getChapterFromClinicalField(fieldFromSymptomText);
//         if (chapterFromField) {
//           // If a specific clinical field is detected, give its corresponding chapter a strong weight
//           chapterCandidates[chapterFromField.toUpperCase()] = Math.max(
//             chapterCandidates[chapterFromField.toUpperCase()] || 0,
//             0.7,
//           );
//           detectedClinicalField = fieldFromSymptomText; // Update detectedClinicalField to the more specific one
//           confidence = Math.max(confidence, 0.7); // Boost overall confidence if a specific clinical field is found
//           console.log(
//             `[FIELD DETECTION] Input: "${processedSymptomInput}" -> Field: ${detectedClinicalField}, Candidate Chapter: ${chapterFromField}, Weight: ${chapterCandidates[chapterFromField]}`,
//           );
//         }
//       }
//     }

//     // Dynamic handling for low confidence or unknown clinical field
//     // This replaces the old GENERALITIES fallback and chapter locking logic
//     let candidateChapters;
//     candidateChapters = Object.keys(chapterCandidates);

//     if (confidence < 0.5 || detectedClinicalField === "UNKNOWN") {
//       const lowerInput = String(processedSymptomInput || "").toLowerCase();
//       const normalizedGeneralities =
//         normalizeChapterName("GENERALITIES").toUpperCase();

//       const hasBackKeywords =
//         /\b(back|lumbar|lumbago|spine|spinal|sacral|coccyx|cervical|dorsal)\b/i.test(
//           lowerInput,
//         );
//       const hasLimbKeywords =
//         /\b(leg|legs|thigh|calf|knee|ankle|foot|feet|toe|toes|arm|arms|hand|hands|shoulder|elbow|wrist|sciatica|radiating|limb)\b/i.test(
//           lowerInput,
//         );
//       const hasPainKeywords =
//         /\b(pain|ache|aching|throbbing|sharp|stabbing|burning|stiffness|numbness|tingling)\b/i.test(
//           lowerInput,
//         );

//       if (hasBackKeywords) {
//         const backChap = normalizeChapterName("BACK").toUpperCase();
//         chapterCandidates[backChap] = Math.max(
//           chapterCandidates[backChap] || 0,
//           0.75,
//         );
//       }

//       if (hasLimbKeywords) {
//         const extChap = normalizeChapterName("EXTREMITIES").toUpperCase();
//         chapterCandidates[extChap] = Math.max(
//           chapterCandidates[extChap] || 0,
//           0.75,
//         );
//       }

//       if (!hasBackKeywords && !hasLimbKeywords && !hasPainKeywords) {
//         const coreGlobalHubs = ["MIND", "GENERALITIES", "SLEEP", "DREAMS"];
//         coreGlobalHubs.forEach((hub) => {
//           const normalizedHub = normalizeChapterName(hub).toUpperCase();
//           chapterCandidates[normalizedHub] = Math.max(
//             chapterCandidates[normalizedHub] || 0,
//             0.4,
//           );
//         });
//       } else {
//         chapterCandidates[normalizedGeneralities] = Math.max(
//           chapterCandidates[normalizedGeneralities] || 0,
//           0.4,
//         );
//       }

//       if (
//         lowerInput.includes("skin") ||
//         lowerInput.includes("eruption") ||
//         lowerInput.includes("rash")
//       ) {
//         const normalizedSkin = normalizeChapterName("SKIN").toUpperCase();
//         chapterCandidates[normalizedSkin] = Math.max(
//           chapterCandidates[normalizedSkin] || 0,
//           0.5,
//         );
//       }

//       confidence = Math.max(confidence, 0.5);
//       console.log(
//         `[LOW CONFIDENCE FALLBACK] Targeted candidates (no spurious MIND/SLEEP/DREAMS on pain). Candidates: ${JSON.stringify(chapterCandidates)}`,
//       );
//     }

//     // Ensure GENERALITIES is always considered with a baseline weight if not already present
//     const normalizedGeneralities =
//       normalizeChapterName("GENERALITIES").toUpperCase();
//     if (!chapterCandidates[normalizedGeneralities]) {
//       chapterCandidates[normalizedGeneralities] = 0.15;
//     } else {
//       chapterCandidates[normalizedGeneralities] = Math.max(
//         chapterCandidates[normalizedGeneralities],
//         0.15,
//       );
//     }

//     // Special case for MIND/HEAD interaction, add as candidates
//     const normalizedMind = normalizeChapterName("MIND").toUpperCase();
//     const normalizedHead = normalizeChapterName("HEAD").toUpperCase();
//     if (
//       chapterCandidates[normalizedMind] &&
//       !chapterCandidates[normalizedHead]
//     ) {
//       chapterCandidates[normalizedHead] = Math.max(
//         chapterCandidates[normalizedHead] || 0,
//         chapterCandidates[normalizedMind] * 0.5,
//       );
//     } else if (
//       chapterCandidates[normalizedHead] &&
//       !chapterCandidates[normalizedMind]
//     ) {
//       chapterCandidates[normalizedMind] = Math.max(
//         chapterCandidates[normalizedMind] || 0,
//         chapterCandidates[normalizedHead] * 0.5,
//       );
//     }

//     // Determine if the symptom is a mind symptom based on chapter candidates or detected clinical field
//     if (detectedClinicalField === "MIND") {
//       isMindSymptomFlag = true;
//     }

//     // Ensure searchTerms only contains unique values and return the final object
//     let searchTerms = [
//       ...new Set([
//         symptomValue,
//         normalizedSymptom,
//         canonicalSymptom,
//         ...(ontologyMatch ? ontologyMatch.searchTerms : []),
//       ]),
//     ];

//     // Add parent-complaint context for description search without replacing the original symptom.
//     const parentComplaintContext =
//       typeof symptomInput === "object" &&
//       symptomInput !== null &&
//       typeof symptomInput.parentComplaintContext === "string"
//         ? symptomInput.parentComplaintContext.trim()
//         : "";

//     if (
//       parentComplaintContext &&
//       typeof symptomValue === "string" &&
//       symptomValue.trim() &&
//       !parentComplaintContext
//         .toLowerCase()
//         .includes(symptomValue.trim().toLowerCase())
//     ) {
//       searchTerms.push(`${parentComplaintContext} ${symptomValue.trim()}`);
//     }
//     // Expand concepts based on all candidate chapters, regardless of weight
//     // This ensures that even for lower confidence chapter assignments, expansion attempts are made.
//     for (const chapter in chapterCandidates) {
//       // Expand concepts if the chapter has any weight, or if it\'s a fallback chapter
//       if (
//         chapterCandidates[chapter] > 0 ||
//         ["MIND", "GENERALITIES", "SLEEP", "DREAMS"].includes(chapter)
//       ) {
//         const expandedConcepts = this._expandClinicalConcept(
//           canonicalSymptom,
//           chapter,
//         );
//         searchTerms.push(...expandedConcepts); // Add expanded terms to existing search terms
//       }
//     }

//     // Log for debugging
//     console.log(`\n--- Symptom Interpretation Debug ---`);
//     console.log(`Input: ${JSON.stringify(symptomInput)}`);
//     console.log(`Detected Clinical Field: ${detectedClinicalField}`);
//     console.log(`Chapter Candidates: ${JSON.stringify(chapterCandidates)}`);
//     console.log(`Overall Confidence: ${confidence}`);
//     console.log(`Is Mind Symptom: ${isMindSymptomFlag}`);
//     console.log(`-----------------------------------\n`);

//     const primaryChapter = Object.entries(chapterCandidates).sort(
//       (a, b) => b[1] - a[1],
//     )[0]?.[0];

//     return {
//       originalSymptom: symptomInput,
//       canonicalSymptom: canonicalSymptom,
//       primaryChapter,
//       chapterCandidates: chapterCandidates,
//       confidence: confidence,
//       searchTerms: [...new Set(searchTerms)],
//       detectedClinicalField: detectedClinicalField,
//       isMindSymptom: isMindSymptomFlag,
//     };
//   }

//   _getChapterFromClinicalField(clinicalField) {
//     switch (clinicalField) {
//       case "GENITALIA FEMALE":
//         return normalizeChapterName("GENITALIA FEMALE").toUpperCase();
//       case "SLEEP / DREAMS":
//         return normalizeChapterName("SLEEP").toUpperCase();
//       case "GENERALITIES":
//         return normalizeChapterName("GENERALITIES").toUpperCase();
//       case "RECTUM":
//         return normalizeChapterName("RECTUM").toUpperCase();
//       case "URINARY ORGANS":
//         return normalizeChapterName("URINARY ORGANS").toUpperCase();
//       case "RESPIRATION":
//         return normalizeChapterName("RESPIRATION").toUpperCase();
//       case "CHEST":
//         return normalizeChapterName("CHEST").toUpperCase();
//       case "HEAD":
//         return normalizeChapterName("HEAD").toUpperCase();
//       case "SKIN":
//         return normalizeChapterName("SKIN").toUpperCase();
//       case "MIND":
//         return normalizeChapterName("MIND").toUpperCase();
//       case "FACE":
//         return normalizeChapterName("FACE").toUpperCase();
//       case "MOUTH":
//         return normalizeChapterName("MOUTH").toUpperCase();
//       case "TEETH":
//         return normalizeChapterName("TEETH").toUpperCase();
//       case "THROAT":
//         return normalizeChapterName("THROAT").toUpperCase();
//       case "EXTERNAL THROAT":
//         return normalizeChapterName("EXTERNAL THROAT").toUpperCase();
//       case "STOMACH":
//         return normalizeChapterName("STOMACH").toUpperCase();
//       case "ABDOMEN":
//         return normalizeChapterName("ABDOMEN").toUpperCase();
//       case "FOOD AND DRINKS":
//         return normalizeChapterName("STOMACH").toUpperCase(); // Map Food and Drinks to Stomach or Generalities in repertory
//       case "THERMAL":
//         return normalizeChapterName("GENERALITIES").toUpperCase(); // Adding THERMAL mapping
//       case "THIRST":
//         return normalizeChapterName("GENERALITIES").toUpperCase(); // Adding THIRST mapping
//       case "APPETITE":
//         return normalizeChapterName("GENERALITIES").toUpperCase(); // Adding APPETITE mapping
//       case "PERSPIRATION":
//         return normalizeChapterName("GENERALITIES").toUpperCase(); // Adding PERSPIRATION mapping
//       case "SLEEP / DREAMS":
//         return normalizeChapterName("SLEEP").toUpperCase(); // Adding SLEEP / DREAMS mapping
//       case "CRAVINGS":
//         return normalizeChapterName("GENERALITIES").toUpperCase(); // Adding CRAVINGS mapping
//       case "AVERSIONS":
//         return normalizeChapterName("GENERALITIES").toUpperCase(); // Adding AVERSIONS mapping
//       case "BOWEL":
//         return normalizeChapterName("RECTUM").toUpperCase(); // Adding BOWEL mapping
//       case "CONSTITUTIONALGENERALS":
//         return normalizeChapterName("GENERALITIES").toUpperCase(); // Adding CONSTITUTIONALGENERALS mapping
//       default:
//         return null;
//     }
//   }

//   // _getSecondaryChaptersAndConfidence method is removed as its logic is integrated into inferClinicalMeaning

//   async inferChapterWithLocalLLM(symptomInput) {
//     const symptomValue =
//       typeof symptomInput === "object" && symptomInput !== null
//         ? symptomInput.value
//         : symptomInput;

//     if (typeof symptomValue !== "string" || !symptomValue.trim()) {
//       return null;
//     }

//     const cacheKey = symptomValue.trim().toLowerCase().replace(/\s+/g, " ");

//     if (!this._localLLMCache) {
//       this._localLLMCache = new Map();
//     }

//     if (this._localLLMCache.has(cacheKey)) {
//       return this._localLLMCache.get(cacheKey);
//     }

//     const chapters = this._getAllChapters();
//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 30000);

//     const prompt = [
//       "You are a repertory chapter classification assistant.",
//       "Classify the symptom using only the supplied chapter allowlist.",
//       "Choose the chapter directly matching the symptom, not its cause.",
//       "If the symptom clearly names a body part, select its matching chapter.",
//       "Examples: vertigo -> VERTIGO; ear pain -> EAR; eye pain -> EYE; skin eruption -> SKIN; anxiety -> MIND; pain in chest radiating left hand -> CHEST.",
//       "Allowed chapters: " + chapters.join(", "),
//       "Symptom: " + symptomValue.trim(),
//       'Return valid JSON only, with exactly one key: {"chapter":"EXACT_ALLOWED_CHAPTER"}.',
//     ].join("\n");

//     try {
//       const response = await fetch("http://localhost:11434/api/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           model: "qwen2.5:3b",
//           prompt,
//           stream: false,
//           format: "json",
//           options: {
//             temperature: 0,
//             num_predict: 16,
//           },
//         }),
//         signal: controller.signal,
//       });

//       if (!response.ok) {
//         return null;
//       }

//       const data = await response.json();
//       let parsedResponse;
//       try {
//         parsedResponse = JSON.parse(String(data.response || "").trim());
//       } catch {
//         console.warn("[LOCAL LLM] Rejected invalid JSON response.");
//         return null;
//       }

//       const output = String(parsedResponse.chapter || "")
//         .trim()
//         .toUpperCase();

//       const chapter = chapters.find(
//         (candidate) => candidate.toUpperCase() === output,
//       );

//       if (!chapter) {
//         console.warn("[LOCAL LLM] Rejected invalid chapter output:", output);
//         return null;
//       }

//       this._localLLMCache.set(cacheKey, chapter);
//       return chapter;
//     } catch (error) {
//       console.warn(
//         "[LOCAL LLM] Classification unavailable:",
//         error.name === "AbortError" ? "timeout" : error.message,
//       );
//       return null;
//     } finally {
//       clearTimeout(timeout);
//     }
//   }

//   _getAllChapters() {
//     // This array should ideally be dynamically loaded or managed, but for now, hardcode a comprehensive list.
//     // Ensure all these chapter names are consistently normalized.
//     return [
//       normalizeChapterName("MIND").toUpperCase(),
//       normalizeChapterName("VERTIGO").toUpperCase(),
//       normalizeChapterName("HEAD").toUpperCase(),
//       normalizeChapterName("EYE").toUpperCase(),
//       normalizeChapterName("EAR").toUpperCase(),
//       normalizeChapterName("NOSE").toUpperCase(),
//       normalizeChapterName("FACE").toUpperCase(),
//       normalizeChapterName("MOUTH").toUpperCase(),
//       normalizeChapterName("TEETH").toUpperCase(),
//       normalizeChapterName("THROAT").toUpperCase(),
//       normalizeChapterName("EXTERNAL THROAT").toUpperCase(),
//       normalizeChapterName("STOMACH").toUpperCase(),
//       normalizeChapterName("ABDOMEN").toUpperCase(),
//       normalizeChapterName("RECTUM").toUpperCase(),
//       normalizeChapterName("URINARY ORGANS").toUpperCase(),
//       normalizeChapterName("MALE GENITALIA").toUpperCase(),
//       normalizeChapterName("FEMALE GENITALIA").toUpperCase(),
//       normalizeChapterName("RESPIRATION").toUpperCase(),
//       normalizeChapterName("CHEST").toUpperCase(),
//       normalizeChapterName("BACK").toUpperCase(),
//       normalizeChapterName("EXTREMITIES").toUpperCase(),
//       normalizeChapterName("SLEEP").toUpperCase(),
//       normalizeChapterName("FEVER").toUpperCase(),
//       normalizeChapterName("PERSPIRATION").toUpperCase(),
//       normalizeChapterName("SKIN").toUpperCase(),
//       normalizeChapterName("GENERALITIES").toUpperCase(),
//       normalizeChapterName("FOOD AND DRINKS").toUpperCase(), // Added food and drinks chapter
//       // Removed some less common or ambiguous chapters for a core repertory set
//       // "STOOL", "URINE", "LARYNX AND TRACHEA", "COUGH", "CHILL", "CONDITIONS IN GENERAL", "NERVES", "BONES", "GLANDULAR", "CONSTITUTION",
//       // "TIME", "MODALITIES", "SENSATIONS IN GENERAL", "SIDE", "PALPITATION", "EXPECTORATION"
//     ];
//   }

//   /**
// - Expands a canonical clinical concept into a list of related search terms.
// - This should include canonical synonyms, clinical synonyms, potential parent rubrics, and sub-rubrics.
// - It\'s crucial this function leverages a comprehensive clinical vocabulary or ontology.
// - @param {string} canonicalSymptom The canonical form of the symptom.
// - @param {string} primaryChapter The determined primary chapter for the symptom.
// - @returns {Array<string>} An array of expanded search terms.
//    */
//   _expandClinicalConcept(canonicalSymptom, primaryChapter) {
//     const expandedTerms = new Set();
//     const lowerCanonicalSymptom = canonicalSymptom.toLowerCase();
//     expandedTerms.add(lowerCanonicalSymptom); // Always include the canonical symptom

//     // Add existing clinical aliases (canonical synonyms)
//     if (loadedClinicalAliases[lowerCanonicalSymptom]) {
//       loadedClinicalAliases[lowerCanonicalSymptom].forEach((alias) =>
//         expandedTerms.add(alias.toLowerCase()),
//       );
//     }

//     // Look for clinical synonyms in a more dynamic way (e.g., from ontology data if available)
//     const ontologyEntry = consultOntology(canonicalSymptom); // Re-consult ontology for richer info
//     if (ontologyEntry && ontologyEntry.synonyms) {
//       ontologyEntry.synonyms.forEach((syn) =>
//         expandedTerms.add(syn.toLowerCase()),
//       );
//     }
//     if (ontologyEntry && ontologyEntry.searchTerms) {
//       ontologyEntry.searchTerms.forEach((term) =>
//         expandedTerms.add(term.toLowerCase()),
//       );
//     }

//     // Access global.masterRepertory to find parent and sub-rubrics within the primary chapter
//     // The _expandClinicalConcept now takes a 'primaryChapter' which represents a high-confidence chapter
//     // for which to specifically find rubrics. This is used when iterating through the chapterCandidates.
//     if (global.masterRepertory && primaryChapter) {
//       const chapterSpecificRubrics = global.masterRepertory.filter(
//         (r) =>
//           normalizeChapterName(r.chapter).toUpperCase() ===
//           primaryChapter.toUpperCase(),
//       );

//       const canonicalTokens = lowerCanonicalSymptom
//         .split(/\s+/)
//         .filter(Boolean); // Moved outside the loop for efficiency

//       for (const rubricEntry of chapterSpecificRubrics) {
//         const rubricText = rubricEntry.rubric.toLowerCase();

//         // 1. Exact Rubric Match (already added, but good for completeness)
//         if (rubricText === lowerCanonicalSymptom) {
//           expandedTerms.add(rubricText);
//         }

//         // 2. Subrubric check: canonical symptom is a parent of this rubric
//         // A rubric is a subrubric if it starts with the canonical symptom followed by a comma or space
//         if (
//           rubricText.startsWith(lowerCanonicalSymptom + ",") ||
//           rubricText.startsWith(lowerCanonicalSymptom + " ")
//         ) {
//           expandedTerms.add(rubricText);
//         }

//         // 3. Parent Rubric check: this rubric is a parent of the canonical symptom
//         // This means the rubric text is present within the canonical symptom (but not identical)
//         // and the canonical symptom is not a sub-rubric of this rubric
//         if (
//           lowerCanonicalSymptom.includes(rubricText) &&
//           rubricText !== lowerCanonicalSymptom &&
//           !(
//             lowerCanonicalSymptom.startsWith(rubricText + ",") ||
//             lowerCanonicalSymptom.startsWith(rubricText + " ")
//           )
//         ) {
//           expandedTerms.add(rubricText);
//         }

//         // 4. Semantic similarity / Token Match (simple word overlap for now)
//         // This is a basic token match. More advanced semantic similarity would need an NLP model.
//         const rubricTokens = rubricText.split(/\s+/).filter(Boolean);

//         const hasOverlap = canonicalTokens.some((token) =>
//           rubricTokens.includes(token),
//         );
//         if (hasOverlap) {
//           expandedTerms.add(rubricText);
//         }
//       }
//     }

//     return Array.from(expandedTerms);
//   }
// }
// module.exports = new PhysicianThinkingService();
/** @format */

const clinicalSymptomNormalizer = require("./clinicalSymptomNormalizer");
const {
  consultOntology,
  normalizeChapterName,
  getClinicalField,
} = require("./clinicalOntologyService");

try {
  loadedClinicalAliases = require("../database/loadedClinicalAliases.json");
} catch (_) {
  try {
    loadedClinicalAliases = require("../../database/loadedClinicalAliases.json");
  } catch (__) {
    loadedClinicalAliases = {};
  }
}
const ThermalInterpreter = require("./interpreters/ThermalInterpreter");
const ThirstInterpreter = require("./interpreters/ThirstInterpreter");
const AppetiteInterpreter = require("./interpreters/AppetiteInterpreter");
const SweatInterpreter = require("./interpreters/SweatInterpreter");
const SleepInterpreter = require("./interpreters/SleepInterpreter");
const DreamsInterpreter = require("./interpreters/DreamsInterpreter");
const CravingsInterpreter = require("./interpreters/CravingsInterpreter");
const AversionsInterpreter = require("./interpreters/AversionsInterpreter");
const ChiefComplaintsInterpreter = require("./interpreters/ChiefComplaintsInterpreter");

const PARENT_COMPLAINT_CHAPTER_ALIASES = [
  {
    pattern:
      /\b(female\s+genitalia|genitalia\s+female|vagina\w*|vulva\w*|uterus|uterine|ovary|ovarian|cervix|cervical|menses|menstrual|menstruation|leucorrh\w*|leukorrh\w*)\b/i,
    chapter: "GENITALIA FEMALE",
  },
  {
    pattern: /\b(female\s+system|female|gynecolog\w*|gynaecolog\w*)\b/i,
    chapter: "FEMALE",
  },
  {
    pattern:
      /\b(male\s+reproductive\s+system|male\s+system|male\s+genitalia|genitalia\s+male|male|penis|penile|testis|testes|testicular|scrotum|scrotal|spermatic)\b/i,
    chapter: "MALE",
  },
  {
    pattern: /\b(nose|nasal|nostril\w*|sinus\w*|epistaxis|rhinitis|coryza)\b/i,
    chapter: "NOSE",
  },
  {
    pattern:
      /\b(rectum|rectal|anus|anal|hemorrhoid\w*|haemorrhoid\w*|piles|fissure\s+in\s+ano)\b/i,
    chapter: "RECTUM",
  },
  {
    pattern: /\b(headache|cephalalgia|migraine|head)\b/i,
    chapter: "HEAD",
  },
  {
    pattern: /\b(vertigo|dizziness|giddiness)\b/i,
    chapter: "VERTIGO",
  },
  {
    pattern: /\b(eye|eyes|ocular|vision|ophthalmi\w*|conjunctiv\w*)\b/i,
    chapter: "EYE",
  },
  {
    pattern: /\b(ear|ears|otic|otitis|hearing|tinnitus)\b/i,
    chapter: "EAR",
  },
  {
    pattern: /\b(face|facial)\b/i,
    chapter: "FACE",
  },
  {
    pattern: /\b(mouth|oral|tongue|gums|palate)\b/i,
    chapter: "MOUTH",
  },
  {
    pattern: /\b(tooth|teeth|dental|toothache)\b/i,
    chapter: "TEETH",
  },
  {
    pattern: /\b(external\s+throat|neck\s+glands|goiter|goitre)\b/i,
    chapter: "EXTERNAL THROAT",
  },
  {
    pattern: /\b(throat|pharyn\w*|tonsill?\w*|laryn\w*)\b/i,
    chapter: "THROAT",
  },
  {
    pattern: /\b(stomach|gastric|epigastri\w*|indigestion|dyspepsia)\b/i,
    chapter: "STOMACH",
  },
  {
    pattern: /\b(abdomen|abdominal|belly|umbilic\w*|inguinal|colic)\b/i,
    chapter: "ABDOMEN",
  },
  {
    pattern:
      /\b(urinary\s+organs|urinary|bladder|urethra\w*|kidney\w*|renal|cystitis)\b/i,
    chapter: "URINARY ORGANS",
  },
  {
    pattern:
      /\b(respiration|respiratory|breathing|dyspnea|dyspnoea|asthma\w*|bronch\w*)\b/i,
    chapter: "RESPIRATION",
  },
  {
    pattern: /\b(chest|thorax|thoracic|lungs|pulmonary|mammary|breast\w*)\b/i,
    chapter: "CHEST",
  },
  {
    pattern:
      /\b(back|lumbar|lumbago|spine|spinal|sacral|coccyx|cervical|dorsal|scapula\w*)\b/i,
    chapter: "BACK",
  },
  {
    pattern:
      /\b(extremities|limb\w*|arm\w*|hand\w*|finger\w*|shoulder\w*|elbow\w*|wrist\w*|leg\w*|thigh\w*|knee\w*|calf|ankle\w*|foot|feet|toe\w*|sciatica)\b/i,
    chapter: "EXTREMITIES",
  },
  {
    pattern:
      /\b(skin|cutaneous|dermat\w*|eruption\w*|rash|eczema|psoriasis)\b/i,
    chapter: "SKIN",
  },
  {
    pattern: /\b(sleep|insomnia|somnolence)\b/i,
    chapter: "SLEEP",
  },
  {
    pattern: /\b(mind|mental|emotion\w*|mood|anxiety|depression)\b/i,
    chapter: "MIND",
  },
  {
    pattern: /\b(generalities|general\s+system|constitutional)\b/i,
    chapter: "GENERALITIES",
  },
];

class PhysicianThinkingService {
  constructor() {}

  _resolveParentContextChapter(symptomInput) {
    if (typeof symptomInput !== "object" || symptomInput === null) {
      return null;
    }

    const explicitParentContext =
      typeof symptomInput.parentComplaintContext === "string"
        ? symptomInput.parentComplaintContext.trim()
        : typeof symptomInput.parentComplaint === "string"
          ? symptomInput.parentComplaint.trim()
          : "";

    const field =
      typeof symptomInput.field === "string"
        ? symptomInput.field.trim().toLowerCase()
        : "";
    const isChiefComplaint =
      field === "chief complaint" || field === "chief complaints";
    const rawContext =
      explicitParentContext ||
      (isChiefComplaint && typeof symptomInput.value === "string"
        ? symptomInput.value.trim()
        : "");

    if (!rawContext) {
      return null;
    }

    const cleanedContext = rawContext.replace(/\s+/g, " ").trim();
    const lowerContext = cleanedContext.toLowerCase();

    for (const rule of PARENT_COMPLAINT_CHAPTER_ALIASES) {
      if (rule.pattern.test(lowerContext)) {
        return {
          rawContext: cleanedContext,
          lockedChapter: rule.chapter,
          isChiefComplaint: !explicitParentContext && isChiefComplaint,
        };
      }
    }

    const allowedChapterSet = new Set([
      ...this._getAllChapters(),
      "FEMALE",
      "GENITALIA FEMALE",
      "MALE",
      "NOSE",
      "RECTUM",
    ]);

    const normalizedDirect = normalizeChapterName(cleanedContext).toUpperCase();
    if (normalizedDirect && allowedChapterSet.has(normalizedDirect)) {
      return {
        rawContext: cleanedContext,
        lockedChapter: normalizedDirect,
        isChiefComplaint: !explicitParentContext && isChiefComplaint,
      };
    }

    return null;
  }

  _finalizeClinicalMeaning(result, parentContextInfo, symptomValue) {
    const baseSearchTerms = Array.isArray(result.searchTerms)
      ? result.searchTerms.filter(Boolean)
      : [];

    if (!parentContextInfo || !parentContextInfo.lockedChapter) {
      return {
        ...result,
        searchTerms: [...new Set(baseSearchTerms)],
      };
    }

    const lockedChapter = parentContextInfo.lockedChapter;
    const rawContext = parentContextInfo.rawContext;
    const enrichedSearchTerms = [...baseSearchTerms];

    if (
      parentContextInfo.isChiefComplaint &&
      !enrichedSearchTerms.some(
        (term) =>
          typeof term === "string" &&
          term.toLowerCase() === rawContext.toLowerCase(),
      )
    ) {
      enrichedSearchTerms.push(rawContext);
    }

    if (
      typeof symptomValue === "string" &&
      symptomValue.trim() &&
      rawContext &&
      !rawContext.toLowerCase().includes(symptomValue.trim().toLowerCase())
    ) {
      enrichedSearchTerms.push(`${rawContext} ${symptomValue.trim()}`);
    }

    return {
      ...result,
      primaryChapter: lockedChapter,
      secondaryChapters: [],
      chapterCandidates: {
        [lockedChapter]: 0.99,
      },
      searchTerms: [...new Set(enrichedSearchTerms)],
      parentComplaintContext: rawContext,
      parentChapterLocked: true,
    };
  }

  /**
   * Infers the clinical meaning of a symptom, its primary and secondary chapters, confidence, and search terms.
   */
  inferClinicalMeaning(symptomInput) {
    const parentContextInfo = this._resolveParentContextChapter(symptomInput);

    let symptomValue =
      typeof symptomInput === "object" &&
      symptomInput !== null &&
      symptomInput.value
        ? symptomInput.value
        : symptomInput;
    console.log(`[DEBUG inferClinicalMeaning] symptomValue: ${symptomValue}`);
    if (parentContextInfo) {
      console.log(
        `[PARENT CONTEXT LOCK] Context: "${parentContextInfo.rawContext}" -> Locked Chapter: ${parentContextInfo.lockedChapter}`,
      );
    }

    const thermalInterpretation = ThermalInterpreter.interpret(symptomValue);
    console.log(
      `[DEBUG inferClinicalMeaning] ThermalInterpretation.handled: ${thermalInterpretation.handled}`,
    );

    if (thermalInterpretation.handled) {
      let chapterCandidates = {};
      if (thermalInterpretation.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(
            thermalInterpretation.primaryChapter,
          ).toUpperCase()
        ] = 0.95;
      }
      (thermalInterpretation.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      return this._finalizeClinicalMeaning(
        {
          ...thermalInterpretation,
          detectedClinicalField: "THERMAL",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    // Interpret thirst-related symptoms
    const thirstInterpretation = ThirstInterpreter.interpret(symptomValue);

    if (thirstInterpretation.handled) {
      let chapterCandidates = {};
      if (thirstInterpretation.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(
            thirstInterpretation.primaryChapter,
          ).toUpperCase()
        ] = 0.95;
      }
      (thirstInterpretation.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      return this._finalizeClinicalMeaning(
        {
          ...thirstInterpretation,
          detectedClinicalField: "THIRST",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    // Interpret appetite-related symptoms
    const appetiteInterpretation = AppetiteInterpreter.interpret(symptomValue);
    if (appetiteInterpretation.handled) {
      let chapterCandidates = {};
      if (appetiteInterpretation.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(
            appetiteInterpretation.primaryChapter,
          ).toUpperCase()
        ] = 0.95;
      }
      (appetiteInterpretation.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      return this._finalizeClinicalMeaning(
        {
          ...appetiteInterpretation,
          detectedClinicalField: "APPETITE",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    // Interpret sweat-related symptoms
    const sweatInterpretation = SweatInterpreter.interpret(symptomValue);
    if (sweatInterpretation.handled) {
      let chapterCandidates = {};
      if (sweatInterpretation.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(sweatInterpretation.primaryChapter).toUpperCase()
        ] = 0.95;
      }
      (sweatInterpretation.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });

      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      return this._finalizeClinicalMeaning(
        {
          ...sweatInterpretation,
          detectedClinicalField: "PERSPIRATION",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    // Interpret sleep-related symptoms
    let sleepInterpretationResult = { handled: false };
    if (
      typeof symptomInput === "object" &&
      symptomInput !== null &&
      symptomInput.field === "Sleep"
    ) {
      console.log(
        `[PhysicianThinkingService] Calling SleepInterpreter for field 'Sleep' with value: ${symptomInput.value}`,
      );
      const sleepInterpreter = new SleepInterpreter();
      sleepInterpretationResult = sleepInterpreter.interpret(
        { Sleep: symptomInput.value },
      );
    } else if (typeof symptomInput === "string") {
      console.log(
        `[PhysicianThinkingService] Calling SleepInterpreter for string input: ${symptomInput}`,
      );
      const sleepInterpreter = new SleepInterpreter();
      sleepInterpretationResult = sleepInterpreter.interpret({
        Sleep: symptomInput,
      });
    }

    if (sleepInterpretationResult.handled) {
      let chapterCandidates = {};
      if (sleepInterpretationResult.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(
            sleepInterpretationResult.primaryChapter,
          ).toUpperCase()
        ] = 0.95;
      }
      (sleepInterpretationResult.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      console.log(
        `[PhysicianThinkingService] SleepInterpreter handled: ${JSON.stringify(sleepInterpretationResult)}`,
      );
      return this._finalizeClinicalMeaning(
        {
          ...sleepInterpretationResult,
          detectedClinicalField: "SLEEP / DREAMS",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    // Interpret dreams-related symptoms
    let dreamsInterpretationResult = { handled: false };
    if (
      typeof symptomInput === "object" &&
      symptomInput !== null &&
      symptomInput.field === "Dreams"
    ) {
      console.log(
        `[PhysicianThinkingService] Calling DreamsInterpreter for field 'Dreams' with value: ${symptomInput.value}`,
      );
      const dreamsInterpreter = new DreamsInterpreter();
      dreamsInterpretationResult = dreamsInterpreter.interpret(
        symptomInput.value,
      );
    } else if (typeof symptomInput === "string") {
      console.log(
        `[PhysicianThinkingService] Calling DreamsInterpreter for string input: ${symptomInput}`,
      );
      const dreamsInterpreter = new DreamsInterpreter();
      dreamsInterpretationResult = dreamsInterpreter.interpret(symptomInput);
    }

    if (dreamsInterpretationResult.handled) {
      let chapterCandidates = {};
      if (dreamsInterpretationResult.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(
            dreamsInterpretationResult.primaryChapter,
          ).toUpperCase()
        ] = 0.95;
      }
      (dreamsInterpretationResult.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      console.log(
        `[PhysicianThinkingService] DreamsInterpreter handled: ${JSON.stringify(dreamsInterpretationResult)}`,
      );
      return this._finalizeClinicalMeaning(
        {
          ...dreamsInterpretationResult,
          detectedClinicalField: "SLEEP / DREAMS",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    // Interpret cravings-related symptoms
    let cravingsInterpretationResult = { handled: false };
    if (
      typeof symptomInput === "object" &&
      symptomInput !== null &&
      symptomInput.field === "cravings"
    ) {
      console.log(
        `[PhysicianThinkingService] Calling CravingsInterpreter for structured symptomInput: ${JSON.stringify(symptomInput)}`,
      );
      const cravingsInterpreter = new CravingsInterpreter();
      cravingsInterpretationResult =
        cravingsInterpreter.interpret(symptomInput);
    }
    if (cravingsInterpretationResult.handled) {
      let chapterCandidates = {};
      if (cravingsInterpretationResult.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(
            cravingsInterpretationResult.primaryChapter,
          ).toUpperCase()
        ] = 0.95;
        if (
          normalizeChapterName(
            cravingsInterpretationResult.primaryChapter,
          ).toUpperCase() ===
          normalizeChapterName("FOOD AND DRINKS").toUpperCase()
        ) {
          chapterCandidates[normalizeChapterName("STOMACH").toUpperCase()] =
            Math.max(
              chapterCandidates[
                normalizeChapterName("STOMACH").toUpperCase()
              ] || 0,
              0.8,
            );
        }
      }
      (cravingsInterpretationResult.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      console.log(
        `[PhysicianThinkingService] CravingsInterpreter handled: ${JSON.stringify(cravingsInterpretationResult)}`,
      );
      return this._finalizeClinicalMeaning(
        {
          ...cravingsInterpretationResult,
          detectedClinicalField: "FOOD AND DRINKS",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    let processedSymptomInput = symptomInput;

    // Existing logic for general structured symptom input (legacy compatibility)
    if (
      typeof symptomInput === "object" &&
      symptomInput !== null &&
      "field" in symptomInput &&
      "value" in symptomInput
    ) {
      processedSymptomInput = `[${symptomInput.field}] ${symptomInput.value}`;
      console.log(
        `[PhysicianThinkingService] Converted structured input to legacy string: ${processedSymptomInput}`,
      );
    }

    const normalizedSymptom = clinicalSymptomNormalizer.normalizeSymptom(
      processedSymptomInput,
    );
    let canonicalSymptom = normalizedSymptom;
    let chapterCandidates = {};
    let confidence = 0;
    let detectedClinicalField = "UNKNOWN";
    let isMindSymptomFlag = false;

    // --- Specific handling for known problematic terms with desired canonical routing ---
    if (
      normalizedSymptom.includes("delayed menses") ||
      normalizedSymptom.includes("scanty menses")
    ) {
      return this._finalizeClinicalMeaning(
        {
          originalSymptom: symptomInput,
          canonicalSymptom: normalizedSymptom.includes("scanty")
            ? "Scanty menses"
            : "Delayed menses",
          primaryChapter:
            normalizeChapterName("GENITALIA FEMALE").toUpperCase(),
          chapterCandidates: {
            [normalizeChapterName("GENITALIA FEMALE").toUpperCase()]: 0.95,
            [normalizeChapterName("FEMALE").toUpperCase()]: 0.95,
          },
          confidence: 0.99,
          searchTerms: [
            normalizedSymptom,
            "menses delayed",
            "menses absent",
            "menses scanty",
          ],
          detectedClinicalField: "GENITALIA FEMALE",
          isMindSymptom: isMindSymptomFlag,
        },
        parentContextInfo,
        symptomValue,
      );
    } else if (
      normalizedSymptom.includes("weeping") ||
      normalizedSymptom.includes("grief")
    ) {
      isMindSymptomFlag = true;
      return this._finalizeClinicalMeaning(
        {
          originalSymptom: symptomInput,
          canonicalSymptom: normalizedSymptom.includes("weeping")
            ? "Weeping tendency"
            : "Long lasting grief",
          primaryChapter: normalizeChapterName("MIND").toUpperCase(),
          chapterCandidates: {
            [normalizeChapterName("MIND").toUpperCase()]: 0.95,
          },
          confidence: 0.99,
          searchTerms: [normalizedSymptom, "weeping", "grief", "sadness"],
          detectedClinicalField: "MIND",
          isMindSymptom: isMindSymptomFlag,
        },
        parentContextInfo,
        symptomValue,
      );
    } else if (
      /\b(headache|cephalalgia|head pain|pain in (?:the )?head|aching head)\b/i.test(
        normalizedSymptom,
      )
    ) {
      const canonicalHeadache = /\bthrobbing\b/i.test(normalizedSymptom)
        ? "Throbbing headache"
        : "Headache";
      const headChapter = normalizeChapterName("HEAD").toUpperCase();
      return this._finalizeClinicalMeaning(
        {
          originalSymptom: symptomInput,
          canonicalSymptom: canonicalHeadache,
          primaryChapter: headChapter,
          chapterCandidates: {
            [headChapter]: 0.99,
          },
          confidence: 0.99,
          searchTerms: [
            ...new Set([
              normalizedSymptom,
              canonicalHeadache,
              "headache",
              "head pain",
              ...(canonicalHeadache === "Throbbing headache"
                ? ["throbbing", "pulsating headache"]
                : []),
            ]),
          ],
          detectedClinicalField: "HEAD",
          isMindSymptom: false,
        },
        parentContextInfo,
        symptomValue,
      );
    } else if (
      normalizedSymptom.includes("sympathy") ||
      normalizedSymptom.includes("consolation")
    ) {
      isMindSymptomFlag = true;
      return this._finalizeClinicalMeaning(
        {
          originalSymptom: symptomInput,
          canonicalSymptom: "Wants sympathy",
          primaryChapter: normalizeChapterName("MIND").toUpperCase(),
          chapterCandidates: {
            [normalizeChapterName("MIND").toUpperCase()]: 0.99,
          },
          confidence: 0.99,
          searchTerms: [
            "consolation",
            "consolation amel",
            "sympathy",
            "sympathy desire for",
            "wants sympathy",
            "desire sympathy",
          ],
          detectedClinicalField: "MIND",
          isMindSymptom: isMindSymptomFlag,
        },
        parentContextInfo,
        symptomValue,
      );
    }
    // --- End specific handling ---

    const aversionsInterpreterInstance = new AversionsInterpreter();
    const aversionsInterpretation =
      aversionsInterpreterInstance.interpret(symptomInput);
    console.log(
      `[DEBUG inferClinicalMeaning] AversionsInterpretation.handled: ${aversionsInterpretation.handled}`,
    );

    if (aversionsInterpretation.handled) {
      let chapterCandidates = {};
      if (aversionsInterpretation.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(
            aversionsInterpretation.primaryChapter,
          ).toUpperCase()
        ] = 0.95;
      }
      (aversionsInterpretation.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      return this._finalizeClinicalMeaning(
        {
          ...aversionsInterpretation,
          detectedClinicalField: "AVERSIONS",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    // Interpret chief complaint symptoms
    const chiefComplaintInterpretation =
      new ChiefComplaintsInterpreter().interpret(symptomInput);
    if (chiefComplaintInterpretation.handled) {
      let chapterCandidates = {};
      if (chiefComplaintInterpretation.primaryChapter) {
        chapterCandidates[
          normalizeChapterName(
            chiefComplaintInterpretation.primaryChapter,
          ).toUpperCase()
        ] = 0.95;
      }
      (chiefComplaintInterpretation.secondaryChapters || []).forEach((chap) => {
        chapterCandidates[normalizeChapterName(chap).toUpperCase()] = Math.max(
          chapterCandidates[normalizeChapterName(chap).toUpperCase()] || 0,
          0.7,
        );
      });
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();

      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities] || 0,
        0.5,
      );

      return this._finalizeClinicalMeaning(
        {
          ...chiefComplaintInterpretation,
          detectedClinicalField: "CHIEF_COMPLAINT",
          chapterCandidates,
          confidence: 0.95,
        },
        parentContextInfo,
        symptomValue,
      );
    }

    // Step 1: Consult Ontology for canonical symptom and initial chapter/field
    const ontologyMatch = consultOntology(processedSymptomInput);
    if (ontologyMatch) {
      canonicalSymptom = ontologyMatch.canonicalSymptom;

      const primaryChapterFromOntology = normalizeChapterName(
        this._getChapterFromClinicalField(ontologyMatch.clinicalField) ||
          ontologyMatch.chapter,
      ).toUpperCase();
      detectedClinicalField = ontologyMatch.clinicalField;

      let ontologyConfidence = 0;

      switch (ontologyMatch.matchType) {
        case "ontology_exact":
          ontologyConfidence = 0.92;
          break;
        case "exact_synonym":
          ontologyConfidence = 0.97;
          break;
        case "profile_alias":
          ontologyConfidence = 0.95;
          break;
        case "ontology_synonym":
          ontologyConfidence = 0.88;
          break;
        case "semantic_similarity":
          ontologyConfidence = 0.8;
          break;
        case "token_similarity_only":
          ontologyConfidence = 0.7;
          break;
        default:
          ontologyConfidence = 0.5;
      }

      const dedicatedKnowledgeProfiles = [
        "thermal",
        "thirst",
        "dreams",
        "sleep",
        "sweat",
        "appetite",
        "stool",
        "urine",
        "cravings",
        "aversions",
      ];
      if (
        typeof symptomInput === "object" &&
        symptomInput !== null &&
        dedicatedKnowledgeProfiles.includes(symptomInput.field)
      ) {
        ontologyConfidence = 0.99;
      }

      if (primaryChapterFromOntology) {
        chapterCandidates[primaryChapterFromOntology.toUpperCase()] =
          ontologyConfidence;
      }
      confidence = ontologyConfidence;
      console.log(
        `[ONTOLOGY MATCH] Input: "${processedSymptomInput}" -> Canonical: ${canonicalSymptom}, Chapter: ${primaryChapterFromOntology}, Field: ${detectedClinicalField}, Confidence: ${confidence}`,
      );
    }

    // If no specific chapter candidates yet, or confidence is low, try clinical field detection
    if (Object.keys(chapterCandidates).length === 0 || confidence < 0.7) {
      const fieldFromSymptomText = getClinicalField(processedSymptomInput);
      if (fieldFromSymptomText !== "UNKNOWN") {
        const chapterFromField =
          this._getChapterFromClinicalField(fieldFromSymptomText);
        if (chapterFromField) {
          chapterCandidates[chapterFromField.toUpperCase()] = Math.max(
            chapterCandidates[chapterFromField.toUpperCase()] || 0,
            0.7,
          );
          detectedClinicalField = fieldFromSymptomText;
          confidence = Math.max(confidence, 0.7);
          console.log(
            `[FIELD DETECTION] Input: "${processedSymptomInput}" -> Field: ${detectedClinicalField}, Candidate Chapter: ${chapterFromField}, Weight: ${chapterCandidates[chapterFromField]}`,
          );
        }
      }
    }

    if (confidence < 0.5 || detectedClinicalField === "UNKNOWN") {
      const lowerInput = String(processedSymptomInput || "").toLowerCase();
      const normalizedGeneralities =
        normalizeChapterName("GENERALITIES").toUpperCase();

      const hasBackKeywords =
        /\b(back|lumbar|lumbago|spine|spinal|sacral|coccyx|cervical|dorsal)\b/i.test(
          lowerInput,
        );
      const hasLimbKeywords =
        /\b(leg|legs|thigh|calf|knee|ankle|foot|feet|toe|toes|arm|arms|hand|hands|shoulder|elbow|wrist|sciatica|radiating|limb)\b/i.test(
          lowerInput,
        );
      const hasPainKeywords =
        /\b(pain|ache|aching|throbbing|sharp|stabbing|burning|stiffness|numbness|tingling)\b/i.test(
          lowerInput,
        );
      const hasModalityCues =
        /\b(worse|better|agg|amel|aggravat\w*|ameliorat\w*|rising|sitting|standing|lying|pressure|motion|rest|warm|warmth|cold|morning|night|evening|walking|moving)\b/i.test(
          lowerInput,
        );
      const hasExplicitMindCues =
        /\b(mind|mood|fear|anxiet\w*|anxious|worr\w*|ang\w*|irritab\w*|weep\w*|sad\w*|depress\w*|delusion\w*|hallucinat\w*|memory|concentrat\w*|restless\w*|consolation|anticipat\w*)\b/i.test(
          lowerInput,
        );

      if (hasBackKeywords) {
        const backChap = normalizeChapterName("BACK").toUpperCase();
        chapterCandidates[backChap] = Math.max(
          chapterCandidates[backChap] || 0,
          0.75,
        );
      }

      if (hasLimbKeywords) {
        const extChap = normalizeChapterName("EXTREMITIES").toUpperCase();
        chapterCandidates[extChap] = Math.max(
          chapterCandidates[extChap] || 0,
          0.75,
        );
      }

      if (!hasBackKeywords && !hasLimbKeywords && !hasPainKeywords) {
        if (hasModalityCues && !hasExplicitMindCues) {
          chapterCandidates[normalizedGeneralities] = Math.max(
            chapterCandidates[normalizedGeneralities] || 0,
            0.75,
          );
          if (
            /\b(rising|sitting|standing|lying|bending|stooping)\b/i.test(
              lowerInput,
            )
          ) {
            const backChap = normalizeChapterName("BACK").toUpperCase();
            chapterCandidates[backChap] = Math.max(
              chapterCandidates[backChap] || 0,
              0.5,
            );
          }
        } else {
          const coreGlobalHubs = ["MIND", "GENERALITIES", "SLEEP", "DREAMS"];
          coreGlobalHubs.forEach((hub) => {
            const normalizedHub = normalizeChapterName(hub).toUpperCase();
            chapterCandidates[normalizedHub] = Math.max(
              chapterCandidates[normalizedHub] || 0,
              0.4,
            );
          });
        }
      } else {
        chapterCandidates[normalizedGeneralities] = Math.max(
          chapterCandidates[normalizedGeneralities] || 0,
          0.4,
        );
      }

      if (
        lowerInput.includes("skin") ||
        lowerInput.includes("eruption") ||
        lowerInput.includes("rash")
      ) {
        const normalizedSkin = normalizeChapterName("SKIN").toUpperCase();
        chapterCandidates[normalizedSkin] = Math.max(
          chapterCandidates[normalizedSkin] || 0,
          0.5,
        );
      }

      confidence = Math.max(confidence, 0.5);
      console.log(
        `[LOW CONFIDENCE FALLBACK] Targeted candidates. Candidates: ${JSON.stringify(chapterCandidates)}`,
      );
    }

    // Ensure GENERALITIES is always considered with a baseline weight if not already present
    const normalizedGeneralities =
      normalizeChapterName("GENERALITIES").toUpperCase();
    if (!chapterCandidates[normalizedGeneralities]) {
      chapterCandidates[normalizedGeneralities] = 0.15;
    } else {
      chapterCandidates[normalizedGeneralities] = Math.max(
        chapterCandidates[normalizedGeneralities],
        0.15,
      );
    }

    // Special case for MIND/HEAD interaction, add as candidates
    const normalizedMind = normalizeChapterName("MIND").toUpperCase();
    const normalizedHead = normalizeChapterName("HEAD").toUpperCase();
    if (
      chapterCandidates[normalizedMind] &&
      !chapterCandidates[normalizedHead]
    ) {
      chapterCandidates[normalizedHead] = Math.max(
        chapterCandidates[normalizedHead] || 0,
        chapterCandidates[normalizedMind] * 0.5,
      );
    } else if (
      chapterCandidates[normalizedHead] &&
      !chapterCandidates[normalizedMind]
    ) {
      chapterCandidates[normalizedMind] = Math.max(
        chapterCandidates[normalizedMind] || 0,
        chapterCandidates[normalizedHead] * 0.5,
      );
    }

    if (detectedClinicalField === "MIND") {
      isMindSymptomFlag = true;
    }

    let searchTerms = [
      ...new Set([
        symptomValue,
        normalizedSymptom,
        canonicalSymptom,
        ...(ontologyMatch ? ontologyMatch.searchTerms : []),
      ]),
    ];

    const expansionChapters = parentContextInfo
      ? [parentContextInfo.lockedChapter]
      : Object.keys(chapterCandidates);

    for (const chapter of expansionChapters) {
      if (
        parentContextInfo ||
        chapterCandidates[chapter] > 0 ||
        ["MIND", "GENERALITIES", "SLEEP", "DREAMS"].includes(chapter)
      ) {
        const expandedConcepts = this._expandClinicalConcept(
          canonicalSymptom,
          chapter,
        );
        searchTerms.push(...expandedConcepts);
      }
    }

    const primaryChapter = Object.entries(chapterCandidates).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    const finalizedResult = this._finalizeClinicalMeaning(
      {
        originalSymptom: symptomInput,
        canonicalSymptom: canonicalSymptom,
        primaryChapter,
        chapterCandidates: chapterCandidates,
        confidence: confidence,
        searchTerms: [...new Set(searchTerms)],
        detectedClinicalField: detectedClinicalField,
        isMindSymptom: isMindSymptomFlag,
      },
      parentContextInfo,
      symptomValue,
    );

    console.log(`\n--- Symptom Interpretation Debug ---`);
    console.log(`Input: ${JSON.stringify(symptomInput)}`);
    console.log(
      `Detected Clinical Field: ${finalizedResult.detectedClinicalField}`,
    );
    console.log(`Primary Chapter: ${finalizedResult.primaryChapter}`);
    console.log(
      `Chapter Candidates: ${JSON.stringify(finalizedResult.chapterCandidates)}`,
    );
    console.log(`Overall Confidence: ${finalizedResult.confidence}`);
    console.log(`Is Mind Symptom: ${finalizedResult.isMindSymptom}`);
    console.log(`-----------------------------------\n`);

    return finalizedResult;
  }

  _getChapterFromClinicalField(clinicalField) {
    switch (clinicalField) {
      case "FEMALE":
        return "FEMALE";
      case "GENITALIA FEMALE":
        return normalizeChapterName("GENITALIA FEMALE").toUpperCase();
      case "MALE":
      case "MALE GENITALIA":
      case "GENITALIA MALE":
        return "MALE";
      case "NOSE":
        return "NOSE";
      case "RECTUM":
        return "RECTUM";
      case "SLEEP / DREAMS":
        return normalizeChapterName("SLEEP").toUpperCase();
      case "GENERALITIES":
        return normalizeChapterName("GENERALITIES").toUpperCase();
      case "URINARY ORGANS":
        return normalizeChapterName("URINARY ORGANS").toUpperCase();
      case "RESPIRATION":
        return normalizeChapterName("RESPIRATION").toUpperCase();
      case "CHEST":
        return normalizeChapterName("CHEST").toUpperCase();
      case "HEAD":
        return normalizeChapterName("HEAD").toUpperCase();
      case "SKIN":
        return normalizeChapterName("SKIN").toUpperCase();
      case "MIND":
        return normalizeChapterName("MIND").toUpperCase();
      case "FACE":
        return normalizeChapterName("FACE").toUpperCase();
      case "MOUTH":
        return normalizeChapterName("MOUTH").toUpperCase();
      case "TEETH":
        return normalizeChapterName("TEETH").toUpperCase();
      case "THROAT":
        return normalizeChapterName("THROAT").toUpperCase();
      case "EXTERNAL THROAT":
        return normalizeChapterName("EXTERNAL THROAT").toUpperCase();
      case "STOMACH":
        return normalizeChapterName("STOMACH").toUpperCase();
      case "ABDOMEN":
        return normalizeChapterName("ABDOMEN").toUpperCase();
      case "FOOD AND DRINKS":
        return normalizeChapterName("STOMACH").toUpperCase();
      case "THERMAL":
        return normalizeChapterName("GENERALITIES").toUpperCase();
      case "THIRST":
        return normalizeChapterName("GENERALITIES").toUpperCase();
      case "APPETITE":
        return normalizeChapterName("GENERALITIES").toUpperCase();
      case "PERSPIRATION":
        return normalizeChapterName("GENERALITIES").toUpperCase();
      case "CRAVINGS":
        return normalizeChapterName("GENERALITIES").toUpperCase();
      case "AVERSIONS":
        return normalizeChapterName("GENERALITIES").toUpperCase();
      case "BOWEL":
        return normalizeChapterName("RECTUM").toUpperCase();
      case "CONSTITUTIONALGENERALS":
        return normalizeChapterName("GENERALITIES").toUpperCase();
      default:
        return null;
    }
  }

  async inferChapterWithLocalLLM(symptomInput) {
    const symptomValue =
      typeof symptomInput === "object" && symptomInput !== null
        ? symptomInput.value
        : symptomInput;

    if (typeof symptomValue !== "string" || !symptomValue.trim()) {
      return null;
    }

    const cacheKey = symptomValue.trim().toLowerCase().replace(/\s+/g, " ");

    if (!this._localLLMCache) {
      this._localLLMCache = new Map();
    }

    if (this._localLLMCache.has(cacheKey)) {
      return this._localLLMCache.get(cacheKey);
    }

    const chapters = this._getAllChapters();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const prompt = [
      "You are a repertory chapter classification assistant.",
      "Classify the symptom using only the supplied chapter allowlist.",
      "Choose the chapter directly matching the symptom, not its cause.",
      "If the symptom clearly names a body part, select its matching chapter.",
      "Examples: vertigo -> VERTIGO; ear pain -> EAR; eye pain -> EYE; skin eruption -> SKIN; anxiety -> MIND; pain in chest radiating left hand -> CHEST.",
      "Allowed chapters: " + chapters.join(", "),
      "Symptom: " + symptomValue.trim(),
      'Return valid JSON only, with exactly one key: {"chapter":"EXACT_ALLOWED_CHAPTER"}.',
    ].join("\n");

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5:3b",
          prompt,
          stream: false,
          format: "json",
          options: {
            temperature: 0,
            num_predict: 16,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(String(data.response || "").trim());
      } catch {
        console.warn("[LOCAL LLM] Rejected invalid JSON response.");
        return null;
      }

      const output = String(parsedResponse.chapter || "")
        .trim()
        .toUpperCase();

      const chapter = chapters.find(
        (candidate) => candidate.toUpperCase() === output,
      );

      if (!chapter) {
        console.warn("[LOCAL LLM] Rejected invalid chapter output:", output);
        return null;
      }

      this._localLLMCache.set(cacheKey, chapter);
      return chapter;
    } catch (error) {
      console.warn(
        "[LOCAL LLM] Classification unavailable:",
        error.name === "AbortError" ? "timeout" : error.message,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  _getAllChapters() {
    return [
      normalizeChapterName("MIND").toUpperCase(),
      normalizeChapterName("VERTIGO").toUpperCase(),
      normalizeChapterName("HEAD").toUpperCase(),
      normalizeChapterName("EYE").toUpperCase(),
      normalizeChapterName("EAR").toUpperCase(),
      normalizeChapterName("NOSE").toUpperCase(),
      normalizeChapterName("FACE").toUpperCase(),
      normalizeChapterName("MOUTH").toUpperCase(),
      normalizeChapterName("TEETH").toUpperCase(),
      normalizeChapterName("THROAT").toUpperCase(),
      normalizeChapterName("EXTERNAL THROAT").toUpperCase(),
      normalizeChapterName("STOMACH").toUpperCase(),
      normalizeChapterName("ABDOMEN").toUpperCase(),
      normalizeChapterName("RECTUM").toUpperCase(),
      normalizeChapterName("URINARY ORGANS").toUpperCase(),
      normalizeChapterName("MALE GENITALIA").toUpperCase(),
      normalizeChapterName("FEMALE GENITALIA").toUpperCase(),
      normalizeChapterName("RESPIRATION").toUpperCase(),
      normalizeChapterName("CHEST").toUpperCase(),
      normalizeChapterName("BACK").toUpperCase(),
      normalizeChapterName("EXTREMITIES").toUpperCase(),
      normalizeChapterName("SLEEP").toUpperCase(),
      normalizeChapterName("FEVER").toUpperCase(),
      normalizeChapterName("PERSPIRATION").toUpperCase(),
      normalizeChapterName("SKIN").toUpperCase(),
      normalizeChapterName("GENERALITIES").toUpperCase(),
      normalizeChapterName("FOOD AND DRINKS").toUpperCase(),
    ];
  }

  _expandClinicalConcept(canonicalSymptom, primaryChapter) {
    const expandedTerms = new Set();
    const lowerCanonicalSymptom = canonicalSymptom.toLowerCase();
    expandedTerms.add(lowerCanonicalSymptom);

    if (loadedClinicalAliases[lowerCanonicalSymptom]) {
      loadedClinicalAliases[lowerCanonicalSymptom].forEach((alias) =>
        expandedTerms.add(alias.toLowerCase()),
      );
    }

    const ontologyEntry = consultOntology(canonicalSymptom);
    if (ontologyEntry && ontologyEntry.synonyms) {
      ontologyEntry.synonyms.forEach((syn) =>
        expandedTerms.add(syn.toLowerCase()),
      );
    }
    if (ontologyEntry && ontologyEntry.searchTerms) {
      ontologyEntry.searchTerms.forEach((term) =>
        expandedTerms.add(term.toLowerCase()),
      );
    }

    if (global.masterRepertory && primaryChapter) {
      const chapterSpecificRubrics = global.masterRepertory.filter(
        (r) =>
          normalizeChapterName(r.chapter).toUpperCase() ===
          primaryChapter.toUpperCase(),
      );

      const canonicalTokens = lowerCanonicalSymptom
        .split(/\s+/)
        .filter(Boolean);

      for (const rubricEntry of chapterSpecificRubrics) {
        const rubricText = rubricEntry.rubric.toLowerCase();

        if (rubricText === lowerCanonicalSymptom) {
          expandedTerms.add(rubricText);
        }

        if (
          rubricText.startsWith(lowerCanonicalSymptom + ",") ||
          rubricText.startsWith(lowerCanonicalSymptom + " ")
        ) {
          expandedTerms.add(rubricText);
        }

        if (
          lowerCanonicalSymptom.includes(rubricText) &&
          rubricText !== lowerCanonicalSymptom &&
          !(
            lowerCanonicalSymptom.startsWith(rubricText + ",") ||
            lowerCanonicalSymptom.startsWith(rubricText + " ")
          )
        ) {
          expandedTerms.add(rubricText);
        }

        const rubricTokens = rubricText.split(/\s+/).filter(Boolean);
        const hasOverlap = canonicalTokens.some((token) =>
          rubricTokens.includes(token),
        );
        if (hasOverlap) {
          expandedTerms.add(rubricText);
        }
      }
    }

    return Array.from(expandedTerms);
  }
}

module.exports = new PhysicianThinkingService();



