/** @format */

// Backend/services/masterRubricSearchService.cjs

/**
 * Searches for rubrics based on different criteria.
 * Assumes global.masterRepertory is populated with normalized rubrics.
 */

const {
  isStrictConstitutionalGeneral,
  constitutionalChapterMap,
  getConstitutionalCategory,
  isStrictParticular,
  normalizeChapterName,
} = require("./clinicalOntologyService"); // Import normalizeChapterName
const clinicalAliases = require("../database/clinicalAliases.json");
const { Index } = require("flexsearch");

/*
 * Existing hierarchy infrastructure.
 * Reuses rubricHierarchyService only; does not replace search logic.
 */
let rubricHierarchyService = null;

try {
  rubricHierarchyService = require("./rubricHierarchyService.cjs");
} catch (e) {
  console.warn("[WARN] rubricHierarchyService unavailable:", e.message);
}

function _getHierarchyContextForRubric(rubricEntry) {
  if (!rubricEntry || !global.pathIndex || !global.nodeIndex) {
    return null;
  }

  const fullPath = rubricEntry.path || rubricEntry.rubric || "";
  const nodeId = global.pathIndex[fullPath];

  if (!nodeId) {
    return null;
  }

  const node = global.nodeIndex[nodeId];

  if (!node) {
    return null;
  }

  const parentNode = node.parentId ? global.nodeIndex[node.parentId] : null;

  return {
    nodeId,
    parentId: node.parentId || null,
    level: Number.isFinite(node.level) ? node.level : 0,
    fullPath: node.fullPath || fullPath,
    parentPath: parentNode ? parentNode.fullPath : null,
    childCount: Array.isArray(node.childrenIds) ? node.childrenIds.length : 0,
  };
}
// Helper function for STEP 4B: Context-aware cross-chapter recovery
/**
 * Calculates a score adjustment based on how well a rubric's text/path
 * aligns with the locked chapter and canonical symptom context.
 *
 * @param {string} lockedChapter The chapter that was initially locked.
 * @param {string} canonicalSymptom The primary symptom being searched.
 * @param {string} rubricText The text of the candidate rubric.
 * @param {string} rubricPath The hierarchy path of the candidate rubric.
 * @returns {number} A score adjustment (negative for penalty, positive for preference).
 */
function _calculateContextEvidenceScoreAdjustment(
  lockedChapter,
  canonicalSymptom,
  rubricText,
  rubricPath,
  rubricChapter,
) {
  // Added rubricChapter parameter
  const PENALTY_FOR_NO_CONTEXT = -100; // Strong penalty for lack of relevant context
  const BOOST_FOR_DIRECT_CHAPTER_MATCH = 50; // Significant boost if the rubric's chapter matches the locked chapter
  const BOOST_FOR_PATH_SEGMENT_MATCH = 25; // Moderate boost if locked chapter appears as a meaningful segment in the rubric's path

  // Normalize chapter names for comparison. `normalizeChapterName` is imported at the top of the file.
  const normalizedLockedChapter = normalizeChapterName(lockedChapter);

  // 1. Check for direct chapter match
  if (normalizeChapterName(rubricChapter) === normalizedLockedChapter) {
    return BOOST_FOR_DIRECT_CHAPTER_MATCH;
  }

  // 2. Check for locked chapter as a segment within the rubric path
  // We need to ensure 'HEAD' as a segment, not just a substring.
  // Example: "GENERALITIES > PAIN > HEAD" contains "HEAD" as a segment.
  // Example: "HEADING" does not contain "HEAD" as a segment.
  if (rubricPath) {
    const pathSegments = rubricPath
      .split(" > ")
      .map((s) => normalizeChapterName(s));
    if (pathSegments.includes(normalizedLockedChapter)) {
      return BOOST_FOR_PATH_SEGMENT_MATCH;
    }
  }

  // If neither direct chapter match nor path segment match, apply penalty.
  // Simple token presence in rubricText/rubricPath (like "head" in "perspiration") is no longer sufficient.
  return PENALTY_FOR_NO_CONTEXT;
}

// Import FlexSearch

const withTimeout = (promise, ms, timeoutMessage = "Operation timed out") => {
  return Promise.race([
    promise,
    new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), ms),
    ),
  ]);
};

let rubricSearchIndex = null;

// Function to initialize or get the FlexSearch index for rubrics
function getRubricSearchIndex() {
  if (!rubricSearchIndex) {
    console.log("[INFO] Initializing FlexSearch index for masterRepertory...");
    // ===== TEMP AUDIT START =====
    console.log(
      `3. global.masterRepertory.length before FlexSearch indexing: ${global.masterRepertory ? global.masterRepertory.length : undefined}`,
    );
    // ===== TEMP AUDIT END =====
    rubricSearchIndex = new Index({
      tokenize: "full", // Use "full" tokenizer for broader matching
      optimize: true,
      resolution: 9,
    });
    if (global.masterRepertory) {
      global.masterRepertory.forEach((entry, id) => {
        // Index both the rubric and its hierarchy path for better searchability
        const searchableText =
          `${entry.rubric || ""} ${entry.path || ""}`.toLowerCase(); // Use entry.path for hierarchy
        if (searchableText.trim()) {
          rubricSearchIndex.add(id, searchableText);
          // console.log(`[DEBUG FlexSearch Indexing] Added ID: ${id}, Searchable Text: "${searchableText}"`); // Commented out for performance
        }
      });
      console.log(
        `[INFO] FlexSearch index built with ${global.masterRepertory.length} rubrics.`,
      );
    } else {
      console.warn(
        "[WARN] global.masterRepertory is not available for FlexSearch index initialization.",
      );
    }
  }
  return rubricSearchIndex;
}

const MAX_CANDIDATE_RUBRICS = 20; // Limit to top 20 candidate rubrics as per user requirement
const CROSS_CHAPTER_RECOVERY_SCORE_PENALTY_MULTIPLIER = 0.6; // Penalty for recovery candidates
const MIN_STRICT_RESULTS_FOR_RECOVERY = 2; // Fewer than 2 strict results triggers cross-chapter recovery

let cachedUniqueChapters = null;

function getAllowedLockedChapters(chapter) {
  const normalizedChapter = normalizeChapterName(chapter).toUpperCase();
  const allowed = new Set([normalizedChapter]);

  if (normalizedChapter === "HEAD") {
    allowed.add("BBCR_HEADINTERNAL");
    allowed.add("BBCR_HEADEXTERNAL");
  }

  if (
    !cachedUniqueChapters &&
    Array.isArray(global.masterRepertory) &&
    global.masterRepertory.length > 0
  ) {
    cachedUniqueChapters = [
      ...new Set(
        global.masterRepertory
          .map((e) =>
            e && e.chapter ? normalizeChapterName(e.chapter).toUpperCase() : "",
          )
          .filter(Boolean),
      ),
    ];
  }

  if (cachedUniqueChapters) {
    for (const ch of cachedUniqueChapters) {
      if (
        ch === normalizedChapter ||
        ch.endsWith("_" + normalizedChapter) ||
        ch.includes(normalizedChapter)
      ) {
        allowed.add(ch);
      }
    }
  }

  return allowed;
}

// Helper function to normalize strings for robust comparison
function _normalizeSearchString(text) {
  // This function now primarily standardizes casing and trims whitespace.
  // The aggressive space-collapsing replacements have been removed
  // to ensure that phrases with spaces (e.g., "aversion to milk")
  // are preserved correctly for direct matching against rubric text.
  return String(text ?? "").replace(/[\u0152\u0153]/g, "oe").replace(/[\u00c6\u00e6]/g, "ae").toLowerCase().trim();
}

// Helper function to extract core tokens for fallback search
function _extractCoreTokens(symptom) {
  // Define specific mappings for phrases with core meanings
  const phraseMappings = {
    "scanty menses": "menses",
    "throbbing headache": "headache",
    "long lasting grief": "grief",
    "wants sympathy": "sympathy",
    "delayed menses": "menses",
    "craves salt": "salt",
    "salt craving": "salt",
    "general tiredness": "tiredness",
    "weeping tendency": "weeping",
    sympathy: "sympathy", // Explicit rule for sympathy
    consolation: "consolation", // Explicit rule for consolation
    // Add more as needed
  };

  const lowerSymptom = symptom.toLowerCase();

  // Check for phrase mappings first
  for (const phrase in phraseMappings) {
    if (lowerSymptom.includes(phrase)) {
      return [phraseMappings[phrase]];
    }
  }

  // Generic tokenization for single words or less specific phrases
  const tokens = lowerSymptom
    .split(/\s+/)
    .filter((token) => token.length > 2) // Minimum length for a meaningful token
    .filter(
      (token) =>
        !new Set([
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
          "wants",
          "long",
          "lasting",
        ]).has(token),
    ); // Basic stop words

  // Ensure we return at least one token, even if it\`s the original symptom itself
  if (tokens.length === 0 && symptom.length > 0) {
    return [lowerSymptom.split(/\s+/).pop()]; // Take the last word as a core token for lack of better option
  } else if (tokens.length === 0) {
    // If original symptom is empty too, return empty array
    return [];
  }

  return [...new Set(tokens)]; // Return unique tokens
}

/**
 * Scores a rubric based on how well it matches the given search terms and the ranking criteria.
 * Also applies the chapter candidate weight.
 * @param {object} rubricEntry The rubric object from global.masterRepertory.
 * @param {Array<string>} searchTerms The expanded search terms from physicianThinkingService.
 * @param {string} canonicalSymptom The canonical form of the symptom.
 * @param {object} chapterCandidates A map of chapter names to their confidence weights.
 * @returns {{score: number, matchType: string}} The match score and type for the rubric.
 */
function _scoreRubricMatch(
  rubricEntry,
  searchTerms,
  canonicalSymptom,
  chapterCandidates,
  isRecoveryMode = false,
) {
  const normalizedRubricText = _normalizeSearchString(rubricEntry?.rubric ?? rubricEntry?.name ?? rubricEntry?.rubricText ?? "");
  const normalizedCanonicalSymptom = _normalizeSearchString(canonicalSymptom);
  const normalizedRubricChapter = normalizeChapterName(rubricEntry.chapter);

  let searchMatchScore = 0;
  let matchType = "No Match";

  for (const term of searchTerms) {
    const normalizedTerm = _normalizeSearchString(term);

    // 1. Exact Rubric Match (Highest priority)
    const genericModalityTerms = new Set([
      "better",
      "worse",
      "pressure",
      "motion",
      "rest",
      "warmth",
      "cold",
      "night",
      "morning",
      "evening",
    ]);

    const isGenericStandaloneMatch =
      normalizedRubricText === normalizedTerm &&
      genericModalityTerms.has(normalizedTerm) &&
      normalizedCanonicalSymptom.split(/\s+/).length > 1;

    if (normalizedRubricText === normalizedTerm && !isGenericStandaloneMatch) {
      searchMatchScore = Math.max(searchMatchScore, 1000); // Base score
      matchType = "Exact Rubric";
      break; // Found the best possible match, no need to check further terms
    }

    // 2. Canonical Synonym Match (High priority)
    const isCanonicalSynonym =
      normalizedTerm === normalizedCanonicalSymptom ||
      (clinicalAliases[normalizedCanonicalSymptom] &&
        clinicalAliases[normalizedCanonicalSymptom].includes(normalizedTerm));
    if (isCanonicalSynonym) {
      if (normalizedRubricText.includes(normalizedTerm)) {
        searchMatchScore = Math.max(searchMatchScore, 900);
        if (matchType === "No Match") matchType = "Canonical Synonym";
      }
    }

    // 3. Clinical Synonym Match (General inclusion in searchTerms not marked as canonical)
    if (
      normalizedRubricText.includes(normalizedTerm) &&
      normalizedTerm !== normalizedCanonicalSymptom
    ) {
      searchMatchScore = Math.max(searchMatchScore, 800);
      if (matchType === "No Match" || searchMatchScore > 800)
        matchType = "Clinical Synonym";
    }

    // 4. Parent Rubric Match (normalizedRubricText is a parent of normalizedCanonicalSymptom)
    if (
      normalizedCanonicalSymptom.startsWith(normalizedRubricText + ",") ||
      normalizedCanonicalSymptom.startsWith(normalizedRubricText + " ")
    ) {
      searchMatchScore = Math.max(searchMatchScore, 750);
      if (matchType === "No Match" || searchMatchScore > 750)
        matchType = "Parent Rubric";
    }

    // 5. Subrubric Match (normalizedRubricText is a subrubric of normalizedCanonicalSymptom)
    if (
      normalizedRubricText.startsWith(normalizedCanonicalSymptom + ",") ||
      normalizedRubricText.startsWith(normalizedCanonicalSymptom + " ")
    ) {
      searchMatchScore = Math.max(searchMatchScore, 700);
      if (matchType === "No Match" || searchMatchScore > 700)
        matchType = "Subrubric";
    }

    // 6. Semantic Similarity / Token Match (Word overlap)
    // 6. Semantic Similarity / Token Match (Word overlap)
    if (searchMatchScore < 700) {
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
        "type",
        "like",
        "as",
      ]);
      const canonicalTokens = normalizedCanonicalSymptom
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 2 && !stopWords.has(t));
      const rubricTokens = normalizedRubricText
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 2 && !stopWords.has(t));
      const overlapCount = canonicalTokens.filter((token) =>
        rubricTokens.includes(token),
      ).length;

      if (overlapCount > 0) {
        const semanticScore = 500 + overlapCount * 10;
        searchMatchScore = Math.max(
          searchMatchScore,
          Math.min(semanticScore, 600),
        );
        if (matchType === "No Match" || searchMatchScore > 600) {
          matchType = "Semantic Similarity / Token Match";
        }
      }
    }
  }

  // STEP 3D-C HIERARCHY SCORING
  // Reuse existing rubricHierarchyService tree for ranking support.
  const hierarchyContext = _getHierarchyContextForRubric(rubricEntry);
  let hierarchyBonus = 0;

  if (hierarchyContext) {
    const hierarchyNodeText = _normalizeSearchString(
      hierarchyContext.fullPath && hierarchyContext.fullPath.includes(" > ")
        ? hierarchyContext.fullPath.split(" > ").pop()
        : hierarchyContext.fullPath || "",
    );

    const normalizedCanonical = normalizedCanonicalSymptom || "";

    if (normalizedCanonical && hierarchyNodeText === normalizedCanonical) {
      hierarchyBonus = Math.max(hierarchyBonus, 80);
    }

    for (const term of searchTerms || []) {
      const normalizedTerm = _normalizeSearchString(term);
      if (!normalizedTerm) continue;

      if (hierarchyNodeText === normalizedTerm) {
        hierarchyBonus = Math.max(hierarchyBonus, 80);
      } else if (
        hierarchyNodeText.includes(normalizedTerm) ||
        normalizedTerm.includes(hierarchyNodeText)
      ) {
        hierarchyBonus = Math.max(hierarchyBonus, 50);
      }
    }

    const parentPath = _normalizeSearchString(
      hierarchyContext.parentPath || "",
    );

    if (
      parentPath &&
      normalizedCanonical &&
      parentPath.includes(normalizedCanonical)
    ) {
      hierarchyBonus = Math.max(hierarchyBonus, 30);
    }
  }

  if (hierarchyBonus > 0) {
    searchMatchScore += hierarchyBonus;
  }

  // Apply Chapter Candidate Weighting: Final Rubric Score = Search Match Score * Chapter Candidate Weight
  // If chapterCandidates is empty or all weights are 0, default chapterWeight to 1 to prevent unintentional filtering.
  let chapterWeight = 1; // Default to 1 (no weighting) if no specific chapter candidates are provided or all are zero
  if (
    chapterCandidates &&
    Object.keys(chapterCandidates).length > 0 &&
    Object.values(chapterCandidates).some((weight) => weight > 0)
  ) {
    if (isRecoveryMode) {
      // In recovery mode, assign a small non-zero weight if the chapter is not in candidates,
      // to allow it to be considered (and then penalized in the main function).
      // If it is in candidates, give it the full weight.
      chapterWeight =
        chapterCandidates[normalizedRubricChapter.toUpperCase()] || 0.1; // Assign a small weight for out-of-chapter recovery candidates
    } else {
      // In strict mode, chapterWeight is 0 if not found in candidates
      chapterWeight =
        chapterCandidates[normalizedRubricChapter.toUpperCase()] || 0; // Use 0 if chapter not found in candidates
    }
  }
  const finalScore = searchMatchScore * chapterWeight;

  return {
    score: finalScore,
    matchType: matchType,
    chapterWeight: chapterWeight,
    baseSearchScore: searchMatchScore,
  };
}

/**

 * Performs a search for rubrics with physician-like chapter lock and scoring.
 * This function now primarily orchestrates the search using dbService and applies chapter-based scoring.

 * @param {Array<string>} searchTerms The expanded search terms to search for.
 * @param {object} chapterCandidates - A map of chapter names to their confidence weights.
 * @param {string} canonicalSymptom The canonical form of the symptom for scoring context.

 * @returns {Promise<Array>} A Promise that resolves to an array of rubrics with scores.
 */

// ============================================================
// EXACT RUBRIC PATH INDEX
// ============================================================

let exactRubricPathIndex = null;
let exactRubricFieldIndex = null;
let exactRubricLeafIndex = null;
let exactRubricLeafLooseIndex = null;

function normalizeRubricPathForExactLookup(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s*>\s*/g, " > ");
}

function getExactRubricPathIndex() {
  const repertory = global.masterRepertory || [];
  if (!repertory.length) {
    return new Map();
  }

  if (exactRubricPathIndex) {
    return exactRubricPathIndex;
  }

  exactRubricPathIndex = new Map();

  for (const rubric of repertory) {
    if (!rubric || !rubric.path) continue;

    const normalizedPath = normalizeRubricPathForExactLookup(rubric.path);

    if (!normalizedPath) continue;

    if (!exactRubricPathIndex.has(normalizedPath)) {
      exactRubricPathIndex.set(normalizedPath, []);
    }

    exactRubricPathIndex.get(normalizedPath).push(rubric);
  }

  console.log(
    `[EXACT PATH INDEX] Built with ${exactRubricPathIndex.size} unique paths`,
  );

  return exactRubricPathIndex;
}

function getExactRubricFieldIndex() {
  const repertory = global.masterRepertory || [];
  if (!repertory.length) {
    return new Map();
  }

  if (exactRubricFieldIndex) {
    return exactRubricFieldIndex;
  }

  exactRubricFieldIndex = new Map();

  for (const rubric of repertory) {
    if (!rubric || !rubric.rubric) continue;
    const normalizedRubric = normalizeRubricPathForExactLookup(rubric.rubric);
    if (!normalizedRubric) continue;
    if (!exactRubricFieldIndex.has(normalizedRubric)) {
      exactRubricFieldIndex.set(normalizedRubric, []);
    }
    exactRubricFieldIndex.get(normalizedRubric).push(rubric);
  }

  console.log(
    "[EXACT RUBRIC FIELD INDEX] Built with " +
      exactRubricFieldIndex.size +
      " unique rubric fields",
  );
  return exactRubricFieldIndex;
}

function getExactRubricLeafIndex() {
  const repertory = global.masterRepertory || [];
  if (!repertory.length) {
    return new Map();
  }

  if (exactRubricLeafIndex) {
    return exactRubricLeafIndex;
  }

  exactRubricLeafIndex = new Map();

  const masterIndex = getExactRubricPathIndex();

  for (const [fullPath, rubrics] of masterIndex.entries()) {
    if (!fullPath || !Array.isArray(rubrics)) {
      continue;
    }

    const parts = String(fullPath)
      .split(">")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      continue;
    }

    const leaf = parts[parts.length - 1];
    const leafKey = normalizeRubricPathForExactLookup(leaf);

    if (!leafKey) {
      continue;
    }

    if (!exactRubricLeafIndex.has(leafKey)) {
      exactRubricLeafIndex.set(leafKey, []);
    }

    const bucket = exactRubricLeafIndex.get(leafKey);

    for (const rubric of rubrics) {
      if (!rubric) {
        continue;
      }

      const exists = bucket.some((existing) => {
        if (existing.id && rubric.id) {
          return existing.id === rubric.id;
        }

        return (
          (existing.path || existing.rubric || "") ===
          (rubric.path || rubric.rubric || "")
        );
      });

      if (!exists) {
        bucket.push(rubric);
      }
    }
  }

  console.log(
    `[LEAF INDEX] Built ${exactRubricLeafIndex.size} unique leaf keys`,
  );

  return exactRubricLeafIndex;
}

function normalizeRubricLeafLooseForExactLookup(value) {
  let text = normalizeRubricPathForExactLookup(value);

  // Leaf-only punctuation normalization.
  // Strict exact lookup remains unchanged.
  text = text.split("-").join(" ");
  text = text.split("?").join(" ");
  text = text.split("?").join(" ");

  while (text.includes("  ")) {
    text = text.replaceAll("  ", " ");
  }

  return text.trim();
}

function getExactRubricLeafLooseIndex() {
  const repertory = global.masterRepertory || [];
  if (!repertory.length) {
    return new Map();
  }

  if (exactRubricLeafLooseIndex) {
    return exactRubricLeafLooseIndex;
  }

  exactRubricLeafLooseIndex = new Map();

  const strictIndex = getExactRubricLeafIndex();

  for (const [strictKey, rubrics] of strictIndex.entries()) {
    const looseKey = normalizeRubricLeafLooseForExactLookup(strictKey);

    if (!looseKey || !Array.isArray(rubrics)) {
      continue;
    }

    if (!exactRubricLeafLooseIndex.has(looseKey)) {
      exactRubricLeafLooseIndex.set(looseKey, []);
    }

    const bucket = exactRubricLeafLooseIndex.get(looseKey);

    for (const rubric of rubrics) {
      if (!rubric) {
        continue;
      }

      const key =
        rubric.id ||
        (rubric.path || rubric.rubric || "") + "-" + (rubric.chapter || "");

      const exists = bucket.some((existing) => {
        const existingKey =
          existing.id ||
          (existing.path || existing.rubric || "") +
            "-" +
            (existing.chapter || "");

        return existingKey === key;
      });

      if (!exists) {
        bucket.push(rubric);
      }
    }
  }

  console.log(
    "[LOOSE LEAF INDEX] Built " +
      exactRubricLeafLooseIndex.size +
      " unique loose leaf keys",
  );

  return exactRubricLeafLooseIndex;
}

async function searchRubricsWithChapterLock(
  searchTerms,
  {
    primaryChapter,
    secondaryChapters,
    globalAllowedChapters,
    rejectedChapters,
    chapterCandidates,
  },
  canonicalSymptom,
  isMindSymptom = false,
  originalSymptom = "",
  parentComplaintContext = "",
) {
  const lockedChapter = primaryChapter || "Any";

  console.log(
    `[CHAPTER INPUT DEBUG] primary="${primaryChapter}" ` +
      `locked="${lockedChapter}" ` +
      `secondary=${JSON.stringify(secondaryChapters || [])} ` +
      `allowed=${JSON.stringify(globalAllowedChapters || [])} ` +
      `rejected=${JSON.stringify(rejectedChapters || [])} ` +
      `candidates=${JSON.stringify(chapterCandidates || {})} ` +
      `isMind=${isMindSymptom}`,
  );
  console.log(
    `[SEARCH] Initiating search for symptom: "${canonicalSymptom}" in chapter: "${lockedChapter}"`,
  );

  const normalizedSearchTerms = Array.isArray(searchTerms)
    ? searchTerms
    : typeof searchTerms === "string" && searchTerms.trim()
      ? [searchTerms]
      : [];

  const normalizedOriginalSymptom =
    typeof originalSymptom === "string" ? originalSymptom.trim() : "";
  try {
    //console.log(`[DEBUG] masterRubricSearchService - Input Chapter Candidates: ${JSON.stringify(chapterCandidates)}`); // Removed debug log
    //console.log(`[DEBUG]   Search Terms: ${(searchTerms || []).join(", ")}`); // Removed debug log
    //console.log(`[DEBUG]   Canonical Symptom: ${canonicalSymptom}`); // Removed debug log

    const rubricSearchIndex = getRubricSearchIndex(); // Get the FlexSearch index

    const collectedRubrics = new Map(); // Use a Map to store unique rubrics and their best score

    const totalRubricsBeforeFiltering = global.masterRepertory.length;
    let chapterFilteredCount = 0; // Count rubrics filtered by chapter

    //console.log(`[DEBUG] Total rubrics before chapter filtering: ${totalRubricsBeforeFiltering}`); // Removed debug log

    const aliasExpansionMap = {
      "delayed menses": [
        "menses late",
        "menses delayed",
        "menses suppressed",
        "menses amenorrhea",
        "menses, late",
        "menses, suppressed",
      ],
      "craves salt": ["desire salt", "food salt"],
      "salt craving": ["desire salt", "food salt"],
      "general tiredness": ["weariness", "weakness", "fatigue"],

      depression: ["depression", "sadness", "melancholy", "despair"],
      "scanty menses": [
        "menses scanty",
        "menses insufficient",
        "menses suppressed",
      ],
      "throbbing headache": [
        "headache throbbing",
        "pulsating headache",
        "beating headache",
      ],
      "weeping tendency": [
        "weeping",
        "crying",
        "tearful disposition",
        "lamenting",
      ],
      sympathy: [
        "consolation",
        "consolation amel",
        "sympathy",
        "sympathy desire for",
      ],
      "wants sympathy": [
        "consolation",
        "consolation amel",
        "sympathy",
        "sympathy desire for",
      ],
      "long lasting grief": ["grief", "sadness", "melancholy"], // Added mapping for "long lasting grief"
    };

    const splitKeywords = (text) => {
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
      return text
        .toLowerCase()
        .split(/[^a-zA-Z0-9]+/)
        .filter((w) => w.length > 0 && !stopWords.has(w));
    };

    let allSearchableTerms = new Set();
    searchTerms = Array.isArray(searchTerms)
      ? searchTerms
      : typeof searchTerms === "string" && searchTerms.trim()
        ? [searchTerms]
        : [];

    searchTerms = Array.isArray(searchTerms)
      ? searchTerms
      : typeof searchTerms === "string" && searchTerms.trim()
        ? [searchTerms]
        : [];

    // Add original search terms and canonical symptom
    normalizedSearchTerms.forEach((term) =>
      allSearchableTerms.add(term.toLowerCase()),
    );
    if (canonicalSymptom) {
      allSearchableTerms.add(canonicalSymptom.toLowerCase());
    }

    // Add parent complaint context to lexical search only.
    if (
      typeof parentComplaintContext === "string" &&
      parentComplaintContext.trim()
    ) {
      const context = parentComplaintContext.trim().toLowerCase();
      allSearchableTerms.add(context);

      const originalValue =
        typeof originalSymptom === "string"
          ? originalSymptom.trim().toLowerCase()
          : "";

      if (originalValue && !context.includes(originalValue)) {
        allSearchableTerms.add(`${context} ${originalValue}`);
      }
    }
    // Apply alias expansion
    const lowerCaseCanonical = canonicalSymptom
      ? canonicalSymptom.toLowerCase()
      : "";
    if (aliasExpansionMap[lowerCaseCanonical]) {
      aliasExpansionMap[lowerCaseCanonical].forEach((alias) =>
        allSearchableTerms.add(alias.toLowerCase()),
      );
    }

    let initialSearchResults = [];
    let seenRubricKeys = new Set(); // To prevent duplicate rubrics from different search approaches
    // ============================================================
    // EXACT PATH LOOKUP Ã¢â‚¬â€ PRIORITY CANDIDATE RECOVERY
    // ============================================================
    // Recover an already-existing rubric by its complete structured
    // path before lexical/token search can replace it with unrelated
    // matches.
    const exactPathIndex = getExactRubricPathIndex();
    const exactPathCandidates = [];
    const canonicalLeafPathCandidates = [];
    const canonicalLeafPathCandidateKeys = new Set();
    const exactLookupTerms = new Set();

    // Preserve exact-path candidates across MIND/Kent fallback resets.
    // This must be initialized before any fallback logic can use it.
    const preservedExactPathCandidatesForCollection = [];

    for (const term of normalizedSearchTerms) {
      if (typeof term === "string" && term.trim()) {
        exactLookupTerms.add(normalizeRubricPathForExactLookup(term));
      }
    }

    if (canonicalSymptom && typeof canonicalSymptom === "string") {
      exactLookupTerms.add(normalizeRubricPathForExactLookup(canonicalSymptom));
    }

    if (normalizedOriginalSymptom) {
      exactLookupTerms.add(
        normalizeRubricPathForExactLookup(normalizedOriginalSymptom),
      );

      console.log(
        `[ORIGINAL EXACT LOOKUP] Added raw input: "${normalizedOriginalSymptom}"`,
      );
    }

    for (const exactPath of exactLookupTerms) {
      if (!exactPath) continue;

      const exactPathMatches = exactPathIndex.get(exactPath) || [];
      const rubricFieldMatches = exactPath.includes(" > ")
        ? getExactRubricFieldIndex().get(exactPath) || []
        : [];
      const exactMatches =
        exactPathMatches.length > 0 ? exactPathMatches : rubricFieldMatches;

      if (Array.isArray(exactMatches)) {
        for (const rubric of exactMatches) {
          if (!rubric) continue;

          const uniqueKey = rubric.id || `${rubric.rubric}-${rubric.chapter}`;

          if (!seenRubricKeys.has(uniqueKey)) {
            seenRubricKeys.add(uniqueKey);
            exactPathCandidates.push(rubric);
          }
        }
      }
    }

    if (exactPathCandidates.length > 0) {
      console.log(
        `[EXACT PATH] Recovered ${exactPathCandidates.length} exact rubric(s)`,
      );

      // Keep a separate immutable reference for later fallback rebuilding.
      preservedExactPathCandidatesForCollection.push(...exactPathCandidates);

      initialSearchResults.push(...exactPathCandidates);

      console.log(
        `[EXACT STATE AFTER INSERT] exactCandidates=${exactPathCandidates.length} ` +
          `initialSearchResults=${initialSearchResults.length}`,
      );

      for (const exactCandidate of exactPathCandidates) {
        console.log(
          `[EXACT STATE CANDIDATE] ` +
            `${exactCandidate.id || "NO_ID"} | ` +
            `${exactCandidate.chapter} | ` +
            `${exactCandidate.path || exactCandidate.rubric}`,
        );
      }
    }

    // ============================================================

    // ============================================================
    // CANONICAL LEAF EXACT PATH ? AUTHORITATIVE RECOVERY
    // ============================================================
    // Recover exact structured clinical leaves from:
    //   1. canonicalSymptom when it is a direct leaf label
    //   2. meaningful multi-word normalized search terms
    //
    // Single-word search terms are intentionally ignored here
    // because words such as ulcers, vivid, lips, talking, etc.
    // have many unrelated repertory leaves.
    // ============================================================

    if (
      (canonicalSymptom && typeof canonicalSymptom === "string") ||
      normalizedSearchTerms.length > 0
    ) {
      const canonicalLeafLookupTerms = new Set();

      if (
        canonicalSymptom &&
        typeof canonicalSymptom === "string" &&
        canonicalSymptom.trim()
      ) {
        canonicalLeafLookupTerms.add(canonicalSymptom.trim());
      }

      if (normalizedOriginalSymptom) {
        canonicalLeafLookupTerms.add(normalizedOriginalSymptom);
      }

      for (const term of normalizedSearchTerms) {
        if (typeof term !== "string") continue;

        const cleanTerm = term.trim();
        if (!cleanTerm) continue;

        const wordCount = cleanTerm.split(/\s+/).filter(Boolean).length;

        if (wordCount >= 2) {
          canonicalLeafLookupTerms.add(cleanTerm);
        }
      }

      const leafIndex = getExactRubricLeafIndex();

      for (const lookupTerm of canonicalLeafLookupTerms) {
        const leafKey = normalizeRubricPathForExactLookup(lookupTerm);

        if (!leafKey) continue;

        let leafMatches = leafIndex.get(leafKey) || [];

        if (leafMatches.length === 0) {
          const looseIndex = getExactRubricLeafLooseIndex();

          const looseKey = normalizeRubricLeafLooseForExactLookup(lookupTerm);

          leafMatches = looseIndex.get(looseKey) || [];

          if (leafMatches.length > 0) {
            console.log(
              '[LOOSE LEAF EXACT] Lookup="' +
                lookupTerm +
                '" matched loose leaf key="' +
                looseKey +
                '"',
            );
          }
        }

        if (leafMatches.length === 0) continue;

        for (const rubric of leafMatches) {
          if (!rubric) continue;

          const key =
            rubric.id ||
            (rubric.path || rubric.rubric || "") + "-" + (rubric.chapter || "");

          if (!canonicalLeafPathCandidateKeys.has(key)) {
            canonicalLeafPathCandidateKeys.add(key);
            canonicalLeafPathCandidates.push(rubric);
            seenRubricKeys.add(key);
          }
        }

        console.log(
          '[LEAF EXACT PATH] Lookup="' +
            lookupTerm +
            '" recovered ' +
            leafMatches.length +
            " exact leaf rubric(s)",
        );
      }

      if (canonicalLeafPathCandidates.length > 0) {
        console.log(
          "[LEAF EXACT TOTAL] " +
            canonicalLeafPathCandidates.length +
            ' authoritative canonical leaf candidate(s) for "' +
            canonicalSymptom +
            '"',
        );
        initialSearchResults.push(...canonicalLeafPathCandidates);
      }
    }

    const MIN_RUBRICS_REQUIRED = 5; // Target at least 5 rubrics for good coverage

    // --- Kent-first / Fallback Logic for MIND symptoms ---
    if (isMindSymptom) {
      let kentOnlyRubrics = [];
      let allDatabaseMindRubrics = [];
      let kentMindRubricIds = new Set(); // To track IDs of Kent rubrics found

      // Phase 1: Attempt Kent-only search first
      for (const term of Array.from(allSearchableTerms)) {
        const resultsIds = await withTimeout(
          Promise.resolve(
            rubricSearchIndex.search(term, MAX_CANDIDATE_RUBRICS),
          ),
          500,
          `FlexSearch for term '${term}' timed out after 500ms`,
        );
        resultsIds.forEach((id) => {
          const rubricEntry = global.masterRepertory[id];
          if (
            rubricEntry &&
            rubricEntry.source &&
            rubricEntry.source.toLowerCase().includes("kent")
          ) {
            const uniqueKey =
              rubricEntry.id || `${rubricEntry.rubric}-${rubricEntry.chapter}`;
            if (!kentMindRubricIds.has(uniqueKey)) {
              kentMindRubricIds.add(uniqueKey);
              kentOnlyRubrics.push(rubricEntry);
            }
          }
        });
      }

      // Mind symptoms strictly use Kent rubrics only (no fallback to non-Kent repertories)
      const isKentRubric = (r) => Boolean(r && r.source && String(r.source).toLowerCase().includes("kent"));
      const filteredCanonicalKent = canonicalLeafPathCandidates.filter(isKentRubric);
      if (kentOnlyRubrics.length < 2) {
        const kentSeen = new Set(kentOnlyRubrics.map((r) => r.id || `${r.rubric}-${r.chapter}`));
        for (const term of Array.from(allSearchableTerms)) {
          const resultsIds = rubricSearchIndex.search(term, MAX_CANDIDATE_RUBRICS);
          resultsIds.forEach((id) => {
            const rubricEntry = global.masterRepertory[id];
            if (isKentRubric(rubricEntry)) {
              const uniqueKey = rubricEntry.id || `${rubricEntry.rubric}-${rubricEntry.chapter}`;
              if (!kentSeen.has(uniqueKey)) {
                kentSeen.add(uniqueKey);
                kentOnlyRubrics.push(rubricEntry);
              }
            }
          });
        }
      }
      initialSearchResults = [
        ...filteredCanonicalKent,
        ...kentOnlyRubrics.filter(isKentRubric),
      ];
    } else {
      // Original search logic for non-Mind symptoms
      // --- Phase 1: Attempt full-phrase search for all generated terms ---
      // console.log(`[DEBUG] Phase 1: Attempting full-phrase search for ${Array.from(allSearchableTerms).join(", ")}`); // Removed debug log
      for (const term of Array.from(allSearchableTerms)) {
        // console.log(`[DEBUG FlexSearch Query] Term: "${term}"`); // Removed debug log
        const resultsIds = rubricSearchIndex.search(
          term,
          MAX_CANDIDATE_RUBRICS,
        );
        // console.log(`[DEBUG FlexSearch Raw Results] Term: "${term}", Raw Count: ${resultsIds.length}`); // Removed debug log
        resultsIds.forEach((id) => {
          const rubricEntry = global.masterRepertory[id];
          if (rubricEntry) {
            const uniqueKey =
              rubricEntry.id || `${rubricEntry.rubric}-${rubricEntry.chapter}`;
            if (!seenRubricKeys.has(uniqueKey)) {
              seenRubricKeys.add(uniqueKey);
              initialSearchResults.push(rubricEntry);
            }
          }
        });
      }
      // console.log(`[DEBUG] Phase 1: Found ${initialSearchResults.length} rubrics.`); // Removed debug log

      // Exit early if enough rubrics are found after Phase 1
      if (initialSearchResults.length < MIN_RUBRICS_REQUIRED) {
        // --- Phase 2: If insufficient results (e.g., less than 5), perform tokenized search from original symptom ---
        if (canonicalSymptom) {
          // console.log(`[DEBUG] Phase 2: Insufficient rubrics (${initialSearchResults.length}) from Phase 1. Attempting tokenized search for canonical symptom: ${canonicalSymptom}`); // Removed debug log
          const canonicalTokens = splitKeywords(canonicalSymptom);
          for (const token of canonicalTokens) {
            if (token.length > 2) {
              // Ensure tokens are meaningful
              // console.log(`[DEBUG FlexSearch Query - Tokenized] Token: "${token}"`); // Removed debug log
              const resultsIds = await withTimeout(
                Promise.resolve(
                  rubricSearchIndex.search(token, MAX_CANDIDATE_RUBRICS),
                ),
                500,
                `FlexSearch for token '${token}' timed out after 500ms`,
              );
              // console.log(`[DEBUG FlexSearch Raw Results - Tokenized] Token: "${token}", Raw Count: ${resultsIds.length}`); // Removed debug log
              resultsIds.forEach((id) => {
                const rubricEntry = global.masterRepertory[id];
                if (rubricEntry) {
                  const uniqueKey =
                    rubricEntry.id ||
                    `${rubricEntry.rubric}-${rubricEntry.chapter}`;
                  if (!seenRubricKeys.has(uniqueKey)) {
                    seenRubricKeys.add(uniqueKey);
                    initialSearchResults.push(rubricEntry);
                  }
                }
              });
            }
          }
          // console.log(`[DEBUG] Phase 2: Total rubrics after tokenized search: ${initialSearchResults.length}`); // Removed debug log
        }

        // Exit early if enough rubrics are found after Phase 2
        if (initialSearchResults.length < MIN_RUBRICS_REQUIRED) {
          // --- Phase 3: Guaranteed Token Fallback Search (if still insufficient results) ---
          if (canonicalSymptom) {
            // console.log(`[DEBUG] Phase 3: Still insufficient rubrics (${initialSearchResults.length}). Attempting guaranteed token fallback search for: ${canonicalSymptom}`); // Removed debug log
            const coreTokens = _extractCoreTokens(canonicalSymptom); // New helper function to extract core tokens

            for (const token of coreTokens) {
              if (token.length > 2) {
                // Ensure tokens are meaningful
                // console.log(`[DEBUG FlexSearch Query - Fallback] Token: "${token}"`); // Removed debug log
                const resultsIds = await withTimeout(
                  Promise.resolve(
                    rubricSearchIndex.search(token, MIN_RUBRICS_REQUIRED),
                  ),
                  500,
                  `FlexSearch for fallback token '${token}' timed out after 500ms`,
                ); // Limit fallback results
                // console.log(`[DEBUG FlexSearch Raw Results - Fallback] Token: "${token}", Raw Count: ${resultsIds.length}`); // Removed debug log
                resultsIds.forEach((id) => {
                  const rubricEntry = global.masterRepertory[id];
                  if (rubricEntry) {
                    const uniqueKey =
                      rubricEntry.id ||
                      `${rubricEntry.rubric}-${rubricEntry.chapter}`;
                    if (!seenRubricKeys.has(uniqueKey)) {
                      seenRubricKeys.add(uniqueKey);
                      initialSearchResults.push(rubricEntry);
                    }
                  }
                });
              }
            }
            // console.log(`[DEBUG] Phase 3: Total rubrics after fallback search: ${initialSearchResults.length}`); // Removed debug log
          }
        }
      }
    }

    // Note: Deduplication is now handled within the search loops via seenRubricKeys.

    // ============================================================
    // STEP 8B: TARGETED CHAPTER FAMILY FALLBACK
    // ============================================================

    const targetedChapterFamilies = {
      HEAD: new Set(["HEAD", "BBCR_HEADINTERNAL", "BBCR_HEADEXTERNAL"]),
      BBCR_HEADINTERNAL: new Set(["HEAD", "BBCR_HEADINTERNAL"]),
      BBCR_HEADEXTERNAL: new Set(["HEAD", "BBCR_HEADEXTERNAL"]),
    };

    const normalizedPrimaryChapter =
      normalizeChapterName(lockedChapter).toUpperCase();

    const targetedChapters = getAllowedLockedChapters(normalizedPrimaryChapter);

    const targetedTokens = Array.from(allSearchableTerms)
      .flatMap((term) => String(term).toLowerCase().split(/\s+/))
      .filter((token) => token.length > 2);

    if (
      targetedChapters.size > 0 &&
      targetedTokens.length > 0 &&
      global.masterRepertory
    ) {
      let targetedAddedCount = 0;

      for (const rubricEntry of global.masterRepertory) {
        if (!rubricEntry) continue;

        const rubricChapter = normalizeChapterName(
          rubricEntry.chapter,
        ).toUpperCase();

        if (!targetedChapters.has(rubricChapter)) continue;

        const searchableText = [
          rubricEntry.rubric || "",
          rubricEntry.path || "",
        ]
          .join(" ")
          .toLowerCase();

        // STEP 8B: Require the main symptom token.
        // This prevents unrelated headache rubrics from entering
        // when only the word "headache" matches.
        const primarySymptomTokens = targetedTokens.filter((token) =>
          ["throbbing", "pulsating", "beating", "pounding"].includes(token),
        );

        const tokenMatch =
          primarySymptomTokens.length === 0
            ? targetedTokens.some((token) => searchableText.includes(token))
            : primarySymptomTokens.some((token) =>
                searchableText.includes(token),
              );

        const uniqueKey =
          rubricEntry.id || `${rubricEntry.rubric}-${rubricEntry.chapter}`;

        if (!seenRubricKeys.has(uniqueKey)) {
          seenRubricKeys.add(uniqueKey);
          initialSearchResults.push(rubricEntry);
          targetedAddedCount++;
        }
      }

      console.log(
        `[CHAPTER FAMILY FALLBACK] Added ${targetedAddedCount} targeted candidates`,
      );
    }
    // ============================================================
    // EXACT PATH DEBUG TRACE - TEMPORARY
    // ============================================================
    const DEBUG_EXACT_IDS = new Set([
      "KENT_MIND_ABSENT_MINDED_SEE_FORGETFUL_MENSES_DURING",
      "KENT_MIND_ABSENT_MINDED_SEE_FORGETFUL_READING_WHILE",
      "KENT_MIND_ABSORBED_BURIED_IN_THOUGHT_MENSES_DURING",
      "KENT_VERTIGO_NIGHT_7_HIM_FROM_SLEEP",
      "KENT_VERTIGO_AIR_OPEN_IN",
      "KENT_VERTIGO_ANGER_AFTER_2",
      "KENT_VERTIGO_ANXIETY_DURING_2",
      "KENT_VERTIGO_BACK_COMES_UP_THE",
      "KENT_VERTIGO_BATHING_AFTER",
      "KENT_HEAD_ADHESION_OF_SKIN_OF_FOREHEAD",
      "KENT_EYE_BLOWING_SENSATION_IN_HEADACHE_DURING",
      "KENT_EYE_BORING_FINGERS_IN_SLEEP_DURING",
    ]);

    for (const r of initialSearchResults) {
      if (r && DEBUG_EXACT_IDS.has(r.id)) {
        console.log(
          "[EXACT DEBUG BEFORE CHAPTER FILTER]",
          JSON.stringify({
            id: r.id,
            chapter: r.chapter,
            path: r.path,
            primaryChapter,
            globalAllowedChapters,
            rejectedChapters,
          }),
        );
      }
    }
    // EXACT PATH SURVIVAL:
    // Keep exact-path candidates available for final collection.
    // Apply strict chapter filtering
    let currentRelevantRubrics = [];
    let searchAttemptType = "Chapter Filtered";
    const currentChapterCandidates = Object.fromEntries(
      Object.entries(chapterCandidates || {}).map(([chapter, weight]) => [
        normalizeChapterName(chapter).toUpperCase(),
        weight,
      ]),
    );
    if (lockedChapter && lockedChapter !== "Any") {
      const normalizedLockedChapter =
        normalizeChapterName(lockedChapter).toUpperCase();
      const lockedWeight =
        currentChapterCandidates[normalizedLockedChapter] || 0.95;
      const allowedLocked = getAllowedLockedChapters(normalizedLockedChapter);
      for (const ch of allowedLocked) {
        if (!currentChapterCandidates[ch]) {
          currentChapterCandidates[ch] = lockedWeight;
        }
      }
    }

    const normalizedGlobalAllowedChapters = new Set(
      (globalAllowedChapters || []).map((chap) =>
        normalizeChapterName(chap).toUpperCase(),
      ),
    );
    const normalizedRejectedChapters = new Set(
      (rejectedChapters || []).map((chap) =>
        normalizeChapterName(chap).toUpperCase(),
      ),
    );

    for (const rubricEntry of initialSearchResults) {
      const normalizedRubricChapter = normalizeChapterName(
        rubricEntry.chapter,
      ).toUpperCase();

      // 1. Strict Rejection: If the rubric's chapter is in the rejected list, skip it.

      if (normalizedRejectedChapters.has(normalizedRubricChapter)) {
        chapterFilteredCount++;
        continue; // Skip this rubric
      }

      // 2. Strict Allowance: If globalAllowedChapters is provided, and the rubric's chapter is NOT in it, skip it.
      if (
        normalizedGlobalAllowedChapters.size > 0 &&
        !normalizedGlobalAllowedChapters.has(normalizedRubricChapter)
      ) {
        chapterFilteredCount++;
        continue; // Skip this rubric
      }

      // 3. Chapter Candidate Weighting
      // The primary locked chapter is authoritative during retrieval.
      let chapterWeight = 1;

      if (
        chapterCandidates &&
        Object.keys(chapterCandidates).length > 0 &&
        Object.values(chapterCandidates).some((weight) => weight > 0)
      ) {
        if (lockedChapter && lockedChapter !== "Any") {
          const normalizedLockedChapter =
            normalizeChapterName(lockedChapter).toUpperCase();

          const allowedLockedChapters = getAllowedLockedChapters(
            normalizedLockedChapter,
          );

          const isExactPathCandidate =
            exactPathCandidates &&
            exactPathCandidates.some((exactCandidate) => {
              const exactKey =
                exactCandidate.id ||
                `${exactCandidate.rubric}-${exactCandidate.chapter}`;

              const currentKey =
                rubricEntry.id ||
                `${rubricEntry.rubric}-${rubricEntry.chapter}`;

              return exactKey === currentKey;
            });

          const isCanonicalLeafPathCandidate =
            canonicalLeafPathCandidateKeys &&
            canonicalLeafPathCandidateKeys.has(
              rubricEntry.id || `${rubricEntry.rubric}-${rubricEntry.chapter}`,
            );

          if (!allowedLockedChapters.has(normalizedRubricChapter)) {
            chapterFilteredCount++;
            continue;
          }

          chapterWeight =
            isExactPathCandidate || isCanonicalLeafPathCandidate
              ? currentChapterCandidates[normalizedRubricChapter] || 1
              : currentChapterCandidates[normalizedLockedChapter] || 0;
        } else {
          chapterWeight =
            currentChapterCandidates[normalizedRubricChapter] || 0;
        }
      }

      if (chapterWeight > 0) {
        currentRelevantRubrics.push(rubricEntry);
      } else {
        chapterFilteredCount++;
      }
    }
    console.log(
      `[TRACE STAGE 4] chapter filtering: currentRelevantRubrics.length after chapter filtering: ${currentRelevantRubrics.length}`,
    );

    // If chapter filtering drastically reduced results, try a less strict chapter interpretation or broader search if needed.
    // (Further enhancements could go here, e.g., if currentRelevantRubrics is still too low)

    for (const rubricEntry of currentRelevantRubrics) {
      // Score all relevant rubrics. Rubrics with chapterWeight 0 would have already been filtered out if strict filtering is enabled.
      // ============================================================
      // CANONICAL EXACT PATH SCORING OVERRIDE
      // ============================================================
      // When the complete canonical symptom path exactly matches a
      // repertory path, preserve that rubric during scoring even if
      // upstream chapter inference selected a different chapter.
      //
      // IMPORTANT:
      // Partial exact candidates such as "Menses", "Absent", or "Mind"
      // do NOT receive this override.
      const normalizedCanonicalExactPath = canonicalSymptom
        ? normalizeRubricPathForExactLookup(canonicalSymptom)
        : "";

      const normalizedRubricExactPath = normalizeRubricPathForExactLookup(
        rubricEntry.path || rubricEntry.rubric,
      );
      const painOrCharacterTokens = [
        "pain",
        "ache",
        "throbbing",
        "pulsating",
        "beating",
        "pounding",
        "radiating",
      ];
      const queryTextLower =
        `${canonicalSymptom || ""} ${normalizedOriginalSymptom || ""}`.toLowerCase();
      const isPainCharacterQuery = painOrCharacterTokens.some((tok) =>
        queryTextLower.includes(tok),
      );

      const isCanonicalExactPathCandidate =
        (Boolean(normalizedCanonicalExactPath) &&
          normalizedRubricExactPath === normalizedCanonicalExactPath) ||
        normalizeRubricPathForExactLookup(rubricEntry.rubric || "") ===
          normalizedCanonicalExactPath;

      if (isPainCharacterQuery && !isCanonicalExactPathCandidate) {
        const entryTextLower =
          `${rubricEntry.rubric || ""} ${rubricEntry.path || ""}`.toLowerCase();
        const matchesPainOrCharacter = painOrCharacterTokens.some((tok) =>
          entryTextLower.includes(tok),
        );
        if (!matchesPainOrCharacter) {
          continue;
        }
      }

      const rubricCandidateKey =
        rubricEntry.id || `${rubricEntry.rubric}-${rubricEntry.chapter}`;

      const isCanonicalLeafPathCandidateForScoring =
        canonicalLeafPathCandidateKeys &&
        canonicalLeafPathCandidateKeys.has(rubricCandidateKey);

      const isAuthoritativeExactCandidate = isCanonicalExactPathCandidate;

      const scoringChapterCandidates = isAuthoritativeExactCandidate
        ? {
            ...currentChapterCandidates,
            [normalizeChapterName(rubricEntry.chapter).toUpperCase()]: 1,
          }
        : currentChapterCandidates;

      const { score, matchType, chapterWeight, baseSearchScore } =
        _scoreRubricMatch(
          rubricEntry,
          Array.from(allSearchableTerms),
          canonicalSymptom,
          scoringChapterCandidates,
        );

      if (isCanonicalExactPathCandidate) {
        console.log(
          `[CANONICAL EXACT SCORE] ` +
            `${rubricEntry.id} | ` +
            `chapter=${rubricEntry.chapter} | ` +
            `score=${score} | ` +
            `chapterWeight=${chapterWeight}`,
        );
      }

      if (isCanonicalLeafPathCandidateForScoring) {
        console.log(
          `[CANONICAL LEAF SCORE] ` +
            `${rubricEntry.id} | ` +
            `chapter=${rubricEntry.chapter} | ` +
            `score=${score} | ` +
            `chapterWeight=${chapterWeight}`,
        );
      }

      if (score > 0) {
        const finalCollectionScore = isCanonicalExactPathCandidate
          ? Math.max(1080, Number(score) || 0)
          : score;

        const key =
          rubricEntry.id || `${rubricEntry.rubric}-${rubricEntry.chapter}`;

        if (
          !collectedRubrics.has(key) ||
          finalCollectionScore > collectedRubrics.get(key).score
        ) {
          collectedRubrics.set(key, {
            ...rubricEntry,
            score: finalCollectionScore,
            matchType: isCanonicalLeafPathCandidateForScoring
              ? "Canonical Leaf Exact"
              : matchType,
            chapterWeight: isCanonicalLeafPathCandidateForScoring
              ? 1
              : chapterWeight,
            baseSearchScore,
          });
        }
      }
    }

    // DEBUG EXACT PATH SURVIVAL TRACE
    if (exactPathCandidates && exactPathCandidates.length > 0) {
      console.log(
        `[EXACT TRACE] Before results construction: ${exactPathCandidates.length} exact candidate(s)`,
      );

      for (const exactCandidate of exactPathCandidates) {
        const exactKey =
          exactCandidate.id ||
          `${exactCandidate.rubric}-${exactCandidate.chapter}`;

        console.log(
          `[EXACT TRACE] Candidate ID=${exactCandidate.id} | RUBRIC=${exactCandidate.rubric} | CHAPTER=${exactCandidate.chapter} | IN_COLLECTED=${collectedRubrics.has(exactKey)}`,
        );
      }
    }
    let results = Array.from(collectedRubrics.values());
    console.log(
      `[TRACE STAGE 6] final search result: results.length (before sorting): ${results.length}`,
    );

    // A locked chapter stays authoritative even when it has few matches.
    // Cross-chapter recovery is reserved for searches without a chapter lock.
    if (
      (!lockedChapter || lockedChapter === "Any") &&
      results.length < MIN_STRICT_RESULTS_FOR_RECOVERY
    ) {
      console.log(
        `[CROSS-CHAPTER RECOVERY] Triggered for query: '${canonicalSymptom}', locked chapter: '${lockedChapter}' due to insufficient strict results (${results.length}).`,
      );
      const effectiveSearchTerm = Array.from(
        new Set(
          [canonicalSymptom, ...searchTerms, ...allSearchableTerms].filter(
            Boolean,
          ),
        ),
      ).join(" ");
      if (effectiveSearchTerm) {
        const recoveryFlexSearchResults = await withTimeout(
          rubricSearchIndex.searchAsync(
            effectiveSearchTerm,
            MAX_CANDIDATE_RUBRICS * 5,
          ), // Search for more to allow for filtering
          5000,
          "FlexSearch recovery search timed out",
        );

        const strictResultIds = new Set(results.map((r) => r.id));
        const recoveryCandidates = [];

        for (const id of recoveryFlexSearchResults) {
          const recoveryRubricEntry = global.masterRepertory[id];
          if (!recoveryRubricEntry) continue;

          // Avoid duplicating results already found by the strict search
          if (strictResultIds.has(recoveryRubricEntry.id)) {
            continue;
          }
          // STEP 8C: Enforce chapter restrictions during recovery
          const recoveryChapter = normalizeChapterName(
            recoveryRubricEntry.chapter || "",
          ).toUpperCase();
          const normalizedAllowedChapters = new Set(
            (globalAllowedChapters || []).map((chapter) =>
              normalizeChapterName(chapter).toUpperCase(),
            ),
          );
          const normalizedRejectedChapters = new Set(
            (rejectedChapters || []).map((chapter) =>
              normalizeChapterName(chapter).toUpperCase(),
            ),
          );
          if (normalizedRejectedChapters.has(recoveryChapter)) continue;
          if (
            normalizedAllowedChapters.size > 0 &&
            !normalizedAllowedChapters.has(recoveryChapter)
          ) {
            continue;
          }

          const { score, matchType, chapterWeight, baseSearchScore } =
            _scoreRubricMatch(
              recoveryRubricEntry,
              Array.from(allSearchableTerms),
              canonicalSymptom,
              currentChapterCandidates,
              true,
            ); // Pass true to indicate recovery mode

          if (score > 0) {
            let finalRecoveryScore =
              score * CROSS_CHAPTER_RECOVERY_SCORE_PENALTY_MULTIPLIER;

            // --- STEP 4B: Apply context-aware recovery adjustment ---
            const contextAdjustment = _calculateContextEvidenceScoreAdjustment(
              lockedChapter,
              canonicalSymptom,
              recoveryRubricEntry.rubric,
              recoveryRubricEntry.path,
              recoveryRubricEntry.chapter, // New argument
            );
            finalRecoveryScore += contextAdjustment;
            // --- END STEP 4B ---

            if (finalRecoveryScore > 0) {
              // Re-check score after adjustment
              recoveryCandidates.push({
                ...recoveryRubricEntry,
                score: finalRecoveryScore,
                matchType,
                chapterWeight,
                baseSearchScore,
                isCrossChapterRecovery: true,
                sourceChapter: recoveryRubricEntry.chapter,
                recoveryReason:
                  "strict_chapter_no_sufficient_match" +
                  (contextAdjustment < 0
                    ? "_no_context_evidence"
                    : "_context_aware"), // Add more detail to reason
                contextAdjustment: contextAdjustment, // For debugging/analysis
              });
            } else {
            }
          } else {
          }
        }
        results = results.concat(recoveryCandidates);
        console.log(
          `[CROSS-CHAPTER RECOVERY] Added ${recoveryCandidates.length} recovery candidates. Total results now: ${results.length}`,
        );
      } else {
        console.log(
          `[CROSS-CHAPTER RECOVERY] No effective search term for recovery for query: '${canonicalSymptom}'.`,
        );
      }
    }
    // --- End Cross-Chapter Recovery ---

    // The original Kent-first prioritization logic is now handled earlier in the isMindSymptom block.
    // Remove lines 350-356 from original, as the logic has been moved and enhanced.

    // ============================================================
    // SKIN CHAPTER AUTHORITY FILTER
    // ============================================================
    // Skin descriptors and explicit SKIN chapter authority must never
    // be rejected by the non-skin filter.
    //
    // This is intentionally based on BOTH:
    //   1. canonical symptom text
    //   2. physician chapterCandidates / primary chapter
    //
    // This prevents cases such as:
    //   "black discoloration"
    //   "dark discoloration"
    //   "bluish discoloration"
    //   "pigmentation"
    // from losing valid SKIN rubrics downstream.

    const skinKeywordsRegex =
      /skin|eruption|ulcer|herpes|itch|rash|psoriasis|dermatitis|eczema|discoloration|discolouration|pigmentation|depigmentation|hyperpigmentation|hypopigmentation|darkening/i;

    const normalizedCanonicalExactPath =
      normalizeRubricPathForExactLookup(canonicalSymptom);

    // Recover chapter authority supplied by physician thinking.
    const candidateChapterNames =
      chapterCandidates && typeof chapterCandidates === "object"
        ? Object.keys(chapterCandidates).map((x) => String(x).toUpperCase())
        : [];

    const hasSkinChapterAuthority = candidateChapterNames.some(
      (ch) => ch === "SKIN" || ch.includes("SKIN"),
    );

    const isSkinDescriptor = skinKeywordsRegex.test(
      String(canonicalSymptom || ""),
    );

    const skinFilterShouldApply = !hasSkinChapterAuthority && !isSkinDescriptor;

    console.log(
      "[SKIN AUTHORITY DEBUG] canonical=" +
        JSON.stringify(canonicalSymptom) +
        " | hasSkinChapterAuthority=" +
        hasSkinChapterAuthority +
        " | isSkinDescriptor=" +
        isSkinDescriptor +
        " | filterApplies=" +
        skinFilterShouldApply,
    );

    if (skinFilterShouldApply) {
      const initialLength = results.length;

      results = results.filter((r) => {
        const normalizedRubricPath = normalizeRubricPathForExactLookup(
          r.path || r.rubric || "",
        );

        // Never discard a rubric that is an exact match for the
        // canonical master-repertory path supplied by the caller.
        const isCanonicalExactPath =
          Boolean(normalizedCanonicalExactPath) &&
          normalizedRubricPath === normalizedCanonicalExactPath;

        if (isCanonicalExactPath) {
          console.log(
            "[SKIN FILTER BYPASS] Preserving canonical exact path: " +
              JSON.stringify(r.path || r.rubric),
          );
          return true;
        }

        return (
          !r.chapter ||
          (!String(r.chapter).toUpperCase().includes("SKIN") &&
            !String(r.chapter).toUpperCase().includes("CLINICAL_SKIN"))
        );
      });

      if (initialLength !== results.length) {
        console.log(
          "[DEBUG Skin Filter] Filtered out " +
            (initialLength - results.length) +
            " skin-related rubrics for non-skin symptom: " +
            JSON.stringify(canonicalSymptom),
        );
      }
    } else {
      console.log(
        "[SKIN FILTER BYPASS] Skin authority/descriptor detected; " +
          "SKIN rubrics are allowed.",
      );
    }

    // ============================================================
    // STEP 9D - SKIN DESCRIPTOR PRECISION
    // Prevent opposite/derived pigmentation terms from leaking
    // into a direct "pigmentation" query.
    // ============================================================

    const normalizedSkinDescriptorQuery =
      _normalizeSearchString(canonicalSymptom);

    if (
      normalizedSkinDescriptorQuery === "pigmentation" &&
      Array.isArray(results)
    ) {
      const beforePigmentationPrecision = results.length;

      results = results.filter((r) => {
        const text = _normalizeSearchString(
          (r.path || "") + " " + (r.rubric || ""),
        );

        // "depigmentation" is not equivalent to direct
        // "pigmentation"; do not let it satisfy the query.
        if (text.includes("depigmentation")) {
          return false;
        }

        return true;
      });

      const removedPigmentationPrecision =
        beforePigmentationPrecision - results.length;

      if (removedPigmentationPrecision > 0) {
        console.log(
          "[STEP 9D PIGMENTATION PRECISION] Removed " +
            removedPigmentationPrecision +
            " depigmentation-derived candidate(s) from direct pigmentation query.",
        );
      }
    }

    // Final precision filter: remove standalone generic modality rubrics
    // when the query contains a multi-word clinical symptom.
    const genericStandaloneRubrics = new Set([
      "better",
      "worse",
      "pressure",
      "motion",
      "rest",
      "warmth",
      "cold",
      "night",
      "morning",
      "evening",
    ]);

    const normalizedQueryWords = _normalizeSearchString(canonicalSymptom)
      .split(/\s+/)
      .filter(Boolean);

    if (normalizedQueryWords.length > 1) {
      const beforeGenericFilter = results.length;

      results = results.filter((rubricEntry) => {
        const normalizedRubric = _normalizeSearchString(
          rubricEntry.rubric || "",
        );

        return !genericStandaloneRubrics.has(normalizedRubric);
      });

      console.log(
        `[PRECISION FILTER] Removed ${beforeGenericFilter - results.length} generic standalone rubrics.`,
      );
    }

    // ============================================================
    // CANONICAL LEAF FINAL INJECTION
    // ============================================================
    // If an exact clinical leaf was recovered earlier but
    // was eliminated by intermediate chapter/token filtering,
    // restore it here with an authoritative exact-leaf score.
    // This is intentionally limited to candidates already
    // verified by the exact leaf index.
    // ============================================================
    if (canonicalLeafPathCandidates && canonicalLeafPathCandidates.length > 0) {
      for (const leafRubric of canonicalLeafPathCandidates) {
        if (!leafRubric) continue;

        const leafKey =
          leafRubric.id ||
          (leafRubric.path || leafRubric.rubric || "") +
            "-" +
            (leafRubric.chapter || "");

        const alreadyReturned = results.some((existing) => {
          const existingKey =
            existing.id ||
            (existing.path || existing.rubric || "") +
              "-" +
              (existing.chapter || "");
          return existingKey === leafKey;
        });

        if (alreadyReturned) continue;

        // FINAL CHAPTER SAFETY:
        // Do not re-inject a canonical leaf from a chapter that
        // violates the active primary chapter lock.
        const normalizedLeafChapter = normalizeChapterName(
          leafRubric.chapter,
        ).toUpperCase();

        const normalizedLockedChapter =
          normalizeChapterName(lockedChapter).toUpperCase();

        const leafAllowedByChapter =
          !lockedChapter ||
          lockedChapter === "Any" ||
          getAllowedLockedChapters(normalizedLockedChapter).has(
            normalizedLeafChapter,
          );

        if (!leafAllowedByChapter) {
          console.log(
            "[CANONICAL LEAF FINAL SKIP - CHAPTER LOCK] " +
              (leafRubric.id || "NO_ID") +
              " | leafChapter=" +
              normalizedLeafChapter +
              " | lockedChapter=" +
              normalizedLockedChapter +
              " | path=" +
              (leafRubric.path || leafRubric.rubric || ""),
          );
          continue;
        }
        const leafLabel = String(leafRubric.path || leafRubric.rubric || "")
          .split(">")
          .pop()
          .trim();

        const leafChapterCandidates = currentChapterCandidates;

        const leafScoreData = _scoreRubricMatch(
          leafRubric,
          [leafLabel],
          leafLabel,
          leafChapterCandidates,
        );

        const finalLeafScore = Number(leafScoreData.score) || 0;

        results.push({
          ...leafRubric,
          score: finalLeafScore,
          matchType: "Canonical Leaf Exact",
          chapterWeight: 1,
          baseSearchScore: 1000,
          isCanonicalLeafExact: true,
        });

        console.log(
          "[CANONICAL LEAF FINAL INJECT] " +
            (leafRubric.id || "NO_ID") +
            " | " +
            (leafRubric.chapter || "") +
            " | " +
            (leafRubric.path || leafRubric.rubric || "") +
            " | score=" +
            finalLeafScore,
        );
      }
    }

    // ============================================================
    // ORIGINAL EXACT PATH AUTHORITY FILTER
    // ============================================================
    // When the user's original input is itself an exact master
    // repertory path, that exact path is authoritative.
    //
    // Keep all source/version records representing that exact path,
    // but remove unrelated lexical/semantic candidates that were
    // added from individual words in the same query.
    // ============================================================
    const normalizedOriginalExactPath = normalizedOriginalSymptom
      ? normalizeRubricPathForExactLookup(normalizedOriginalSymptom)
      : "";

    if (
      normalizedOriginalExactPath &&
      normalizedOriginalExactPath.includes(" > ") &&
      getExactRubricPathIndex().has(normalizedOriginalExactPath) &&
      results.length > 0
    ) {
      const beforeExactAuthorityFilter = results.length;

      const exactPathOnlyResults = results.filter((rubricEntry) => {
        const normalizedResultPath = normalizeRubricPathForExactLookup(
          rubricEntry.path || rubricEntry.rubric || "",
        );

        return normalizedResultPath === normalizedOriginalExactPath;
      });

      if (exactPathOnlyResults.length > 0) {
        results = exactPathOnlyResults;

        console.log(
          `[ORIGINAL EXACT AUTHORITY] ` +
            `Restricted "${normalizedOriginalSymptom}" ` +
            `from ${beforeExactAuthorityFilter} result(s) to ` +
            `${results.length} exact-path result(s)`,
        );
      }
    }
    // ============================================================
    // ORIGINAL EXACT LEAF AUTHORITY FILTER
    // ============================================================
    // When the user's original input exactly matches a repertory
    // leaf label, restrict final results to the authoritative leaf
    // path(s) represented by the exact leaf index.
    //
    // Prefer Clarke exact-leaf records when the same leaf label is
    // present in multiple source hierarchies. This preserves the
    // benchmark's canonical clinical hierarchy while retaining all
    // source/version records for the selected path.
    //
    // Full exact master paths are handled by the path-authority
    // filter above, so this block applies only to leaf-only inputs.
    // ============================================================
    const normalizedOriginalLeafKey = normalizedOriginalSymptom
      ? normalizeRubricPathForExactLookup(normalizedOriginalSymptom)
      : "";

    const originalPathIndex = getExactRubricPathIndex();

    const originalLeafIndex = getExactRubricLeafIndex();

    const isStructuredOriginalPath = normalizedOriginalLeafKey.includes(" > ");

    if (
      normalizedOriginalLeafKey &&
      !isStructuredOriginalPath &&
      originalLeafIndex.has(normalizedOriginalLeafKey) &&
      results.length > 0
    ) {
      const exactLeafRecords =
        originalLeafIndex.get(normalizedOriginalLeafKey) || [];

      // For leaf-only input, preserve ALL paths verified by the
      // exact leaf index. Do not collapse to Clarke-only paths.
      //
      // Full structured paths are handled separately by the
      // ORIGINAL EXACT PATH AUTHORITY block above.
      const authoritativeLeafPaths = new Set(
        exactLeafRecords
          .map((record) =>
            normalizeRubricPathForExactLookup(
              record?.path || record?.rubric || "",
            ),
          )
          .filter(Boolean),
      );
      if (authoritativeLeafPaths.size > 0) {
        const beforeLeafAuthorityFilter = results.length;

        const exactLeafOnlyResults = results.filter((rubricEntry) => {
          const normalizedResultPath = normalizeRubricPathForExactLookup(
            rubricEntry.path || rubricEntry.rubric || "",
          );

          return authoritativeLeafPaths.has(normalizedResultPath);
        });

        if (exactLeafOnlyResults.length > 0) {
          results = exactLeafOnlyResults;
        }
      }
    }
    console.log(
      "[PAIN DEBUG] normalizedOriginalSymptom =",
      JSON.stringify(normalizedOriginalSymptom),
    );
    console.log(
      "[PAIN DEBUG] pre-filter candidates =",
      JSON.stringify(
        results.map((entry) => ({
          id: entry?.id,
          rubric: entry?.rubric,
          path: entry?.path,
          chapter: entry?.chapter,
          source: entry?.source,
        })),
      ),
    );
    // TARGETED PAIN PRECISION FILTER
    // Suppress only a standalone generic "Pain" leaf when a multiword
    // original query has a more specific candidate. Preserve structured
    // paths, standalone Pain searches, and fallback results.
    const originalQueryWords = normalizeRubricPathForExactLookup(
      normalizedOriginalSymptom,
    )
      .split(/\s+/)
      .filter(Boolean);

    if (originalQueryWords.length > 1) {
      const hasSpecificCandidate = results.some((entry) => {
        const entryPath = String(entry?.path || entry?.rubric || "").trim();
        const entryLabel = entryPath.split(">").pop().trim();

        return (
          entryLabel &&
          normalizeRubricPathForExactLookup(entryLabel) !== "PAIN" &&
          normalizeRubricPathForExactLookup(entryPath) !== "PAIN"
        );
      });

      if (hasSpecificCandidate) {
        const beforePainPrecisionFilter = results.length;

        results = results.filter((entry) => {
          const entryPath = String(entry?.path || entry?.rubric || "").trim();
          const entryLabel = entryPath.split(">").pop().trim();
          const isStandalonePain =
            normalizeRubricPathForExactLookup(entryPath) === "PAIN" ||
            (!entryPath.includes(">") &&
              normalizeRubricPathForExactLookup(entryLabel) === "pain");

          return !isStandalonePain;
        });

        console.log(
          `[PAIN PRECISION FILTER] Removed ${beforePainPrecisionFilter - results.length} standalone Pain candidate(s).`,
        );
      }
    }

    if (lockedChapter && lockedChapter !== "Any") {
      const allowedLockedChapters = getAllowedLockedChapters(lockedChapter);
      const beforeFinalChapterFilter = results.length;
      results = results.filter((entry) =>
        allowedLockedChapters.has(
          normalizeChapterName(entry.chapter).toUpperCase(),
        ),
      );
      chapterFilteredCount += beforeFinalChapterFilter - results.length;
    }

    // FINAL OUTPUT DEDUP: collapse only clinically identical records.
    const finalDedupMap = new Map();

    for (const entry of results) {
      const norm = (value) =>
        String(value ?? "")
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();

      const remedies = (Array.isArray(entry.remedies) ? entry.remedies : [])
        .map((remedy) => ({
          name: norm(remedy?.canonical || remedy?.name),
          grade: remedy?.grade ?? null,
          normalizedGrade: remedy?.normalizedGrade ?? null,
        }))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

      const fingerprint = JSON.stringify({
        path: norm(entry.path || entry.rubric),
        chapter: norm(entry.chapter),
        source: norm(entry.source),
        remedies,
        miasm: norm(entry.miasm),
        notes: norm(entry.notes),
        metadata: entry.metadata ?? null,
        priority_weight: entry.priority_weight ?? null,
      });

      const existing = finalDedupMap.get(fingerprint);
      if (
        !existing ||
        (Number(entry.score) || 0) > (Number(existing.score) || 0)
      ) {
        finalDedupMap.set(fingerprint, entry);
      }
    }

    const deduplicatedResults = Array.from(finalDedupMap.values());
    console.log(
      `[FINAL OUTPUT DEDUP] Removed ${results.length - deduplicatedResults.length} identical record(s).`,
    );

    const finalCandidateRubrics = deduplicatedResults.sort(
      (a, b) => b.score - a.score,
    );

    return {
      rubrics: finalCandidateRubrics.slice(0, MAX_CANDIDATE_RUBRICS),
      rubricsScanned: totalRubricsBeforeFiltering,
      rubricsFilteredByChapterWeight: chapterFilteredCount,
      finalCandidateRubrics: finalCandidateRubrics,
      searchAttemptType: searchAttemptType, // Indicate which search strategy was successful
      isCrossChapterRecovery: finalCandidateRubrics.some(
        (r) => r.isCrossChapterRecovery === true,
      ),
    };
  } catch (err) {
    console.error("[ERROR] Search service error:", err.message, err.stack);
    return {
      rubrics: [],
      rubricsScanned: 0,
      rubricsFilteredByChapterWeight: 0,
      finalCandidateRubrics: [],
      searchAttemptType: "Error",
    };
  }
}

module.exports = {
  searchRubricsWithChapterLock,
  _scoreRubricMatch, // Export for testing purposes
  MAX_CANDIDATE_RUBRICS,
  getExactRubricPathIndex,
  getExactRubricLeafIndex,
  getExactRubricFieldIndex,
  normalizeRubricPathForExactLookup,
  getAllowedLockedChapters,
};
