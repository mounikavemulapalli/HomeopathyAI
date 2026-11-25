/**
 * RepertoryEngine (Classical Case Analysis Version)
 * Transforms multiple symptom inputs into a weighted clinical totality.
 * Converted to ES Modules and fully aligned with your Mongoose DB Architecture.
 *
 * @format
 */
const NodeCache = require("node-cache");
const { loadMasterRepertory } = require("./repertoryLoaderService.cjs");
const { normalizeChapterName } = require("./clinicalOntologyService");

const remedyScoringService = require("./remedyScoringService");
const physicianThinkingService = require("./physicianThinkingService"); // New import
const clinicalChapterIntelligenceService = require("./clinicalChapterIntelligenceService"); // Import the new service
const masterRubricSearchService = require("./masterRubricSearchService.cjs"); // Import the master rubric search service
const { splitMultiSymptoms } = require("./clinicalSymptomNormalizer"); // Import the new utility
const { categorizeSymptom } = require("./constitutionalPriorityService"); // Import the new constitutional priority service
const { remedyEssences, analyzeEssence } = require("./remedyEssenceService"); // Import the new remedy essence service
const remedyDifferentiationService = require("./remedyDifferentiationService"); // Import the new remedy differentiation service
const miasmaticIntelligenceService = require("./miasmaticIntelligenceService"); // Import the new miasmatic intelligence service
const caseClassificationService = require("./caseClassificationService"); // Import the new case classification service
const keynoteConfirmationService = require("./keynoteConfirmationService"); // Import the new keynote confirmation service
const clinicalContradictionService = require("./clinicalContradictionService"); // Import the new clinical contradiction service
const {
  calculatePrescriptionConfidence,
} = require("./prescriptionConfidenceService");
const { getThermalClassification } = require("./ThermalLookupService"); // Import the new ThermalLookupService
// const materiaMedicaService = require("./materiaMedicaService");
// Safe dynamic modules injection fallback systems
let queryDecompositionService = {
  parse: (q) => ({ tasks: [], parsedComponents: {} }), // Changed from decompose to parse
};
let rubricTreeSearchService = { treeSearch: async () => ({ results: [] }) };
let rubricTreeIndexService = { parsePath: (p) => [p], isModality: () => false };
let semanticRubricSearch = async () => [];

try {
  const decomposition = require("./QueryParserService"); // Corrected filename
  queryDecompositionService = decomposition.default || decomposition;
} catch (e) {
  console.warn("âš ï¸ queryDecompositionService path loading bypassed.");
}

try {
  const treeSearch = require("./rubricTreeSearchService");
  rubricTreeSearchService = treeSearch.default || treeSearch;
} catch (e) {
  console.warn("âš ï¸ rubricTreeSearchService path loading bypassed.");
}

try {
  const treeIndex = require("./rubricTreeIndexService");
  rubricTreeIndexService = treeIndex.default || treeIndex;
} catch (e) {
  console.warn("âš ï¸ rubricTreeIndexService path loading bypassed.");
}

try {
  const semSearch = require("./semanticSearch");
  semanticRubricSearch =
    semSearch.semanticRubricSearch || semSearch.default || semSearch;
} catch (e) {
  console.warn("âš ï¸ semanticRubricSearch core functions bypassed.");
}

const CONSTITUTIONAL_CACHE_TTL = 3600; // 1 hour
const CONSTITUTIONAL_CACHE_MAX_KEYS = 100;
const constitutionalCache = new NodeCache({
  stdTTL: CONSTITUTIONAL_CACHE_TTL,
  maxKeys: CONSTITUTIONAL_CACHE_MAX_KEYS,
});

const MIN_RUBRIC_SCORE_THRESHOLD = 500; // Minimum score for a rubric to be considered valid after filtering

const TIMEOUT_MS = 10000; // 10 seconds
const visitedSymptoms = new Set();

// Timing Utility
const timing = {};
function startTimer(stage) {
  timing[stage] = { start: process.hrtime.bigint() };
}
function endTimer(stage) {
  if (timing[stage] && timing[stage].start) {
    timing[stage].end = process.hrtime.bigint();
    timing[stage].duration =
      Number(timing[stage].end - timing[stage].start) / 1_000_000;
  }
}
function getDuration(stage) {
  return timing[stage] ? timing[stage].duration : 0;
}
function getFormattedDuration(stage) {
  return `${getDuration(stage).toFixed(2)} ms`;
}

// Concurrency Limiter (simple Promise-based implementation)
async function runWithConcurrencyLimit(tasks, limit) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const p = Promise.resolve().then(task); // Ensure task is a function that returns a promise
    results.push(p);

    const e = p.then(() => executing.splice(executing.indexOf(e), 1));
    executing.push(e);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// Temporary patch until masterRubricSearchService can be fully injected
let masterRubricSearchServiceInternal = null;

async function ensureMasterRubricSearchService() {
  if (!masterRubricSearchServiceInternal) {
    masterRubricSearchServiceInternal = require("./masterRubricSearchService.cjs");
  }
  return masterRubricSearchServiceInternal;
}

class RepertoryEngine {
  static instance = null;

  constructor() {
    if (RepertoryEngine.instance) {
      return RepertoryEngine.instance;
    }

    this.isInitialized = false; // Will be set to true after init()
    RepertoryEngine.instance = this;
  }

  async init() {
    if (this.isInitialized) {
      console.log("Classical Case Analysis Engine already initialized.");
      return;
    }
    console.log("Initializing Classical Case Analysis Engine...");

    // Ensure master repertory is loaded before search services use it.
    if (
      !Array.isArray(global.masterRepertory) ||
      global.masterRepertory.length === 0
    ) {
      console.log("[INIT] Loading master repertory...");
      const { masterRepertory } = await loadMasterRepertory();

      if (!Array.isArray(masterRepertory) || masterRepertory.length === 0) {
        throw new Error(
          "[INIT] Master repertory loading failed or returned empty data.",
        );
      }

      global.masterRepertory = masterRepertory;
      console.log(
        `[INIT] Master repertory loaded: ${global.masterRepertory.length} rubrics.`,
      );
    }

    // Initialize search service after repertory loading.
    await ensureMasterRubricSearchService();

    const count = global.masterRepertory.length;
    console.log(`âœ… Case Analysis Engine Ready. Index count: ${count}`);
    this.isInitialized = true;
  }

  /**
   * Generates a structured repertory sheet grouped by chapter and hierarchy
   */
  generateStructuredSheet(selectedRubrics) {
    const sheet = {};

    selectedRubrics.forEach((r) => {
      const chapter = r.chapter || "GENERALITIES";
      if (!sheet[chapter]) sheet[chapter] = { name: chapter, rubrics: [] };

      const parts = rubricTreeIndexService.parsePath(r.rubric);
      sheet[chapter].rubrics.push({
        ...r,
        mainRubric: parts[0] || r.rubric,
        subRubrics: parts.slice(1),
        isModality: parts.some((p) => rubricTreeIndexService.isModality(p)),
      });
    });

    return Object.values(sheet);
  }

  /**
   * Main search entry point - supports full query decomposition and structured tree search
   */
  _refineFinalRubrics(rubrics, symptomInput) {
    if (!Array.isArray(rubrics) || rubrics.length === 0) return rubrics || [];

    const rawSymptomText =
      typeof symptomInput === "string"
        ? symptomInput
        : String((symptomInput && (symptomInput.value || symptomInput.symptom)) || "");
    const symLower = rawSymptomText.toLowerCase();

    const wantsAmel = /\b(better|amel\.?|amelioration|relieved)\b/i.test(symLower);
    const wantsAgg = /\b(worse|agg\.?|aggravation)\b/i.test(symLower);
    const wantsRight = /\bright\b/i.test(symLower) && !/\bleft\b/i.test(symLower);
    const wantsLeft = /\bleft\b/i.test(symLower) && !/\bright\b/i.test(symLower);

    const stopWords = new Set([
      "pain", "ache", "type", "of", "from", "to", "in", "on", "the", "a", "an",
      "with", "and", "or", "for", "worse", "better", "agg", "amel", "region", "side",
      "discharge", "menses", "appetite", "craving", "aversion", "thirst", "urine", "dreams", "sweat", "sleep"
    ]);
    const coreTokens = symLower
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !stopWords.has(t));

    let filtered = rubrics.filter((r) => {
      const pathText = String((r && (r.path || r.rubric)) || "").toLowerCase();
      const rubText = String((r && r.rubric) || "").toLowerCase();
      const combined = pathText + " " + rubText;
      const trimmedRub = rubText.trim();

      if (trimmedRub.length <= 4) return false;
      if (/^(on|in|at|to|of|thirst|sweat|appetite|craving for|raving|discharge from|sleep\s*,\s*before)$/i.test(trimmedRub)) {
        return false;
      }
      if (/_[0-9]+\b/.test(rubText)) return false;

      if (/\b(testes|barking|delusions|delirium|arrested|knocking|knitting|admonition|coition|lochia|panting|rattling|sighing|catching|wakes tired|unrefreshing|larynx|begging|entreating|company aversion|color|mistake|cheerful|pregnant)\b/i.test(combined)) {
        return false;
      }

      if (/\brefresh\b/i.test(symLower) && !/\bunrefresh\b/i.test(symLower) && /\bunrefresh\b/i.test(combined)) {
        return false;
      }
      if (/\bconstipat/i.test(symLower) && /\bcheerful\b/i.test(combined)) {
        return false;
      }

      if (wantsAmel && !wantsAgg) {
        if (/(^|\s|>\s*)aggravation\b/i.test(pathText) || /\bagg\.?\s*$/i.test(rubText)) {
          return false;
        }
      } else if (wantsAgg && !wantsAmel) {
        if (/(^|\s|>\s*)amelioration\b/i.test(pathText) || /\bamel\.?\s*$/i.test(rubText)) {
          return false;
        }
      }

      if (wantsRight && /\bleft\b/i.test(combined) && !/\bright\b/i.test(combined)) {
        return false;
      }
      if (wantsLeft && /\bright\b/i.test(combined) && !/\bleft\b/i.test(combined)) {
        return false;
      }

      if (coreTokens.length > 0) {
        const hasCoreMatch = coreTokens.some((tok) => combined.includes(tok.slice(0, 5)));
        if (!hasCoreMatch) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      filtered = rubrics.filter((r) => {
        const rubText = String((r && r.rubric) || "").toLowerCase().trim();
        if (rubText.length <= 4 || /_[0-9]+\b/.test(rubText)) return false;
        const combined = (String((r && r.path) || "") + " " + rubText).toLowerCase();
        if (/\b(testes|barking|delusions|delirium|arrested|knocking|knitting|coition|lochia|panting|rattling|unrefreshing|larynx|begging|color|mistake|raving)\b/i.test(combined)) {
          return false;
        }
        if (wantsRight && /\bleft\b/i.test(combined) && !/\bright\b/i.test(combined)) return false;
        if (wantsLeft && /\bright\b/i.test(combined) && !/\bleft\b/i.test(combined)) return false;
        return true;
      });
    }

    const deduped = new Map();
    for (const r of filtered) {
      const chap = String((r && r.chapter) || "").trim().toUpperCase();
      const normRubric = String((r && r.rubric) || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      const key = normRubric ? (chap + "::" + normRubric) : String(r && r.id);
      const existing = deduped.get(key);
      if (!existing || (Number(r && r.score) || 0) > (Number(existing && existing.score) || 0)) {
        deduped.set(key, r);
      }
    }

    return Array.from(deduped.values());
  }

  cleanChiefComplaintTags(val) {
    if (typeof val !== "string") return val;
    const cleaned = val
      .replace(/\[(?:Chief Complaint|Chief Complaint Description)\]\s*/gi, " ")
      .replace(/\r?\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned || val.trim();
  }

  async findIntelligentRubrics(symptom, isMindSymptom, clinicalInterpretation) {
    if (!symptom) return {};

    startTimer("Total");

    let inputs = [];
    if (typeof symptom === "string") {
      symptom = this.cleanChiefComplaintTags(symptom);
      const inputText = symptom.trim();

      let isExactMasterRubricPath = false;

      // Preserve a complete input when it already exists as an exact
      // repertory path. This is especially important for comma-based
      // repertory rubrics such as "AIR , open, in".
      let isExactCanonicalLeaf = false;

      if (
        inputText &&
        Array.isArray(global.masterRepertory) &&
        global.masterRepertory.length > 0
      ) {
        const normalizedInput =
          masterRubricSearchService.normalizeRubricPathForExactLookup(
            inputText,
          );

        const exactPathIndex =
          masterRubricSearchService.getExactRubricPathIndex();

        isExactMasterRubricPath = exactPathIndex.has(normalizedInput);

        const exactLeafIndex =
          masterRubricSearchService.getExactRubricLeafIndex();

        isExactCanonicalLeaf = exactLeafIndex.has(normalizedInput);
      }

      if (isExactMasterRubricPath || isExactCanonicalLeaf) {
        console.log(
          `[EXACT INPUT PRESERVE] Keeping complete input as ONE symptom: "${inputText}"`,
        );

        inputs = [inputText.toLowerCase().trim()];
      } else {
        inputs = splitMultiSymptoms(symptom);
      }
    } else if (Array.isArray(symptom)) {
      inputs = symptom; // Assume it's an array of structured objects or strings
    } else if (typeof symptom === "object" && symptom !== null) {
      const sanitizedObj = {
        ...symptom,
        ...(typeof symptom.value === "string" ? { value: this.cleanChiefComplaintTags(symptom.value) } : {}),
        ...(typeof symptom.symptom === "string" ? { symptom: this.cleanChiefComplaintTags(symptom.symptom) } : {}),
      };
      // If it's a single structured object, wrap it in an array
      inputs = [sanitizedObj];
    }

    const allResults = [];

    console.log("TOTAL SYMPTOMS TO PROCESS:", inputs.length);

    // Deduplicate normalized search terms and handle visited symptoms
    const uniqueSymptoms = [];
    const seenSymptoms = new Set();
    inputs.forEach((symptom) => {
      const symptomKey =
        typeof symptom === "object" ? JSON.stringify(symptom) : symptom;
      if (!seenSymptoms.has(symptomKey)) {
        seenSymptoms.add(symptomKey);
        uniqueSymptoms.push(symptom);
      }
    });
    uniqueSymptoms.forEach((symptom) =>
      visitedSymptoms.add(
        typeof symptom === "object" ? JSON.stringify(symptom) : symptom,
      ),
    );

    const symptomTasks = uniqueSymptoms.map((symptom) => async () => {
      const symptomIdentifier =
        typeof symptom === "object"
          ? `[${symptom.field}] ${symptom.value}`
          : symptom; // For logging
      startTimer(`Symptom: ${symptomIdentifier}`);
      console.log(`[PROCESSING SYMPTOM] ${symptomIdentifier}`);

      const symptomResult = {
        symptom: symptom,
        rubrics: {
          selectedRubrics: [],
          rejectedRubrics: [],
          finalRubrics: [],
          totalCount: 0,
          group: "",
          debug: { originalInput: symptom },
        },
      };

      try {
        startTimer("Physician Thinking");
        const clinicalIntelligence =
          physicianThinkingService.inferClinicalMeaning(symptom);

        if (
          clinicalIntelligence &&
          (clinicalIntelligence.detectedClinicalField === "UNKNOWN" ||
            Number(clinicalIntelligence.confidence) < 0.5)
        ) {
          const llmChapter =
            await physicianThinkingService.inferChapterWithLocalLLM(symptom);

          if (
            llmChapter &&
            clinicalIntelligence.chapterCandidates &&
            typeof clinicalIntelligence.chapterCandidates === "object"
          ) {
            clinicalIntelligence.chapterCandidates[llmChapter] = Math.max(
              clinicalIntelligence.chapterCandidates[llmChapter] || 0,
              0.75,
            );

            console.log(
              "[LOCAL LLM CHAPTER]",
              String(typeof symptom === "object" ? symptom.value : symptom),
              "->",
              llmChapter,
            );
          }
        }
        endTimer("Physician Thinking");
        const {
          primaryChapter,
          secondaryChapters,
          globalAllowedChapters,
          rejectedChapters,
          chapterCandidates,
          searchTerms,
          canonicalSymptom,
          isMindSymptom,
        } = clinicalIntelligence;
        const focusedSearchTerms = Array.from(
          new Set(
            [
              typeof symptom === "object" ? symptom.value : symptom,
              canonicalSymptom,
              ...(Array.isArray(searchTerms) ? searchTerms : []),
            ]
              .filter((t) => typeof t === "string" && t.trim().length > 0)
              .map((t) => t.trim()),
          ),
        ).slice(0, 15);
        const effectivePrimaryChapter =
          primaryChapter ||
          (chapterCandidates && Object.keys(chapterCandidates).length > 0
            ? Object.entries(chapterCandidates).sort(
                (a, b) => b[1] - a[1],
              )[0][0]
            : undefined);

        console.log(
          `[PRIMARY CHAPTER FALLBACK] primary="${primaryChapter}" ` +
            `effective="${effectivePrimaryChapter}" ` +
            `chapterCandidates=${JSON.stringify(chapterCandidates || {})}`,
        );
        console.log(
          "[MIN DEBUG] searchTerms:",
          JSON.stringify(searchTerms),
          "canonical:",
          JSON.stringify(canonicalSymptom),
          "isMind:",
          isMindSymptom,
        );

        console.log(
          `[PHYSICIAN THINKING] Symptom: '${typeof symptom === "object" ? JSON.stringify(symptom) : symptom}' -> Primary: '${primaryChapter}', Secondary: ${(secondaryChapters || []).join(", ")}, Global Allowed: ${(globalAllowedChapters || []).join(", ")}, Rejected: ${(rejectedChapters || []).join(", ")}`,
        );

        const masterRubricSearch = await ensureMasterRubricSearchService();

        let highConfidenceRubricsFound = false;
        const collectedRubrics = new Map(); // For immediate deduplication

        // Pass the array of searchTerms and canonicalSymptom to the search service

        const clinicalInfoForSearch = {
          primaryChapter: effectivePrimaryChapter,
          secondaryChapters,
          globalAllowedChapters,
          rejectedChapters,
          chapterCandidates,
        };
        console.log(
          "[THERMAL/CHAPTER DEBUG] chapterCandidates BEFORE normalization (from RepertoryEngine - globalAllowedChapters):",
          JSON.stringify(clinicalInfoForSearch.globalAllowedChapters),
        );
        const {
          rubrics,
          rubricsScanned,
          rubricsFilteredByChapterWeight,
          finalCandidateRubrics,
        } = await masterRubricSearch.searchRubricsWithChapterLock(
          focusedSearchTerms,
          clinicalInfoForSearch,
          canonicalSymptom,
          isMindSymptom,
          typeof symptom === "string"
            ? symptom.trim()
            : symptom &&
                typeof symptom === "object" &&
                typeof symptom.value === "string"
              ? symptom.value.trim()
              : "",
          symptom && typeof symptom === "object" && !Array.isArray(symptom)
            ? String(symptom.parentComplaintContext || "").trim()
            : "",
        );

        // Store debug info
        symptomResult.rubrics.debug.canonicalSymptom = canonicalSymptom;
        symptomResult.rubrics.debug.expandedSearchTerms = searchTerms;
        symptomResult.rubrics.debug.primaryChapter = primaryChapter;
        symptomResult.rubrics.debug.secondaryChapters = secondaryChapters;
        symptomResult.rubrics.debug.rubricsScanned = rubricsScanned;
        symptomResult.rubrics.debug.rubricsFilteredByChapterWeight =
          rubricsFilteredByChapterWeight;
        // hierarchyMismatches is not returned by the search service.
        symptomResult.rubrics.debug.finalCandidateRubrics =
          finalCandidateRubrics.map((r) => ({
            rubric: r.rubric,
            chapter: r.chapter,
            score: r.score,
          }));

        // Deduplicate and collect results from the `rubrics` array returned by the search service
        for (const rubric of rubrics) {
          const key = rubric.id || `${rubric.rubric}-${rubric.chapter}`;
          if (
            !collectedRubrics.has(key) ||
            rubric.score > collectedRubrics.get(key).score
          ) {
            collectedRubrics.set(key, rubric);
          }
        }

        let finalRubrics = Array.from(collectedRubrics.values());

        // ============================================================

        // CANONICAL EXACT PATH PRUNING

        // ============================================================

        // When the canonical symptom itself exists as an exact

        // master repertory path, keep only that exact path in the

        // final user-facing rubric selection.

        const exactPathNormalizer =
          masterRubricSearch.normalizeRubricPathForExactLookup;

        const exactPathIndex = masterRubricSearch.getExactRubricPathIndex();

        const normalizedCanonicalExactPath =
          exactPathNormalizer(canonicalSymptom);

        const canonicalExactPathExists =
          normalizedCanonicalExactPath.includes(" > ") &&
          Boolean(normalizedCanonicalExactPath) &&
          exactPathIndex.has(normalizedCanonicalExactPath);

        if (canonicalExactPathExists) {
          const exactFinalRubrics = finalRubrics.filter((r) => {
            const normalizedRubricPath = exactPathNormalizer(
              r.path || r.rubric || "",
            );

            return normalizedRubricPath === normalizedCanonicalExactPath;
          });

          if (exactFinalRubrics.length > 0) {
            // ============================================================
            // STEP 9A — CHAPTER-AWARE CANONICAL EXACT PRUNE
            // ============================================================
            // If the canonical exact path exists in multiple repertory
            // chapters, preserve exact rubrics belonging to the
            // clinically selected primary chapter.
            //
            // Example:
            // Input: "extending to"
            // Primary chapter: HEAD
            //
            // Do NOT blindly keep a GENERALITIES exact duplicate.
            // Prefer exact candidates whose chapter belongs to the
            // selected clinical chapter/family.
            // ============================================================

            const primaryChapterForExactPrune = String(
              clinicalInfoForSearch?.primaryChapter || primaryChapter || "",
            )
              .trim()
              .toUpperCase();

            const chapterCandidatesForExactPrune =
              clinicalInfoForSearch?.chapterCandidates || {};

            const normalizeChapterForExactPrune = (value) =>
              String(value || "")
                .trim()
                .toUpperCase()
                .replace(/\\s+/g, " ");

            const normalizedPrimaryChapter = normalizeChapterForExactPrune(
              primaryChapterForExactPrune,
            );

            const chapterAwareExactRubrics = exactFinalRubrics.filter((r) => {
              const rubricChapter = normalizeChapterForExactPrune(r.chapter);

              if (!normalizedPrimaryChapter) {
                return true;
              }

              // Direct chapter match.
              if (rubricChapter === normalizedPrimaryChapter) {
                return true;
              }

              // Candidate chapter match.
              if (
                Object.prototype.hasOwnProperty.call(
                  chapterCandidatesForExactPrune,
                  rubricChapter,
                )
              ) {
                return (
                  Number(chapterCandidatesForExactPrune[rubricChapter]) > 0
                );
              }

              // Allow source-family chapters that explicitly contain
              // the selected clinical chapter.
              if (rubricChapter.includes(normalizedPrimaryChapter)) {
                return true;
              }

              return false;
            });

            if (chapterAwareExactRubrics.length > 0) {
              console.log(
                "[STEP 9A] Chapter-aware canonical exact prune: keeping " +
                  chapterAwareExactRubrics.length +
                  " exact rubric(s) for primary chapter " +
                  JSON.stringify(normalizedPrimaryChapter) +
                  "; removing " +
                  (finalRubrics.length - chapterAwareExactRubrics.length) +
                  " extra candidate(s).",
              );

              finalRubrics = chapterAwareExactRubrics;
            } else {
              // IMPORTANT:
              // If no chapter-specific exact candidate exists,
              // preserve the original exact-path authority.
              console.log(
                "[STEP 9A] No chapter-specific exact rubric found for " +
                  JSON.stringify(normalizedPrimaryChapter) +
                  "; preserving all canonical exact rubric(s): " +
                  exactFinalRubrics.length,
              );

              finalRubrics = exactFinalRubrics;
            }
          }
        }

        if (
          effectivePrimaryChapter &&
          String(effectivePrimaryChapter).toUpperCase() !== "ANY"
        ) {
          const allowedChapters =
            masterRubricSearchService.getAllowedLockedChapters(
              effectivePrimaryChapter,
            );
          const beforeChapterLock = finalRubrics.length;

          finalRubrics = finalRubrics.filter((rubric) =>
            allowedChapters.has(
              String(normalizeChapterName(rubric.chapter) || "").toUpperCase(),
            ),
          );

          console.log(
            `[FINAL CHAPTER LOCK] Chapter=${effectivePrimaryChapter}; ` +
              `kept=${finalRubrics.length}; ` +
              `removed=${beforeChapterLock - finalRubrics.length}.`,
          );
        }

        // ============================================================
        // PRESERVE CANONICAL LEAF EXACT METADATA
        // ============================================================
        // masterRubricSearchService marks authoritative exact-leaf
        // candidates with isCanonicalLeafExact=true.
        // Preserve that metadata and expose the correct matchType
        // in the final RepertoryEngine result.
        // ============================================================
        finalRubrics = finalRubrics.map((r) => {
          if (r && r.isCanonicalLeafExact === true) {
            return {
              ...r,
              matchType: "Canonical Leaf Exact",
            };
          }

          return r;
        });

        // Debugging output for each symptom
        console.log(
          `\n--- DEBUG TRACE FOR SYMPTOM: ${typeof symptom === "object" ? JSON.stringify(symptom) : symptom} ---`,
        );
        console.log(
          `1. Original input: ${symptomResult.rubrics.debug.originalInput}`,
        );
        console.log(
          `2. Canonical symptom: ${symptomResult.rubrics.debug.canonicalSymptom}`,
        );
        console.log(
          `3. Expanded search terms: ${(symptomResult.rubrics.debug.expandedSearchTerms || []).join(", ")}`,
        );
        console.log(
          `4. Primary chapter: ${symptomResult.rubrics.debug.primaryChapter}`,
        );
        console.log(
          `5. Secondary chapters: ${(symptomResult.rubrics.debug.secondaryChapters || []).join(", ")}`,
        );
        console.log(
          `6. Number of rubrics scanned: ${symptomResult.rubrics.debug.rubricsScanned}`,
        );
        console.log(
          `7. Rubrics filtered by chapter weight: ${symptomResult.rubrics.debug.rubricsFilteredByChapterWeight}`,
        );
        console.log(
          "8. Hierarchy mismatch count: Not tracked by search service",
        );
        console.log(
          `9. Final candidate rubrics (first 5): ${JSON.stringify(symptomResult.rubrics.debug.finalCandidateRubrics.slice(0, 5), null, 2)}`,
        );
        console.log(
          `[TRACE STAGE 2] search input: searchTerms: ${JSON.stringify(searchTerms)}`,
        );
        console.log(
          `10. Final selected rubrics (first 5): ${JSON.stringify(
            finalRubrics.slice(0, 5).map((r) => ({
              rubric: r.rubric,
              chapter: r.chapter,
              score: r.score,
            })),
            null,
            2,
          )}`,
        );
        console.log(
          `[TRACE STAGE 2] search input: clinicalInfoForSearch: ${JSON.stringify(clinicalInfoForSearch)}`,
        );
        console.log(`----------------------------------------------`);
        finalRubrics.sort((a, b) => b.score - a.score);

        // Limit to the best 3-5 rubrics as per user requirement
        const NUM_FINAL_RUBRICS = Math.min(Math.max(finalRubrics.length, 3), 5); // Ensure between 3 and 5, or less if not enough found
        // ============================================================
        // SOURCE-DIVERSE FINAL SELECTION — KENT FIRST
        // ------------------------------------------------------------
        // Priority:
        //   1. Kent
        //   2. BBCR
        //   3. Boger
        //   4. Clarke
        //   5. Other genuine repertory sources
        //
        // IMPORTANT:
        // - Never invent a source/rubric.
        // - A source is selected only if the candidate already exists.
        // - Within each source, preserve existing score order.
        // - If Kent is unavailable, fall back to the remaining genuine sources.
        // ------------------------------------------------------------

        const sourcePriority = ["kent", "bbcr", "boger", "clarke"];

        const normalizeRubricSource = (rubric) => {
          const rawSource = String(rubric?.source || "").trim();

          if (!rawSource) return "unknown";

          return rawSource
            .toLowerCase()
            .replace(/\.json$/i, "")
            .replace(/_master_db$/i, "")
            .replace(/_db$/i, "");
        };

        const sourceRank = (rubric) => {
          const source = normalizeRubricSource(rubric);

          const index = sourcePriority.indexOf(source);

          // Unknown / other genuine sources come after the known priority sources.
          return index === -1 ? sourcePriority.length : index;
        };

        // Preserve the existing score ordering first.
        finalRubrics.sort((a, b) => {
          const rankA = sourceRank(a);
          const rankB = sourceRank(b);

          if (rankA !== rankB) {
            return rankA - rankB;
          }

          return (Number(b.score) || 0) - (Number(a.score) || 0);
        });

        const sourceDiverseRubrics = [];
        const seenRubricSources = new Set();

        // Pass 1:
        // Take one genuine candidate from each source, with Kent first.
        for (const rubric of finalRubrics) {
          if (sourceDiverseRubrics.length >= NUM_FINAL_RUBRICS) {
            break;
          }

          const sourceKey = normalizeRubricSource(rubric);

          if (!seenRubricSources.has(sourceKey)) {
            seenRubricSources.add(sourceKey);
            sourceDiverseRubrics.push(rubric);
          }
        }

        // Pass 2:
        // If fewer than 3–5 unique sources are genuinely available,
        // fill remaining slots from the highest-priority remaining candidates.
        for (const rubric of finalRubrics) {
          if (sourceDiverseRubrics.length >= NUM_FINAL_RUBRICS) {
            break;
          }

          if (!sourceDiverseRubrics.includes(rubric)) {
            sourceDiverseRubrics.push(rubric);
          }
        }

        finalRubrics = sourceDiverseRubrics;

        console.log(
          "[SOURCE DIVERSITY] Final rubric sources:",
          JSON.stringify(
            finalRubrics.map((r) => ({
              source: r?.source || "UNKNOWN",
              rubric: r?.rubric || "",
              path: r?.path || "",
              score: r?.score,
            })),
            null,
            2,
          ),
        );

        symptomResult.rubrics.selectedRubrics = finalRubrics;
        finalRubrics = this._refineFinalRubrics(finalRubrics, symptom);
        const treatAsMind = Boolean(
          isMindSymptom ||
          clinicalInterpretation?.isMindSymptom ||
          String(clinicalInterpretation?.primaryChapter || "").toUpperCase() === "MIND"
        );
        if (treatAsMind && Array.isArray(finalRubrics)) {
          finalRubrics = finalRubrics.filter(
            (r) => r && r.source && String(r.source).toLowerCase().includes("kent")
          );
        }
        symptomResult.rubrics.finalRubrics = finalRubrics;
        symptomResult.rubrics.totalCount = finalRubrics.length;

        symptomResult.rubrics.group = "Physician Intelligent Search";
      } catch (error) {
        if (error.message === "Symptom search timed out") {
          console.error(
            `[SYMPTOM TIMEOUT] Search for '${symptom}' aborted after ${TIMEOUT_MS / 1000} seconds.`,
          );
          symptomResult.rubrics.group = "Timeout";
          symptomResult.rubrics.debug.error = "Timeout";
        } else {
          console.error(
            `[SYMPTOM ERROR] Error processing symptom '${symptom}'`,
            error,
          );
          symptomResult.rubrics.group = "Error";
          symptomResult.rubrics.debug.error = error.message;
        }
      } finally {
        endTimer(`Symptom: ${symptom}`);
        allResults.push(symptomResult);
      }
    });

    await runWithConcurrencyLimit(symptomTasks, 4); // Concurrency for symptoms

    endTimer("Total");

    // Print timing logs
    console.log("\n--- PERFORMANCE TIMING --- ");
    console.log(
      `Physician Thinking: ${getFormattedDuration("Physician Thinking")}`,
    );
    // Sum up DB Search times for all terms
    let totalDBSearchTime = 0;
    for (const key in timing) {
      if (key.startsWith("DB Search for term:")) {
        totalDBSearchTime += getDuration(key);
      }
    }
    console.log(`DB Search: ${totalDBSearchTime.toFixed(2)} ms`);
    console.log(`Total: ${getFormattedDuration("Total")}`);
    // Placeholder for Semantic Ranking, Merge, Deduplication, Final Selection
    console.log("Semantic Ranking: N/A (Integration point)");
    console.log("Merge: Implicit in deduplication");
    console.log("Deduplication: Implicit in collectedRubrics");
    console.log("Final Selection: N/A (Post-processing)");

    console.log("TOTAL RUBRIC GROUPS PROCESSED:", allResults.length);


    // [SUGGESTION_CHAPTER_LOCK_FILTER]
    if (Array.isArray(allResults) && allResults.length > 0 && typeof this._applyChapterLockAndClean === "function") {
      for (const entry of allResults) {
        if (entry && entry.rubrics && Array.isArray(entry.rubrics.finalRubrics)) {
          try {
            const cleaned = this._applyChapterLockAndClean(entry.rubrics.finalRubrics, symptom, clinicalInterpretation);
            if (Array.isArray(cleaned) && cleaned.length > 0) {
              entry.rubrics.finalRubrics = cleaned;
            }
          } catch (cleanErr) {
            console.warn("[CHAPTER_LOCK_SAFE_SKIP]:", cleanErr && cleanErr.message ? cleanErr.message : cleanErr);
          }
        }
      }
    }

    return allResults;
  }

  _inferTreeGroup(rubric) {
    const reason = rubric.reason || "";
    if (reason.includes("Exact")) return "Primary Hierarchy Match";
    if (reason.includes("Chapter")) return "Contextual Rubrics";
    return "Modality Fallbacks";
  }

  _inferGroup(term, type) {
    if (
      type === "MODALITY" ||
      type === "MODALITY_SHORT" ||
      type === "MODALITY_CONTEXT"
    )
      return "Modalities";
    if (type === "DISEASE_SYMPTOM") return "Primary Pathology";
    if (type === "GENERALITY") return "Generals";
    if (type === "LOCATION_SENSATION" || type === "LOCATION")
      return "Particulars";
    return "General Search";
  }

  /**
   * Robustly finds a rubric in the global master repertory using a multi-step fallback logic.
   * @param {object} inputRubric - The rubric object from the frontend (already cleaned).
   * @param {string} inputRubric.rubric - The cleaned rubric text.
   * @param {string} inputRubric.id - The ID of the rubric.
   * @param {string} inputRubric.source - The source file (e.g., "kent_master_db.json").
   * @returns {object|null} The matching full rubric object from global.masterRepertory, or null if not found.
   */
  _findRubricInMasterRepertory(inputRubric) {
    if (!global.masterRepertory || global.masterRepertory.length === 0) {
      console.warn("[WARNING] global.masterRepertory is not loaded.");
      return null;
    }

    const targetRubric = inputRubric.rubric.trim();
    const targetSource = inputRubric.source;
    const targetId = inputRubric.id;

    // 1. Attempt exact match by ID (if available and looks reliable)
    if (targetId) {
      const matchById = global.masterRepertory.find((mr) => mr.id === targetId);
      if (matchById) return matchById;
    }

    // 2. Attempt exact match by rubric text AND source
    let foundRubric = global.masterRepertory.find(
      (mr) => mr.rubric.trim() === targetRubric && mr.source === targetSource,
    );
    if (foundRubric) return foundRubric;

    // 3. Attempt exact match by rubric text only (ignoring source, for broader matching if source is inconsistent)
    foundRubric = global.masterRepertory.find(
      (mr) => mr.rubric.trim() === targetRubric,
    );
    if (foundRubric) return foundRubric;

    // 4. Precision guard: Do not fallback to generic parent for specific rubrics.
    if (targetRubric.includes(",") && !targetId) {
      return null;
    }

    // 4. Fallback: Search using core rubric path (splitting by ' > ' or ', ')
    // This handles cases where the input rubric might be a sub-rubric not exactly matching a main entry
    const rubricPartsByGreaterThan = targetRubric
      .split(" > ")
      .map((p) => p.trim());
    const rubricPartsByComma = targetRubric.split(", ").map((p) => p.trim());

    const potentialRubricParts = [];
    // Add parts from longest to shortest
    for (let i = 0; i < rubricPartsByGreaterThan.length; i++) {
      potentialRubricParts.push(
        rubricPartsByGreaterThan
          .slice(0, rubricPartsByGreaterThan.length - i)
          .join(" > "),
      );
    }
    for (let i = 0; i < rubricPartsByComma.length; i++) {
      potentialRubricParts.push(
        rubricPartsByComma.slice(0, rubricPartsByComma.length - i).join(", "),
      );
    }

    // Remove duplicates and empty strings
    const uniqueSearchTerms = [
      ...new Set(potentialRubricParts.filter(Boolean)),
    ].filter((term) => term !== targetRubric);

    for (const searchTerm of uniqueSearchTerms) {
      foundRubric = global.masterRepertory.find(
        (mr) => mr.rubric.trim() === searchTerm,
      );
      if (foundRubric) {
        console.log(
          `[DEBUG] Found fallback rubric for "${targetRubric}" using core part: "${searchTerm}"`,
        );
        return foundRubric;
      }
    }

    // 5. Final fallback: Partial match (contains the input rubric as a substring)
    // This is a last resort and might return less precise matches.
    foundRubric = global.masterRepertory.find((mr) =>
      mr.rubric.toLowerCase().includes(targetRubric.toLowerCase()),
    );
    if (foundRubric) {
      console.log(`[DEBUG] Found partial match fallback for "${targetRubric}"`);
      return foundRubric;
    }

    return null;
  }

  /**
   * Performs full case analysis on selected rubrics with Materia Medica Intelligence
   */

  // [UNIVERSAL_CHAPTER_LOCK_AND_CLEAN_SEARCH]
  _getLockedChaptersForSymptom(symptomInput, interp = {}) {
    const rawText =
      typeof symptomInput === "string"
        ? symptomInput
        : String((symptomInput && (symptomInput.value || symptomInput.symptom)) || "");
    const lower = rawText.toLowerCase();

    if (Array.isArray(interp && interp.allowedChapters) && interp.allowedChapters.length > 0) {
      return interp.allowedChapters.map((c) => String(c).toUpperCase());
    }
    if (interp && interp.primaryChapter) {
      return [String(interp.primaryChapter).toUpperCase()];
    }

    if (/\b(leucorrh|menses|menstrual|vagina|uterus|ovary|female|discharge)\b/i.test(lower)) {
      return ["GENITALIA FEMALE", "FEMALE", "MENSES", "LEUCORRHOEA"];
    }
    if (/\b(back|lumbar|sciatic|spine|coccyx|cervical|scapulae)\b/i.test(lower)) {
      return ["BACK", "SCIATICA", "EXTREMITIES"];
    }
    if (/\b(sleep|dream|ghost)\b/i.test(lower)) {
      return ["SLEEP", "MIND", "DREAM"];
    }
    if (/\b(sweat|perspir)\b/i.test(lower)) {
      return ["PERSPIRATION", "SWEAT", "GENERAL"];
    }
    return null;
  }

  _applyChapterLockAndClean(rubrics, symptomInput, clinicalInterpretation = {}) {
    if (!Array.isArray(rubrics) || rubrics.length === 0) return [];
    try {
      const lockedChapters = this._getLockedChaptersForSymptom(symptomInput, interp);
      const dedup = (arr) => {
        const seen = new Map();
        for (const r of arr) {
          const chap = String((r && r.chapter) || "").trim().toUpperCase();
          const norm = String((r && (r.rubric || r.name)) || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
          const key = norm ? (chap + "::" + norm) : String(r && r.id);
          const prev = seen.get(key);
          if (!prev || (Number(r && r.score) || 0) > (Number(prev && prev.score) || 0)) {
            seen.set(key, r);
          }
        }
        return Array.from(seen.values());
      };
      const strictFiltered = rubrics.filter((r) => {
        const chap = String((r && r.chapter) || "").toUpperCase();
        const rub = String((r && (r.rubric || r.name)) || "").trim();
        const rubLower = rub.toLowerCase();
        if (rub.length <= 2) return false;
        if (/^(on|in|at|to|of|by|for|and|or)$/i.test(rubLower)) return false;
        if (/\btestes\b/i.test(rubLower)) return false;
        if (Array.isArray(lockedChapters) && lockedChapters.length > 0 && chap) {
          const matchesLock = lockedChapters.some((lc) => chap.includes(lc) || lc.includes(chap));
          if (!matchesLock) return false;
        }
        return true;
      });
      const cleanedStrict = dedup(strictFiltered);
      if (cleanedStrict.length > 0) return cleanedStrict;
      const fallback = dedup(rubrics.filter((r) => String((r && (r.rubric || r.name)) || '').trim().length > 2));
      return fallback.length > 0 ? fallback.slice(0, 10) : rubrics;
    } catch (_) {
      return rubrics;
    }
  }
  async analyzeCase(selectedRubrics, weights = {}, caseData = {}) {
    // [DEDUP_CROSS_SOURCE_RUBRICS]
    if (Array.isArray(selectedRubrics) && selectedRubrics.length > 1) {
      const byNorm = new Map();
      for (const r of selectedRubrics) {
        if (!r) continue;
        const normText = String(r.rubric || r.name || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
        const key = normText ? normText : String(r.id);
        const prev = byNorm.get(key);
        const currRank = (Number(r.score) || 0) * 10 + (Number(r.grade) || Number(r.finalWeightedGrade) || 0);
        const prevRank = prev ? ((Number(prev.score) || 0) * 10 + (Number(prev.grade) || Number(prev.finalWeightedGrade) || 0)) : -1;
        if (!prev || currRank > prevRank) {
          byNorm.set(key, r);
        }
      }
      selectedRubrics = Array.from(byNorm.values());
    }
    // [ANALYZE_CASE_NOISE_CLEANUP]
    if (Array.isArray(selectedRubrics) && selectedRubrics.length > 0) {
      const noiseRegex = /\b(testes|barking|delusions|delirium|arrested|knocking|knitting|admonition|coition|lochia|panting|rattling|sighing|catching|wakes tired|unrefreshing|larynx|begging|entreating|company aversion|color|mistake|cheerful|pregnant|christ|calculating|oppression|irregular|babbling|hesitating|sopor|indisposition to play|laughing|playful|irritability|dullness|absorbed|impatience|impetuous|convulsion|warm room|copious flow|sleep\s*,\s*before|on abdomen|talking during|difficult > going to sleep)\b/i;
      const stubRegex = /^(on|in|at|to|of|thirst|sweat|appetite|craving for|raving|discharge from|low down in|thirst and drinking|thirst with|sleep\s*,\s*before)$/i;
      const filteredList = selectedRubrics.filter((r) => {
        const rub = String((r && (r.rubric || r.name)) || "").trim();
        const pathStr = String((r && r.path) || "").trim();
        const combined = pathStr + " " + rub;
        const rubLower = rub.toLowerCase();
        if (rub.length <= 4) return false;
        if (stubRegex.test(rubLower)) return false;
        if (/_[0-9]+\b/.test(rubLower)) return false;
        if (noiseRegex.test(combined)) return false;
        return true;
      });
      selectedRubrics = this._applyChapterLockAndClean(filteredList.length > 0 ? filteredList : selectedRubrics, "");
    }
    const patientThermalState = caseData?.thermal || weights?.thermalGenerals;
    if (patientThermalState) {
      console.log(`Patient Thermal State: ${patientThermalState}`);
    }
    const cacheKey = JSON.stringify({
      rubrics: selectedRubrics
        .map((r) => ({
          id: r.id || null,
          rubric: r.rubric || r.name || null,
          source: r.source || null,
          chapter: r.chapter || null,
          grade: r.grade || null,
        }))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      weights,
      thermal: patientThermalState || null,
      caseData: {
        patientSymptoms: caseData?.patientSymptoms || null,
        duration: caseData?.duration || null,
        onset: caseData?.onset || null,
        history: caseData?.history || null,
        recurrence: caseData?.recurrence || null,
      },
    });
    const cachedResult = constitutionalCache.get(cacheKey);
    if (cachedResult) return cachedResult;

    console.log(
      `ðŸ“Š analyzeCase() - Analyzing Case Totality via MongoDB Engine with ${selectedRubrics.length} rubrics...`,
    );
    console.log("analyzeCase() - Received selectedRubrics:", selectedRubrics);

    // Enrich selectedRubrics with full rubric data (including remedies) from global.masterRepertory
    const enrichedRubrics = selectedRubrics
      .map((inputRubric) => {
        // Find the full rubric object in the global master repertory using a more robust search
        const fullRubric = this._findRubricInMasterRepertory(inputRubric);

        if (!fullRubric) {
          console.warn(
            `[WARNING] Full rubric not found for: "${inputRubric.rubric}" (ID: ${inputRubric.id}, Chapter: ${inputRubric.chapter}, Source: ${inputRubric.source || "N/A"})`,
          );
          return null; // Skip this rubric if not found
        }

        // Combine input rubric properties with full rubric data
        // Prioritize grade from inputRubric if it exists, otherwise use default or fullRubric\'s grade
        const rubricToProcess = {
          ...fullRubric,
          ...inputRubric,
          remedies:
            Array.isArray(inputRubric.remedies) &&
            inputRubric.remedies.length > 0
              ? inputRubric.remedies
              : fullRubric.remedies || [],
          grade: inputRubric.grade || fullRubric.grade || 1,
        };

        const symptomText = rubricToProcess.rubric || rubricToProcess.name; // Use rubric text or name for categorization
        const constitutionalPriority = categorizeSymptom(symptomText);
        const constitutionalWeight = constitutionalPriority.weight;

        const finalWeightedGrade = rubricToProcess.grade * constitutionalWeight;

        console.log(`[CONSTITUTIONAL PRIORITY]`);
        console.log(`Symptom: ${symptomText}`);
        console.log(`Category: ${constitutionalPriority.category}`);
        console.log(`Weight: ${constitutionalWeight}`);
        console.log(`Initial Rubric Grade: ${rubricToProcess.grade}`);
        console.log(`Final Weighted Score: ${finalWeightedGrade}`);

        return {
          ...rubricToProcess,
          grade: finalWeightedGrade, // This grade already incorporates constitutionalWeight
          constitutionalInfo: constitutionalPriority,
          constitutionalWeight: constitutionalWeight, // Explicitly add constitutionalWeight
          finalWeightedGrade: finalWeightedGrade, // Add for clarity/debugging if needed
        };
      })
      .filter(Boolean); // Filter out any nulls from rubrics not found

    if (enrichedRubrics.length === 0) {
      console.warn(
        "No valid rubrics found after enrichment. Aborting analysis.",
      );
      return {
        remedies: [],
        matrix: [],
        summary: {},
        differentiation: null,
        keynoteConfirmation: [],
        metadata: {},
        miasmaticAnalysis: {},
        caseClassification: {},
        prescriptionConfidence: {},
      };
    }

    console.log(
      "[DEBUG REMEDIES]",
      JSON.stringify(
        enrichedRubrics.slice(0, 2).map((r) => ({
          rubric: r.rubric,
          remedies: r.remedies?.slice(0, 3),
        })),
        null,
        2,
      ),
    );

    const analysis = remedyScoringService.calculate(enrichedRubrics, weights);

    // Ensure remedies array is never empty
    if (analysis.remedies.length === 0) {
      analysis.remedies.push({
        name: "No Remedies Found",
        score: 0,
        finalScore: 0,
        matchedRubrics: [],
      });
    }

    // 1. Analyze complete symptom totality for essence matching
    const allSymptoms =
      Array.isArray(caseData?.patientSymptoms) &&
      caseData.patientSymptoms.length > 0
        ? caseData.patientSymptoms
        : enrichedRubrics.map((r) => r.rubric || r.name);

    const miasmaticAnalysis =
      miasmaticIntelligenceService.analyzeMiasm(allSymptoms);

    console.log(
      `\nâœ¨ [ESSENCE MATCHING] Analyzing ${allSymptoms.length} symptoms for remedy essences...`,
    );

    const essenceMatches = analyzeEssence(allSymptoms);
    const clinicalSummaryEssence = [];

    // Apply essence bonuses
    for (const essenceMatch of essenceMatches) {
      const remedyName = Object.keys(remedyEssences).find(
        (key) => key.toLowerCase() === essenceMatch.remedy.toLowerCase(),
      );
      const remedy = analysis.remedies.find(
        (r) => r.name.toLowerCase() === remedyName.toLowerCase(),
      );

      if (remedy) {
        let bonus = 0;
        let summaryText = ``;

        if (essenceMatch.essenceScore >= 80) {
          bonus = 50;
          summaryText = `${remedyName} essence strongly matches ${essenceMatch.matchedSymptoms.join(", ")}.`;
        } else if (essenceMatch.essenceScore >= 60) {
          bonus = 30;
          summaryText = `${remedyName} essence good match for ${essenceMatch.matchedSymptoms.join(", ")}.`;
        }

        if (essenceMatch.essenceScore >= 40) {
          bonus = 15;
          summaryText = `${remedyName} essence weak match for ${essenceMatch.matchedSymptoms.join(", ")}.`;
        }

        if (bonus > 0) {
          remedy.score = (remedy.score || 0) + bonus;
          remedy.finalScore = (remedy.finalScore || 0) + bonus; // Update finalScore as well
          clinicalSummaryEssence.push(summaryText);

          console.log(`[ESSENCE MATCH]`);
          console.log(`Remedy: ${remedyName}`);
          console.log(
            `Matched Symptoms: ${essenceMatch.matchedSymptoms.join(", ")}`,
          );
          console.log(`Essence Score: ${essenceMatch.essenceScore}`);
          console.log(`Bonus Added: ${bonus}`);
        }
      }
    }

    // Re-sort remedies after applying bonuses
    analysis.remedies.sort(
      (a, b) => (b.score || b.finalScore || 0) - (a.score || a.finalScore || 0),
    );

    // Assign thermal classification to each remedy
    analysis.remedies.forEach((remedy) => {
      const { thermal: remedyThermalClassification } = getThermalClassification(
        remedy.name,
        patientThermalState,
      ); // Pass patientThermalState
      remedy.thermal = remedyThermalClassification; // Attach thermal classification
    });

    const topRemedies = analysis.remedies.slice(0, 5);
    const summary = this._generateCaseSummary(selectedRubrics);

    // Add essence clinical summaries to the main summary
    if (clinicalSummaryEssence.length > 0) {
      summary.clinicalEssence = clinicalSummaryEssence;
    }

    let differentiation = null;
    const patientSymptoms = allSymptoms; // Use enrichedRubrics
    if (topRemedies.length >= 2) {
      const top3RemedyCodes = topRemedies
        .slice(0, 3)
        .map((r) => r.name.split(" ")[0]);
      differentiation = remedyDifferentiationService.differentiate(
        top3RemedyCodes,
        patientSymptoms,
      );
    }

    // After differentiation: Keynote Confirmation Layer
    const keynoteConfirmation = keynoteConfirmationService.confirmRemedies(
      topRemedies.map((r) => r.name),
      allSymptoms,
    );

    // Debugging output for keynote confirmation
    console.log(`\n[KEYNOTE CONFIRMATION]`);
    keynoteConfirmation.forEach((kc) => {
      console.log(`Remedy: ${kc.remedy}`);
      console.log(`Matched: ${kc.matchedKeynotes.join(", ")}`);
      console.log(`Missing: ${kc.missingKeynotes.join(", ")}`);
      console.log(`Confidence: ${kc.confidence}`);
    });

    const matrix = this._buildMatrix(analysis.remedies, selectedRubrics);

    // Display-only remedy name normalization.
    // Internal canonical names and scoring remain unchanged.
    const displayRemedyName = (name) => {
      const canonical = String(name || "")
        .toUpperCase()
        .trim();

      const aliases = {
        "NATRUM MURIATICUM": "Natrum Mur",
      };

      if (aliases[canonical]) {
        return aliases[canonical];
      }

      return String(name || "")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };
    const result = {
      success: true,
      remedies: analysis.remedies.map((r) => ({
        ...r,
        name: displayRemedyName(r.name),
        clinicalSummary:
          r.clinicalSummary ||
          (summary.clinicalEssence
            ? summary.clinicalEssence.find((s) =>
                s.startsWith(r.name.split(" ")[0]),
              )
            : "") ||
          "",
        totalityScore: r.rawTotalityScore, // Map rawTotalityScore to totalityScore for frontend
        symptomsCovered: r.matchedRubrics ? r.matchedRubrics.length : 0, // Calculate symptomsCovered
      })),
      classicalRankedRemedies: analysis.classicalRankedRemedies, // Add the full classical ranked remedies for matrix
      top5ClassicalRemediesForPanel: analysis.top5ClassicalRemediesForPanel, // Add the top 5 for the panel
      matrix,
      summary,
      differentiation,
      keynoteConfirmation,
      metadata: analysis.metadata,
      miasmaticAnalysis,
    };

    // Case Classification Layer
    const caseClassification = caseClassificationService.classifyCase({
      symptoms: allSymptoms,
      duration: caseData?.duration,
      onset: caseData?.onset,
      history: caseData?.history,
      recurrence: caseData?.recurrence,
      miasmaticAnalysis: miasmaticAnalysis,
    });

    // Add caseClassification to the result object
    result.caseClassification = caseClassification;

    // --- Prescription Confidence Index (PCI) Layer ---
    const topRemedy = analysis.remedies[0];

    const pciRepertoryResult = {
      strongAgreement:
        topRemedy &&
        topRemedy.finalScore > 500 &&
        analysis.remedies.length > 1 &&
        topRemedy.finalScore / analysis.remedies[1].finalScore > 1.5,
    };

    const keynoteScore = keynoteConfirmation[0]?.confirmationScore || 0;
    const pciKeynoteConfirmation = {
      strongConfirmation: keynoteScore >= 60,
      moderateConfirmation: keynoteScore >= 30 && keynoteScore < 60,
      weakConfirmation: keynoteScore > 0 && keynoteScore < 30,
    };

    const pciMateriaMedicaVerification = {
      strongVerification: essenceMatches.some(
        (em) =>
          em.remedy.toLowerCase() === topRemedy?.name.toLowerCase() &&
          em.essenceScore >= 80,
      ),
    };

    const contradictions = clinicalContradictionService.detect(
      topRemedies.map((r) => r.name),
      allSymptoms,
    );
    const pciContradictionAnalysis = {
      noContradictions: contradictions.length === 0,
      majorContradiction: contradictions.some((c) => c.severity === "major"),
    };

    const pciEssenceAnalysis = {
      strongMatch: essenceMatches.some(
        (em) =>
          em.remedy.toLowerCase() === topRemedy?.name.toLowerCase() &&
          em.essenceScore >= 80,
      ),
    };

    const pciMiasmaticAnalysis = {
      agreement: miasmaticAnalysis?.overallMiasmConfidence > 0.7,
    };

    // Calculate overall constitutional alignment
    // Ensure weightedRubrics is defined or use enrichedRubrics if that's the intended source
    const totalConstitutionalWeight = enrichedRubrics.reduce(
      (sum, r) => sum + (r.constitutionalInfo?.weight || 0),
      0,
    );
    const pciConstitutionalWeight = {
      alignment: totalConstitutionalWeight > enrichedRubrics.length * 0.7,
    };

    const prescriptionConfidence = calculatePrescriptionConfidence({
      repertoryResult: pciRepertoryResult,
      keynoteConfirmation: pciKeynoteConfirmation,
      materiaMedicaVerification: pciMateriaMedicaVerification,
      contradictionAnalysis: pciContradictionAnalysis,
      essenceAnalysis: pciEssenceAnalysis,
      miasmaticAnalysis: pciMiasmaticAnalysis,
      constitutionalWeight: pciConstitutionalWeight,
      caseClassification: result.caseClassification,
    });

    result.prescriptionConfidence = prescriptionConfidence;

    constitutionalCache.set(cacheKey, result);
    return result;
  }

  _buildMatrix(remedies, selectedRubrics) {
    // console.log("_buildMatrix() - Remedies length:", remedies.length);
    // console.log("_buildMatrix() - Selected Rubrics length:", selectedRubrics.length);
    // console.log("_buildMatrix() - First 5 Remedies:", remedies.slice(0, 5));
    // console.log("_buildMatrix() - First 5 Selected Rubrics:", selectedRubrics.slice(0, 5));

    const groupedByChapter = {};

    selectedRubrics.forEach((rubric) => {
      const chapterName = rubric.chapter || "UNKNOWN_CHAPTER"; // Ensure every rubric has a chapter
      if (!groupedByChapter[chapterName]) {
        groupedByChapter[chapterName] = {
          chapterName: chapterName,
          rubrics: [],
        };
      }

      const rubricRemedies = [];
      remedies.forEach((remedy) => {
        const match = remedy.matchedRubrics?.find(
          (mr) => mr.id === rubric.id || mr.rubric === rubric.rubric,
        );
        if (match) {
          rubricRemedies.push({
            name: remedy.name,
            grade: match.grade || 0,
          });
        }
      });

      // Preserve all existing rubric fields as requested
      // The test expects originalSymptom to be on the rubric object
      groupedByChapter[chapterName].rubrics.push({
        ...rubric, // Spread all existing rubric fields
        remedies: rubricRemedies, // Override remedies with the scored ones
      });
    });

    // Convert the grouped object into an array format expected by the test
    const matrix = Object.values(groupedByChapter);
    return matrix;
  }

  _generateCaseSummary(rubrics) {
    const summary = {
      mentals: [],
      generals: [],
      particulars: [],
      modalities: [],
    };
    rubrics.forEach((r) => {
      const type = r.type || this._inferType(r);
      if (type === "MENTALS") summary.mentals.push(r.rubric);
      else if (type === "GENERAL_PHYSICALS") summary.generals.push(r.rubric);
      else if (type === "MODALITIES") summary.modalities.push(r.rubric);
      else if (type === "PARTICULARS") summary.particulars.push(r.rubric);
    });
    return summary;
  }

  _inferType(rubric) {
    const chapter = (rubric.chapter || "").toUpperCase();
    if (chapter === "MIND") return "MENTALS";
    if (chapter === "GENERALITIES") return "GENERAL_PHYSICALS";
    return "PARTICULARS";
  }

  async generateMatrix(selectedRubrics) {
    const analysis = await this.analyzeCase(selectedRubrics);
    return analysis.remedies.map((r) => ({ name: r.name, score: (r.finalScore ?? r.score) })).sort((a, b) => b.score - a.score);
  }

  async storeUserSelection(text, selectedRubric) {
    console.log(`Recording selection: ${text} -> ${selectedRubric.rubric}`);
  }

  // Removed _getRemedyThermalInfluence as it is replaced by ThermalLookupService
}
module.exports = RepertoryEngine;
