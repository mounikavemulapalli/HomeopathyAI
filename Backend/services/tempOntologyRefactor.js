
const fs = require('fs');
const path = require('path');

const clinicalOntologyFilePath = path.join(__dirname, 'clinicalOntologyData.json');
let clinicalOntology = {};

try {
    const rawData = fs.readFileSync(clinicalOntologyFilePath, 'utf8');
    clinicalOntology = JSON.parse(rawData);
    console.log('Successfully loaded clinical ontology from clinicalOntologyData.json');
} catch (error) {
    console.error(`Error loading clinical ontology: ${error.message}`);
    clinicalOntology = {}; // Fallback to an empty object if loading fails.
}

// 1. Chapter Normalization Map
const chapterNormalizationMap = {
    "CLINICAL_CLARKE_SLEEP": "SLEEP",
    "CLINICAL_SLEEP": "SLEEP",
    "BOGER_GENERAL": "GENERALITIES",
    "BBCR_GENERAL": "GENERALITIES",
    // Add more mappings as identified
};

// 2. Function to normalize chapters
function normalizeChapterName(chapterName) {
    return chapterNormalizationMap[chapterName] || chapterName;
}

// 3. Process the ontology
let newClinicalOntology = {};
let canonicalConceptMap = new Map(); // To track canonical concepts and their sources

for (const chapterName in clinicalOntology) {
    const normalizedChapter = normalizeChapterName(chapterName);

    if (!newClinicalOntology[normalizedChapter]) {
        newClinicalOntology[normalizedChapter] = {};
    }

    const chapterConcepts = clinicalOntology[chapterName];
    for (const canonicalName in chapterConcepts) {
        const entry = chapterConcepts[canonicalName];
        const existingEntry = newClinicalOntology[normalizedChapter][canonicalName];

        if (existingEntry) {
            // Merge synonyms and sources if canonical concept already exists
            existingEntry.commonMedicalSynonyms = [...new Set([...(existingEntry.commonMedicalSynonyms || []), ...(entry.commonMedicalSynonyms || [])])];
            existingEntry.clinicalSynonyms = [...new Set([...(existingEntry.clinicalSynonyms || []), ...(entry.clinicalSynonyms || [])])];
            existingEntry.diseaseAliases = [...new Set([...(existingEntry.diseaseAliases || []), ...(entry.diseaseAliases || [])])];
            existingEntry.commonAbbreviations = [...new Set([...(existingEntry.commonAbbreviations || []), ...(entry.commonAbbreviations || [])])];
            existingEntry.source = [...new Set([...(existingEntry.source || []), (entry.source || chapterName.split('_')[0])])]; // Assuming source can be derived from original chapter name or is present in entry
        } else {
            // Add new canonical concept
            // Ensure source is an array and add based on original chapter name if not present
            const source = Array.isArray(entry.source) ? entry.source : [(entry.source || chapterName.split('_')[0])];
            newClinicalOntology[normalizedChapter][canonicalName] = {
                ...entry,
                repertoryChapter: normalizedChapter,
                source: [...new Set(source)]
            };
        }

        // Update canonical concept map for duplicate detection
        const lowerCaseCanonicalName = canonicalName.toLowerCase();
        if (canonicalConceptMap.has(lowerCaseCanonicalName)) {
            canonicalConceptMap.get(lowerCaseCanonicalName).push({ chapter: normalizedChapter, canonicalName: canonicalName });
        } else {
            canonicalConceptMap.set(lowerCaseCanonicalName, [{ chapter: normalizedChapter, canonicalName: canonicalName }]);
        }
    }
}

// 4. Remove truly duplicate canonical concepts across *different* normalized chapters.
// This is tricky as the task says "Remove duplicate canonical concepts" but also "Do not change canonical names."
// If a canonical concept appears in two different *normalized* chapters, it's a duplicate and one should be removed.
// However, if the same canonical concept appears under the *same* normalized chapter, it means the chapters were merged.
// The goal is to have each unique canonical concept exist once within the entire ontology after normalization.

let finalClinicalOntology = {};
let seenCanonicalConcepts = new Set();

for (const normalizedChapter in newClinicalOntology) {
    finalClinicalOntology[normalizedChapter] = {};
    for (const canonicalName in newClinicalOntology[normalizedChapter]) {
        if (!seenCanonicalConcepts.has(canonicalName.toLowerCase())) {
            finalClinicalOntology[normalizedChapter][canonicalName] = newClinicalOntology[normalizedChapter][canonicalName];
            seenCanonicalConcepts.add(canonicalName.toLowerCase());
        }
    }
}

// 5. Update the original clinicalOntology with the refined one
clinicalOntology = finalClinicalOntology;

// 6. Save the refactored ontology (optional, for verification/debugging)
const refactoredOntologyFilePath = path.join(__dirname, 'clinicalOntologyData_refactored.json');
fs.writeFileSync(refactoredOntologyFilePath, JSON.stringify(clinicalOntology, null, 2), 'utf8');
console.log('Refactored ontology saved to clinicalOntologyData_refactored.json');

// Export the refactored ontology and original functions
module.exports = {
    clinicalOntology,
    consultOntology: require('./clinicalOntologyService').consultOntology,
    isStrictConstitutionalGeneral: require('./clinicalOntologyService').isStrictConstitutionalGeneral,
    constitutionalChapterMap: require('./clinicalOntologyService').constitutionalChapterMap,
    getConstitutionalCategory: require('./clinicalOntologyService').getConstitutionalCategory,
    getChapterForConstitutionalSymptom: require('./clinicalOntologyService').getChapterForConstitutionalSymptom,
    STRICT_PARTICULARS_LIST: require('./clinicalOntologyService').STRICT_PARTICULARS_LIST,
    isStrictParticular: require('./clinicalOntologyService').isStrictParticular
};
