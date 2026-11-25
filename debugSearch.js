// debugSearch.js

const fs = require('fs');
const path = require('path');
const { Index } = require('flexsearch');

// Mock global.masterRepertory and global.clinicalOntologyData
global.masterRepertory = [];
global.clinicalOntologyData = {};

// --- Simplified repertoryLoaderService.cjs logic ---
function loadMasterRepertorySimplified() {
    console.log("[DEBUG] Loading master repertory data...");
    const bbcrPath = path.join(__dirname, 'Backend', 'database', 'bbcr_master_db.json');
    const bogerPath = path.join(__dirname, 'Backend', 'database', 'boger_master_db.json');

    let bbcrData = [];
    let bogerData = [];

    if (fs.existsSync(bbcrPath)) {
        bbcrData = JSON.parse(fs.readFileSync(bbcrPath, 'utf8'));
        console.log(`[DEBUG] Loaded BBCR: ${bbcrData.length} entries.`);
    } else {
        console.error(`[ERROR] BBCR master DB not found at: ${bbcrPath}`);
    }

    if (fs.existsSync(bogerPath)) {
        bogerData = JSON.parse(fs.readFileSync(bogerPath, 'utf8'));
        console.log(`[DEBUG] Loaded Boger: ${bogerData.length} entries.`);
    } else {
        console.error(`[ERROR] Boger master DB not found at: ${bogerPath}`);
    }

    // Combine and assign unique IDs, and add searchableText
    let currentId = 0;
    const combinedRepertory = [];

    bbcrData.forEach(entry => {
        const id = `BBCR_${currentId++}`;
        const searchableText = `${entry.rubric || ''} ${entry.path || ''}`.toLowerCase();
        combinedRepertory.push({ ...entry, id, source: 'BBCR', searchableText });
    });

    bogerData.forEach(entry => {
        const id = `BOGER_${currentId++}`;
        const searchableText = `${entry.rubric || ''} ${entry.path || ''}`.toLowerCase();
        combinedRepertory.push({ ...entry, id, source: 'BOGER', searchableText });
    });

    global.masterRepertory = combinedRepertory;
    console.log(`[DEBUG] Combined Master Repertory loaded with ${global.masterRepertory.length} entries.`);
}







    // --- STAGE 7: Whether "Craving for sweets" entry is among FlexSearch candidate IDs ---
    const isCravingForSweetsInFlexSearchResults = cravingForSweetsId && flexSearchCandidateIds.includes(cravingForSweetsId);
    intermediateResults['isCravingForSweetsInFlexSearchResults'] = isCravingForSweetsInFlexSearchResults;
    console.log("
--- Stage 7: "Craving for sweets" among FlexSearch candidates? ---");
    console.log(isCravingForSweetsInFlexSearchResults ? "YES" : "NO");

    // Replicate searchRubricsWithChapterLock logic up to chapter filtering
    let initialRelevantRubrics = [];
    flexSearchCandidateIds.forEach(id => {
        const rubricEntry = global.masterRepertory.find(r => r.id === id);
        if (rubricEntry) {
            initialRelevantRubrics.push(rubricEntry);
        }
    });

    let rubricsAfterChapterFiltering = [];
    let chapterFilteredOutCount = 0;
    const currentChapterCandidates = chapterCandidates; // From inferClinicalMeaning

    // This section directly implements the chapter filtering logic from masterRubricSearchService.cjs
    if (currentChapterCandidates && Object.keys(currentChapterCandidates).length > 0) {
        for (const rubricEntry of initialRelevantRubrics) {
            const rubricChapterNormalized = masterRubricSearchService.normalizeChapterName(rubricEntry.chapter).toUpperCase();
            if (currentChapterCandidates[rubricChapterNormalized] && currentChapterCandidates[rubricChapterNormalized] > 0) { // Check for existence and positive weight
                rubricsAfterChapterFiltering.push(rubricEntry);
            } else {
                chapterFilteredOutCount++;
            }
        }
    } else {
        // If no chapter candidates, don't filter by chapter
        rubricsAfterChapterFiltering = initialRelevantRubrics;
        console.warn("[DEBUG] No chapter candidates from inferClinicalMeaning, skipping chapter filtering.");
    }
    intermediateResults['rubricsAfterChapterFiltering'] = rubricsAfterChapterFiltering;
    console.log("
--- Stage 8: Result after chapter filtering ---");
    console.log(`Rubrics after chapter filtering: ${rubricsAfterChapterFiltering.length} (Filtered out: ${chapterFilteredOutCount})`);
    console.log("First 5 rubrics after chapter filtering:", rubricsAfterChapterFiltering.slice(0, 5).map(r => ({ id: r.id, rubric: r.rubric, chapter: r.chapter })));

    // --- STAGE 9: result of _scoreRubricMatch for "Craving for sweets" ---
    let cravingForSweetsScore = null;
    if (cravingForSweetsId) {
        const cravingRubricEntry = rubricsAfterChapterFiltering.find(r => r.id === cravingForSweetsId);
        if (cravingRubricEntry) {
            // Need to call _scoreRubricMatch directly
            // masterRubricSearchService.cjs exports _scoreRubricMatch
            const scoreResult = masterRubricSearchService._scoreRubricMatch(
                cravingRubricEntry,
                searchTerms,
                canonicalSymptom,
                currentChapterCandidates // The original function takes chapterCandidates
            );
            cravingForSweetsScore = scoreResult;
            console.log("
--- Stage 9: _scoreRubricMatch for "Craving for sweets" ---");
            console.log(JSON.stringify(scoreResult, null, 2));
        } else {
            console.log("
--- Stage 9: "Craving for sweets" not found after chapter filtering, cannot score. ---");
        }
    } else {
        console.log("
--- Stage 9: "Craving for sweets" ID not found initially. Cannot score. ---");
    }
    intermediateResults['cravingForSweetsScore'] = cravingForSweetsScore;

async function runDebug() {
    console.log("--- Starting Debug Script ---");

    // 0. Load master repertory
    loadMasterRepertorySimplified();

    // Initialize RepertoryEngine (this will also ensure FlexSearch index is built)
    const repertoryEngineInstance = new RepertoryEngine();
    // Skipping repertoryEngineInstance.init() as its main effect for this flow is building FlexSearch index.
    // The masterRubricSearchService.getRubricSearchIndex() already handles this.

    const symptom = "Craving for sweets";
    let intermediateResults = {};

    console.log(`
Analyzing symptom: "${symptom}"`);

    // --- STAGE 1: inferClinicalMeaning() output ---
    const clinicalIntelligence = physicianThinkingService.inferClinicalMeaning(symptom);
    intermediateResults['clinicalIntelligence'] = clinicalIntelligence;
    console.log("
--- Stage 1: inferClinicalMeaning() output ---");
    console.log(JSON.stringify(clinicalIntelligence, null, 2));

    // --- STAGE 2: searchTerms ---
    const searchTerms = clinicalIntelligence.searchTerms;
    intermediateResults['searchTerms'] = searchTerms;
    console.log("
--- Stage 2: searchTerms ---");
    console.log(JSON.stringify(searchTerms, null, 2));

    // --- STAGE 3: canonicalSymptom ---
    const canonicalSymptom = clinicalIntelligence.canonicalSymptom;
    intermediateResults['canonicalSymptom'] = canonicalSymptom;
    console.log("
--- Stage 3: canonicalSymptom ---");
    console.log(canonicalSymptom);

    // --- STAGE 4: chapterCandidates / chapter information ---
    const chapterCandidates = clinicalIntelligence.chapterCandidates;
    intermediateResults['chapterCandidates'] = chapterCandidates;
    console.log("
--- Stage 4: chapterCandidates ---");
    console.log(JSON.stringify(chapterCandidates, null, 2));

    // Get the FlexSearch index
    const rubricSearchIndex = masterRubricSearchService.getRubricSearchIndex();

const symptom = { value: "milk", field: "aversions" };
    // Find the ID of "Craving for sweets" in masterRepertory
    const cravingForSweetsRubric = global.masterRepertory.find(r => r.rubric === "Craving for sweets");
    let cravingForSweetsId = null;
    if (cravingForSweetsRubric) {
        cravingForSweetsId = cravingForSweetsRubric.id;
        console.log(`
[DEBUG] Found "Craving for sweets" ID: ${cravingForSweetsId}`);
    } else {
        console.warn(`[DEBUG] "Craving for sweets" not found in global.masterRepertory.`);
    }

    let flexSearchCandidateIds = new Set(); // Use a Set to store unique IDs

    console.log("
--- Stage 5 & 6: Result of the actual FlexSearch query & number/IDs of candidates ---");
    try {
        // First, try direct search with canonical symptom
        const canonicalSearchTerm = clinicalIntelligence.canonicalSymptom;
        console.log(`Attempting FlexSearch for canonical symptom: "${canonicalSearchTerm}"`);
        const directFlexSearchResults = await withTimeout(
            Promise.resolve(rubricSearchIndex.search(canonicalSearchTerm, masterRubricSearchService.MAX_CANDIDATE_RUBRICS * 10)), // Get more candidates
            500,
            `FlexSearch for "${canonicalSearchTerm}" timed out`
        );
        directFlexSearchResults.forEach(id => flexSearchCandidateIds.add(id));
        console.log(`Direct FlexSearch for "${canonicalSearchTerm}" found ${directFlexSearchResults.length} candidates.`);

        // Also search for individual search terms as masterRubricSearchService does
        if (searchTerms && searchTerms.length > 0) {
             for (const term of searchTerms) {
                if (term.length > 2) { // FlexSearch often ignores very short terms
const symptom = { value: "milk", field: "aversions" };
// 
                    console.log(`Attempting FlexSearch for search term: "${term}"`);
                    const tokenFlexSearchResults = await withTimeout(
                        Promise.resolve(rubricSearchIndex.search(term, masterRubricSearchService.MAX_CANDIDATE_RUBRICS * 10)),
                        500,
                        `FlexSearch for token "${term}" timed out`
                    );
                    tokenFlexSearchResults.forEach(id => flexSearchCandidateIds.add(id));
                    console.log(`FlexSearch for term "${term}" found ${tokenFlexSearchResults.length} candidates.`);
                }
            }
        }

        flexSearchCandidateIds = Array.from(flexSearchCandidateIds); // Convert Set to Array
        console.log(`Total unique FlexSearch raw candidate IDs: ${flexSearchCandidateIds.length}`);
        intermediateResults['flexSearchCandidateIds'] = flexSearchCandidateIds;
        console.log("FlexSearch candidate IDs (first 20):", flexSearchCandidateIds.slice(0, 20));

    } catch (error) {
        console.error(`[ERROR] FlexSearch query failed: ${error.message}`);
    }


// --- Load clinicalAliases.json ---
const clinicalAliases = require(path.join(__dirname, 'Backend', 'database', 'clinicalAliases.json'));
console.log(`[DEBUG] Loaded clinicalAliases.json with ${Object.keys(clinicalAliases).length} entries.`);

// --- Mock interpreters for physicianThinkingService if they are problematic ---
// For 'Craving for sweets', CravingsInterpreter is relevant.
// I'll manually create a simple CravingsInterpreter mock.
const CravingsInterpreter = {
    interpret: (symptom) => {
        const lowerSymptom = symptom.toLowerCase();
        if (lowerSymptom.includes('craving') && lowerSymptom.includes('sweets')) {
            return {
                handled: true,
                interpreted: true,
                type: 'CRAVING',
                item: 'SWEETS',
                negativePolarity: false,
                primaryChapter: 'APPETITE',
                secondaryChapters: ['GENERALITIES'],
                confidence: 0.9,
                searchTerms: ['craving sweets', 'desire for sweets', 'sweets'],
                canonicalSymptom: 'Craving for sweets'
            };
        }
        return { handled: false };
    }
};

// Temporarily override required modules for the debug script
const physicianThinkingServiceModule = require('./Backend/services/physicianThinkingService.js');
const masterRubricSearchServiceModule = require('./Backend/services/masterRubricSearchService.cjs');
const RepertoryEngineModule = require('./Backend/services/RepertoryEngine.js');

// Override internal dependencies of physicianThinkingService
physicianThinkingServiceModule.clinicalSymptomNormalizer = {
    splitMultiSymptoms: (s) => [s] // Simplified for single symptom input
};
// Directly inject simplified ontology functions
Object.assign(physicianThinkingServiceModule, {
    consultOntology: consultOntologySimplified,
    normalizeChapterName: normalizeChapterNameSimplified,
    getClinicalField: getClinicalFieldSimplified,
    clinicalAliases: clinicalAliases, // Ensure aliases are available
    CravingsInterpreter: CravingsInterpreter // Inject the mock interpreter
    // Any other interpreters would need to be mocked here if they interfere
    // For this specific symptom, only CravingsInterpreter is critical initially
});

// Override internal dependencies of masterRubricSearchServiceModule
Object.assign(masterRubricSearchServiceModule, {
    isStrictConstitutionalGeneral: () => false,
    constitutionalChapterMap: {},
    getConstitutionalCategory: () => null,
    isStrictParticular: () => false,
    normalizeChapterName: normalizeChapterNameSimplified,
    clinicalAliases: clinicalAliases
});

// Ensure RepertoryEngine gets the overridden services
RepertoryEngineModule.physicianThinkingService = physicianThinkingServiceModule;
RepertoryEngineModule.masterRubricSearchService = masterRubricSearchServiceModule;

// Create instances of services
const physicianThinkingService = physicianThinkingServiceModule;
const masterRubricSearchService = masterRubricSearchServiceModule;
const RepertoryEngine = RepertoryEngineModule;

// Helper function from masterRubricSearchService.cjs to simulate timeout handling
const withTimeout = (promise, ms, timeoutMessage = 'Operation timed out') => {
    return Promise.race([
        promise,
        new Promise((resolve, reject) =>
            setTimeout(() => reject(new Error(timeoutMessage)), ms)
        )
    ]);
};
    // Simulate scoring and MAX_CANDIDATE_RUBRICS filtering
    let scoredRubrics = [];
    for (const rubricEntry of rubricsAfterChapterFiltering) {
        const scoreResult = masterRubricSearchService._scoreRubricMatch(
            rubricEntry,
            searchTerms,
            canonicalSymptom,
            currentChapterCandidates
        );
        if (scoreResult.score > 0) {
            scoredRubrics.push({ ...rubricEntry, score: scoreResult.score, matchType: scoreResult.matchType });
        }
    }
    scoredRubrics.sort((a, b) => b.score - a.score);

    // --- STAGE 10: Result after MAX_CANDIDATE_RUBRICS / subsequent filtering ---
    const rubricsAfterMaxCandidates = scoredRubrics.slice(0, masterRubricSearchService.MAX_CANDIDATE_RUBRICS);
    intermediateResults['rubricsAfterMaxCandidates'] = rubricsAfterMaxCandidates;
    console.log("
--- Stage 10: Result after MAX_CANDIDATE_RUBRICS filtering ---");
    console.log(`Rubrics after MAX_CANDIDATE_RUBRICS (${masterRubricSearchService.MAX_CANDIDATE_RUBRICS}): ${rubricsAfterMaxCandidates.length}`);
    console.log("First 5 rubrics after MAX_CANDIDATE_RUBRICS:", rubricsAfterMaxCandidates.slice(0, 5).map(r => ({ id: r.id, rubric: r.rubric, chapter: r.chapter, score: r.score })));
    const isCravingForSweetsAfterMaxCandidates = cravingForSweetsId && rubricsAfterMaxCandidates.some(r => r.id === cravingForSweetsId);
    console.log(`"Craving for sweets" among candidates after MAX_CANDIDATE_RUBRICS: ${isCravingForSweetsAfterMaxCandidates ? "YES" : "NO"}`);


    // --- STAGE 11: Final returned rubrics (from RepertoryEngine.findIntelligentRubrics) ---
    // The `findIntelligentRubrics` will call `masterRubricSearchService.searchRubricsWithChapterLock`
    // which returns the rubrics after all internal filtering and scoring, including MAX_CANDIDATE_RUBRICS.
    // So, 'rubricsAfterMaxCandidates' represents the direct output for now.
    const finalReturnedRubrics = rubricsAfterMaxCandidates;
    intermediateResults['finalReturnedRubrics'] = finalReturnedRubrics;
    console.log("
--- Stage 11: Final returned rubrics ---");
    console.log(`Final returned rubrics count: ${finalReturnedRubrics.length}`);
    console.log("Final returned rubrics (first 5):", finalReturnedRubrics.slice(0, 5).map(r => ({ id: r.id, rubric: r.rubric, chapter: r.chapter, score: r.score })));

    const isCravingForSweetsFinal = cravingForSweetsId && finalReturnedRubrics.some(r => r.id === cravingForSweetsId);
    console.log(`"Craving for sweets" in final returned rubrics: ${isCravingForSweetsFinal ? "YES" : "NO"}`);

    console.log("
--- Debug Script Finished ---");
}

runDebug().catch(console.error);

function withTimeout(promise, ms, timeoutMessage) {
    return Promise.race([
        promise,
        new Promise((resolve, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms))
    ]);
}
