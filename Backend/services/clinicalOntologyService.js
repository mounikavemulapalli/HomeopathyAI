const fs = require("fs");
const path = require("path");

const clinicalOntologyFilePath = path.join(__dirname, "clinicalOntologyData.json");
let clinicalOntology = {};

try {
    const rawData = fs.readFileSync(clinicalOntologyFilePath, "utf8");
    clinicalOntology = JSON.parse(rawData);
    console.log("Successfully loaded clinical ontology from clinicalOntologyData.json");
} catch (error) {
    console.error(`Error loading clinical ontology: ${error.message}`);
    clinicalOntology = {}; // Fallback to an empty object if loading fails.
}

// 1. Chapter Normalization Map (expanded and centralized)
const chapterNormalizationMap = {
    "CLINICAL_CLARKE_SLEEP": "SLEEP",
    "CLINICAL_SLEEP": "SLEEP",
    "BOGER_GENERAL": "GENERALITIES",
    "BBCR_GENERAL": "GENERALITIES",
    "GENERALS": "GENERALITIES",
    "GENERAL": "GENERALITIES",
    "CONDITIONS IN GENERAL": "GENERALITIES",
    "FOODS": "FOOD AND DRINKS",
    "FOOD AND DRINK": "FOOD AND DRINKS",
    "DREAM": "DREAMS",
    "FEMALE GENITALIA": "GENITALIA FEMALE", // Alias for consistency with masterRepertory
    "STOMACH": "STOMACH", // Explicitly mapping for consistency if needed
    "PERSPIRATION": "PERSPIRATION",
    "SLEEP": "SLEEP",
    "RECTUM": "RECTUM",
    "URINARY ORGANS": "URINARY ORGANS",
    "RESPIRATION": "RESPIRATION",
    "HEAD": "HEAD",
    "SKIN": "SKIN",
    "MIND": "MIND",
    "CHILL": "CHILL",
    // Add more mappings as identified. This map can be extended dynamically or loaded from a configuration.
};

// 2. Function to normalize chapters
function normalizeChapterName(chapterName) {
    if (!chapterName) return chapterName;
    const normalized = chapterName.toUpperCase();
    const result = chapterNormalizationMap[normalized] || chapterNormalizationMap[chapterName] || chapterName;
    // console.log(`[DEBUG normalizeChapterName] Original: ${chapterName}, Normalized: ${result}`);
    return result;
}

// 3. Process the ontology for normalization, merging synonyms, and preliminary duplicate handling
let newClinicalOntology = {};
// Map to track canonical concepts by their lowercase name to handle duplicates across chapters.
let canonicalConceptTracker = new Map(); 

for (const chapterName in clinicalOntology) {
    const normalizedChapter = normalizeChapterName(chapterName);

    if (!newClinicalOntology[normalizedChapter]) {
        newClinicalOntology[normalizedChapter] = {};
    }

    const chapterConcepts = clinicalOntology[chapterName];
    for (const canonicalName in chapterConcepts) {
        const entry = chapterConcepts[canonicalName];
        const lowerCaseCanonicalName = canonicalName.toLowerCase();

        // Check if this exact canonicalName exists within the *normalized* chapter
        const existingEntryInNormalizedChapter = newClinicalOntology[normalizedChapter][canonicalName];

        if (existingEntryInNormalizedChapter) {
            // Case 1: Same canonicalName in the same normalized chapter (due to multiple original chapters normalizing to the same new chapter)
            // Merge synonyms and sources
            existingEntryInNormalizedChapter.commonMedicalSynonyms = [...new Set([...(existingEntryInNormalizedChapter.commonMedicalSynonyms || []), ...(entry.commonMedicalSynonyms || [])])];
            existingEntryInNormalizedChapter.clinicalSynonyms = [...new Set([...(existingEntryInNormalizedChapter.clinicalSynonyms || []), ...(entry.clinicalSynonyms || [])])];
            existingEntryInNormalizedChapter.diseaseAliases = [...new Set([...(existingEntryInNormalizedChapter.diseaseAliases || []), ...(entry.diseaseAliases || [])])];
            existingEntryInNormalizedChapter.commonAbbreviations = [...new Set([...(existingEntryInNormalizedChapter.commonAbbreviations || []), ...(entry.commonAbbreviations || [])])];
            const currentSources = new Set(existingEntryInNormalizedChapter.source || []);
            const newSources = Array.isArray(entry.source) ? entry.source : [(entry.source || chapterName.split("_")[0])];
            newSources.forEach(s => currentSources.add(s));
            existingEntryInNormalizedChapter.source = [...currentSources];
        } else if (!canonicalConceptTracker.has(lowerCaseCanonicalName)) {
            // Case 2: New canonical concept (case-insensitive) for the normalized ontology
            // Add new canonical concept to the normalized chapter
            const source = Array.isArray(entry.source) ? entry.source : [(entry.source || chapterName.split("_")[0])];
            newClinicalOntology[normalizedChapter][canonicalName] = {
                ...entry,
                repertoryChapter: normalizedChapter, // Update to normalized chapter
                source: [...new Set(source)]
            };
            canonicalConceptTracker.set(lowerCaseCanonicalName, { chapter: normalizedChapter, canonicalName: canonicalName });
        } else {
            // Case 3: Canonical concept (case-insensitive) already exists in another normalized chapter
            // This means it\`s a duplicate across *different* normalized chapters. We need to merge its info.
            // We find the existing canonical concept and merge the synonyms and sources.
            const existingCanonicalInfo = canonicalConceptTracker.get(lowerCaseCanonicalName);
            const targetChapter = existingCanonicalInfo.chapter;
            const targetCanonicalName = existingCanonicalInfo.canonicalName;
            const targetEntry = newClinicalOntology[targetChapter][targetCanonicalName];

            if (targetEntry) {
                targetEntry.commonMedicalSynonyms = [...new Set([...(targetEntry.commonMedicalSynonyms || []), ...(entry.commonMedicalSynonyms || [])])];
                targetEntry.clinicalSynonyms = [...new Set([...(targetEntry.clinicalSynonyms || []), ...(entry.clinicalSynonyms || [])])];
                targetEntry.diseaseAliases = [...new Set([...(targetEntry.diseaseAliases || []), ...(entry.diseaseAliases || [])])];
                targetEntry.commonAbbreviations = [...new Set([...(targetEntry.commonAbbreviations || []), ...(entry.commonAbbreviations || [])])];
                const currentSources = new Set(targetEntry.source || []);
                const newSources = Array.isArray(entry.source) ? entry.source : [(entry.source || chapterName.split("_")[0])];
                newSources.forEach(s => currentSources.add(s));
                targetEntry.source = [...currentSources];
            } else {
                console.warn(`Canonical concept tracker inconsistency for ${canonicalName}`);
            }
        }
    }
}

// 4. Final pass to ensure each canonical concept exists only once globally.
// This step ensures that a canonical concept only appears once, even if it originated from multiple chapters
// that normalized to different newClinicalOntology keys.
let finalClinicalOntology = {};
let processedCanonicalConcepts = new Set(); // Tracks canonical concepts already added to final ontology

for (const normalizedChapter in newClinicalOntology) {
    for (const canonicalName in newClinicalOntology[normalizedChapter]) {
        const lowerCaseCanonicalName = canonicalName.toLowerCase();
        if (!processedCanonicalConcepts.has(lowerCaseCanonicalName)) {
            const entry = newClinicalOntology[normalizedChapter][canonicalName];
            if (!finalClinicalOntology[normalizedChapter]) {
                finalClinicalOntology[normalizedChapter] = {};
            }
            finalClinicalOntology[normalizedChapter][canonicalName] = entry;
            processedCanonicalConcepts.add(lowerCaseCanonicalName);
        } else {
            // If we encounter a canonical concept that has already been processed (i.e., it was a duplicate
            // across normalized chapters and its info was merged), we don\`t add it again to avoid duplication.
            // This effectively removes duplicate canonical concepts from the final structure.
            console.log(`Duplicate canonical concept ${canonicalName} in chapter ${normalizedChapter} was merged or already processed.`);
        }
    }
}

clinicalOntology = finalClinicalOntology;

// 5. Update the consultOntology function to use the refactored clinicalOntology
const consultOntology = (symptomInput) => {
  const contextOnlyCanonicalTerms = new Set([
    "morning",
    "evening",
    "night",
    "noon",
    "midnight",
    "after eating",
    "before eating",
    "during menses",
    "before menses",
    "after menses",
    "during sleep",
    "after sleep",
    "before sleep",
    "on waking",
    "while eating",
    "after exertion",
    "before exertion"
  ]);

  const normalizedSymptomInput = String(symptomInput).toLowerCase().trim();

  // Context-only phrases are not standalone clinical meanings.
  if (contextOnlyCanonicalTerms.has(normalizedSymptomInput)) {
    console.log(
      `[ONTOLOGY CONTEXT-ONLY] Input: ${symptomInput} -> no standalone canonical concept`
    );
    return null;
  }

  const normalizedInput = symptomInput.toLowerCase().trim();
  const ignoredSemanticTokens = new Set([
    "in", "at", "on", "of", "from", "to", "with", "for",
    "after", "before", "during", "while",
    "morning", "evening", "night", "noon", "midnight"
  ]);

  // Preserve the original input length before removing context/function tokens.
  const originalInputWords = normalizedInput
    .split(/\s+/)
    .filter(Boolean);

  const inputWords = originalInputWords
    .filter(word => !ignoredSemanticTokens.has(word));
  let matchedConcept = null;
  let highestMatchType = null;

  // Define the hierarchy of match types for prioritization
  const matchOrder = {
    "ontology_exact": 6, // New highest, for direct match to canonicalName
    "exact_synonym": 5, // Exact synonym matched inside profile (from user rules)
    "profile_alias": 4, // Profile alias matched (from user rules)
    "ontology_synonym": 3, // Ontology synonym (from user rules)
    "semantic_similarity": 2, // Semantic similarity (from user rules)
    "token_similarity_only": 1 // Token similarity only (from user rules)
  };

  // Helper to determine match type based on the rules for a given term
  const getMatchType = (term, entry, originalInput) => {
    const canonicalNameLower = entry.canonicalName.toLowerCase();
    const normalizedOriginalInput = originalInput.toLowerCase().trim();

    // Check for exact match with canonical name
    if (term === normalizedOriginalInput && term === canonicalNameLower) {
      return "ontology_exact";
    }

    // Check for exact match with common/clinical synonyms
    if ((entry.commonMedicalSynonyms || []).map(s => s.toLowerCase()).includes(term) ||
        (entry.clinicalSynonyms || []).map(s => s.toLowerCase()).includes(term)) {
        if (term === normalizedOriginalInput) { // If the input itself is an exact match to a synonym
            return "exact_synonym";
        }
        // If the term is a synonym, but not an exact match to the input, it\`s still a strong ontology match.
        // We\`ll consider this an "ontology_synonym" if no higher match is found later with the input.
    }

    // Check for exact match with aliases (diseaseAliases, commonAbbreviations)
    if ((entry.diseaseAliases || []).map(s => s.toLowerCase()).includes(term) ||
        (entry.commonAbbreviations || []).map(s => s.toLowerCase()).includes(term)) {
        if (term === normalizedOriginalInput) { // If the input itself is an exact match to an alias
            return "profile_alias";
        }
    }

    // Canonicalization safety: do not infer a canonical concept from
    // fuzzy semantic/token overlap. Exact canonical names and exact
    // true synonyms are handled above. Full natural-language phrases
    // remain available to downstream chapter/repertory retrieval.
    return null;
  };

  for (const chapterName in clinicalOntology) {
    const chapterConcepts = clinicalOntology[chapterName];
    for (const canonicalName in chapterConcepts) {
      const entry = chapterConcepts[canonicalName];
      const allTerms = [
        entry.canonicalName.toLowerCase(),
        ...(entry.commonMedicalSynonyms || []).map(s => s.toLowerCase()),
        ...(entry.clinicalSynonyms || []).map(s => s.toLowerCase()),
        ...(entry.diseaseAliases || []).map(s => s.toLowerCase()),
        ...(entry.commonAbbreviations || []).map(s => s.toLowerCase()),
      ];

      for (const term of allTerms) {
        const currentMatchType = getMatchType(term, entry, symptomInput);
        if (currentMatchType) {
          if (highestMatchType === null || matchOrder[currentMatchType] > matchOrder[highestMatchType]) {
            highestMatchType = currentMatchType;
            matchedConcept = {
              canonicalSymptom: canonicalName,
              chapter: entry.repertoryChapter,
              clinicalField: getClinicalField(symptomInput),
              synonyms: [...new Set([...(entry.commonMedicalSynonyms || []), ...(entry.clinicalSynonyms || []), ...(entry.diseaseAliases || [])])],
              searchTerms: [...new Set([...(entry.commonMedicalSynonyms || []), ...(entry.clinicalSynonyms || []), ...(entry.diseaseAliases || []), ...(entry.commonAbbreviations || [])])],
              source: entry.source || []
            };
            // Do not break here, allow lower confidence matches to be considered if they are better for the specific input
          }
        }
      }
    }
  }

  if (matchedConcept) {
    // Re-evaluate the matchType for the final matchedConcept against the original symptomInput
    // This ensures that even if a lower confidence term initially led to the concept, the overall match is re-assessed
    // based on the canonical symptom and its associated data against the full input.
    const finalMatchType = getMatchType(matchedConcept.canonicalSymptom.toLowerCase(), { canonicalName: matchedConcept.canonicalSymptom, commonMedicalSynonyms: matchedConcept.synonyms, clinicalSynonyms: [], diseaseAliases: [], commonAbbreviations: [] }, symptomInput);

    if (
      finalMatchType === "ontology_exact" ||
      finalMatchType === "exact_synonym"
    ) {
      console.log(`[ONTOLOGY MATCH] Input: ${symptomInput}\nCanonical Symptom: ${matchedConcept.canonicalSymptom}\nChapter: ${matchedConcept.chapter}\nMatch Type: ${finalMatchType}`);
      return { ...matchedConcept, matchType: finalMatchType };
    }

    console.log(`[ONTOLOGY REJECTED LOW CONFIDENCE] Input: ${symptomInput}\nCandidate: ${matchedConcept ? matchedConcept.canonicalSymptom : "none"}\nCandidate Match Type: ${highestMatchType || finalMatchType || "none"}\nReason: No exact canonical/synonym match`);
    return null;
  }

  return null;
};

// Original functions that are still needed, assuming they operate on the `clinicalOntology` object.
// Clinical Field Mapping
const explicitClinicalFieldMap = {
    "generalities": "GENERALITIES",
    "generals": "GENERALITIES",
    // Direct clinical/body field names
    "headache": "HEAD",
    "head pain": "HEAD",
    "head": "HEAD",

    "abdomen": "ABDOMEN",
    "abdominal pain": "ABDOMEN",

    "chest": "CHEST",
    "chest pain": "CHEST",

    "skin": "SKIN",
    "skin complaints": "SKIN",

    "face": "FACE",
    "mouth": "MOUTH",
    "tongue": "MOUTH",
    "throat": "THROAT",

    "extremities": "EXTREMITIES",
    "limbs": "EXTREMITIES",
    "joint": "EXTREMITIES",
    "joint pain": "EXTREMITIES",
    "foot": "EXTREMITIES",
    "feet": "EXTREMITIES",
    "sole": "EXTREMITIES",
    "soles": "EXTREMITIES",


    "stomach": "STOMACH",

    "rectum": "RECTUM",
    "urinary organs": "URINARY ORGANS",
    "respiration": "RESPIRATION",
    "cough": "RESPIRATION",

    "mind": "MIND",
    "grief": "MIND",
    "fear": "MIND",
    "anxiety": "MIND",
    "anger": "MIND",
    "jealousy": "MIND",
    "irritability": "MIND",

    "female genitalia": "GENITALIA FEMALE",
    "genitalia female": "GENITALIA FEMALE",
    "menses": "GENITALIA FEMALE",
    "menstruation": "GENITALIA FEMALE",

    "sleep": "SLEEP / DREAMS",
    "dreams": "SLEEP / DREAMS",

    "thermal": "GENERALITIES",
    "thirst": "GENERALITIES",
    "appetite": "GENERALITIES",
    "perspiration": "GENERALITIES",
    "sweat": "GENERALITIES",

    "craving": "GENERALITIES",
    "cravings": "GENERALITIES",
    "aversion": "GENERALITIES",
    "aversions": "GENERALITIES"
};
const clinicalFieldMap = {
    // GENITALIA FEMALE
    "amenorrhoea": "GENITALIA FEMALE",
    "scanty menses": "GENITALIA FEMALE",
    "leucorrhoea": "GENITALIA FEMALE",
    "menses": "GENITALIA FEMALE",
    "menstruation": "GENITALIA FEMALE",

    // SLEEP / DREAMS
    "sleep": "SLEEP / DREAMS",
    "dreams": "SLEEP / DREAMS",

    // GENERALITIES
    "thermal": "GENERALITIES",
    "thirst": "GENERALITIES",
    "appetite": "GENERALITIES",
    "cravings": "GENERALITIES",
    "aversions": "GENERALITIES",
    "hot patient": "GENERALITIES",
    "chilly patient": "GENERALITIES",
    "perspiration": "GENERALITIES",
    "sweat": "GENERALITIES",

    // RECTUM
    "rectum": "RECTUM", // Only map the chapter name directly

    // URINARY ORGANS
    "urinary organs": "URINARY ORGANS", // Only map the chapter name directly

    // RESPIRATION
    "respiration": "RESPIRATION",
    "cough": "RESPIRATION", // Only map the chapter name directly

    // HEAD
    "head": "HEAD", // Only map the chapter name directly


    // SKIN
    "skin complaints": "SKIN",
    "eczema": "SKIN",
    "eruptions": "SKIN",
    // MIND
    "mind": "MIND",
    "fear": "MIND",
    "anxiety": "MIND",
    "grief": "MIND",
    "anger": "MIND",
    "jealousy": "MIND",
    "irritability": "MIND",
    "weeping": "MIND",
    "weeps easily": "MIND",
    "weeping tendency": "MIND", // Added alias
    "depression": "MIND",
    "depression from grief": "MIND",
    "long lasting grief": "MIND", // Added alias

    // GENERALITIES additions
    "chilly patient": "GENERALITIES",
    "thirstless": "GENERALITIES",

    // FEMALE / GENITALIA FEMALE additions
    "delayed menses": "GENITALIA FEMALE",
    "scanty menses worse by day time": "GENITALIA FEMALE", // Added specific alias

    // HEAD additions
    "headache from sun": "HEAD",
    "throbbing headache worse by sun heat": "HEAD", // Added specific alias

    // SLEEP additions
    "disturbed sleep": "SLEEP / DREAMS",

    // FACE
    "face": "FACE",
    "eruptions face": "FACE",

    // MOUTH
    "mouth": "MOUTH",
    "tongue": "MOUTH",

    // THROAT
    "throat": "THROAT",
    "sore throat": "THROAT",

    // CHEST
    "chest": "CHEST",
    "palpitation": "CHEST",

    // EXTREMITIES
    "extremities": "EXTREMITIES",
    "pain limbs": "EXTREMITIES",
    "joint pain": "EXTREMITIES",
    "foot": "EXTREMITIES",
    "feet": "EXTREMITIES",
    "sole": "EXTREMITIES",
    "soles": "EXTREMITIES",


    // STOMACH
    "stomach": "STOMACH",
    "nausea": "STOMACH",
    "vomiting": "STOMACH",
    "indigestion": "STOMACH",

    // ABDOMEN
    "abdomen": "ABDOMEN",
    "abdominal pain": "ABDOMEN",
};


const getClinicalField = (symptomText) => {
    if (symptomText === null || symptomText === undefined) {
        return "UNKNOWN";
    }

    const rawText =
        typeof symptomText === "object"
            ? String(symptomText.field || symptomText.value || "")
            : String(symptomText);

    const normalizedSymptom = rawText.toLowerCase().trim();

    // Explicit structured/legacy field context has highest priority.
    const bracketMatch = normalizedSymptom.match(/^\s*\[([^\]]+)\]/);

    if (bracketMatch) {
        const explicitField = bracketMatch[1].trim();

        if (explicitClinicalFieldMap[explicitField]) {
            return explicitClinicalFieldMap[explicitField];
        }
    }

    // Exact field name.
    if (explicitClinicalFieldMap[normalizedSymptom]) {
        return explicitClinicalFieldMap[normalizedSymptom];
    }

    // Natural-language context detection.
    // Longest keys are checked first so specific contexts win over shorter ones.
    const explicitFieldKeywords = Object.keys(explicitClinicalFieldMap)
        .sort((a, b) => b.length - a.length);

    for (const keyword of explicitFieldKeywords) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

        if (regex.test(normalizedSymptom)) {
            return explicitClinicalFieldMap[keyword];
        }
    }

    // Existing phrase/symptom mapping remains fallback.
    // Descriptor-only mappings must not manufacture a chapter.
    for (const keyword of Object.keys(clinicalFieldMap).sort((a, b) => b.length - a.length)) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

        if (regex.test(normalizedSymptom)) {
            return clinicalFieldMap[keyword];
        }
    }

    return "UNKNOWN";
};


// Original functions that are still needed, assuming they operate on the `clinicalOntology` object.
const STRICT_CONSTITUTIONAL_GENERALS = []; // These lists/maps might need to be re-evaluated after refactoring
const constitutionalChapterMap = {};

const isStrictConstitutionalGeneral = (symptom) => {
  return false;
};

const getConstitutionalCategory = (symptom) => {
  return null;
};

const getChapterForConstitutionalSymptom = (symptom) => {
  return null;
};

const STRICT_PARTICULARS_LIST = [];

const isStrictParticular = (symptom) => {
  return false;
};

module.exports = { consultOntology, clinicalOntology, isStrictConstitutionalGeneral, constitutionalChapterMap, getConstitutionalCategory, getChapterForConstitutionalSymptom, STRICT_PARTICULARS_LIST, isStrictParticular, normalizeChapterName, getClinicalField };







