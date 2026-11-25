
// testTotalityRunner.js

const physicianThinkingService = require("../services/physicianThinkingService");
const { searchRubricsWithChapterLock } = require("../services/masterRubricSearchService.cjs");
const { loadMasterRepertory } = require("../services/repertoryLoaderService.cjs");
const RemedyScoringService = require("../services/remedyScoringService");
const cacheService = require("../services/cacheService"); // Import cacheService

// Temporarily override console.log to suppress verbose debug outputs from services
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Suppress logs unless they start with our custom markers (e.g., [Evaluating Symptom])
   if (args[0] && typeof args[0] === 'string' && (args[0].startsWith('\n---') || args[0].startsWith('[Evaluating Symptom]') || args[0].startsWith('  Interpretation:') || args[0].startsWith('  Found ') || args[0].startsWith('[TEMP_LOG]'))) {
  if (args[0] && typeof args[0] === 'string' && (args[0].startsWith('\n---') || args[0].startsWith('[Evaluating Symptom]') || args[0].startsWith('  Interpretation:') || args[0].startsWith('  Found '))) {
    originalConsoleLog(...args);
  }
};

function getTopRemedies(remedyResults, count) {
    if (!remedyResults || !remedyResults.remedies) {
        return [];
    }
    // Sort remedies by their finalScore in descending order
    const sortedRemedies = remedyResults.remedies.sort((a, b) => b.finalScore - a.finalScore);
    // Return the top 'count' remedies, mapping to a simpler format
    return sortedRemedies.slice(0, count).map(r => ({ name: r.name, score: r.finalScore }));
}

async function evaluateSymptoms(symptomInputs) {
  const allCandidateRubrics = [];
  const allSymptomChapterCandidates = [];

  for (const symptom of symptomInputs) {
    originalConsoleLog(`\n[Evaluating Symptom]: "${symptom}"`);
    // 1. Infer clinical meaning and get chapter candidates/search terms
    const interpretation = physicianThinkingService.inferClinicalMeaning(symptom);
    originalConsoleLog(`  Interpretation: ${JSON.stringify({ canonicalSymptom: interpretation.canonicalSymptom, chapterCandidates: interpretation.chapterCandidates, confidence: interpretation.confidence })}`);
    
    allSymptomChapterCandidates.push({ symptom, chapterCandidates: interpretation.chapterCandidates });

    // 2. Search for rubrics with chapter lock logic
    const { rubrics: candidateRubrics } = await searchRubricsWithChapterLock(
      interpretation.searchTerms,
      interpretation.chapterCandidates,
      interpretation.canonicalSymptom
    );
    originalConsoleLog(`  Found ${candidateRubrics.length} candidate rubrics for "${symptom}"`);
    allCandidateRubrics.push(...candidateRubrics);
  }

  // 3. Aggregate remedy scores using RemedyScoringService
  const remedyResults = RemedyScoringService.calculate(allCandidateRubrics);
  const topRemedies = getTopRemedies(remedyResults, 5);

  return { allSymptomChapterCandidates, topRemedies };
}

async function runTotalityEvaluation() {
  try {
    originalConsoleLog("\n--- Initializing Master Repertory ---");
    await loadMasterRepertory();
    originalConsoleLog("--- Master Repertory Loaded ---");


    // Test Case: Multi-symptom accumulation bug fix and caching
    originalConsoleLog("\n--- Multi-Symptom Accumulation Test ---");
    const testInputString = 'Aversions -> milk';
    const symptomInputs = testInputString.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    originalConsoleLog(`Input Symptoms: ${JSON.stringify(symptomInputs)}`);
    originalConsoleLog(`Number of distinct symptoms: ${symptomInputs.length}`);

    // Generate a consistent cache key for this set of symptoms and thermal (none in this case)
    const cacheKeySymptoms = symptomInputs.sort();
    const cacheKey = JSON.stringify({ symptoms: cacheKeySymptoms, thermal: undefined });

    let cachedResult = cacheService.get(cacheKeySymptoms, undefined); // Try to get from cache
    let allCandidateRubrics = [];
    let topRemedies = [];
    let uniqueRubrics = [];

    if (cachedResult) {
        originalConsoleLog("\n--- Cache Hit for Multi-Symptom Test ---");
        uniqueRubrics = cachedResult.matrixData; // Assuming matrixData contains the rubrics
        topRemedies = cachedResult.topRemedies; // Assuming topRemedies are directly in the cached result
        originalConsoleLog("Using cached results.");
    } else {
        originalConsoleLog("\n--- Cache Miss: Calculating Results for Multi-Symptom Test ---");
        for (const symptom of symptomInputs) {
            originalConsoleLog(`\n[Evaluating Symptom]: "${symptom}"`);
            const interpretation = physicianThinkingService.inferClinicalMeaning(symptom);
            originalConsoleLog(`  Interpretation: ${JSON.stringify({ canonicalSymptom: interpretation.canonicalSymptom, chapterCandidates: interpretation.chapterCandidates, confidence: interpretation.confidence })}`);
            
            const { rubrics: candidateRubrics } = await searchRubricsWithChapterLock(
                interpretation.searchTerms,
                interpretation.chapterCandidates,
                interpretation.canonicalSymptom
            );
            originalConsoleLog(`  Found ${candidateRubrics.length} candidate rubrics for "${symptom}"`);
            allCandidateRubrics.push(...candidateRubrics);
        }

        // Deduplicate accumulated rubrics to get the final list for scoring
        const seenRubricIds = new Set();
        allCandidateRubrics.forEach(rubric => {
            if (!seenRubricIds.has(rubric.id)) {
                uniqueRubrics.push(rubric);
                seenRubricIds.add(rubric.id);
            }
        });
        originalConsoleLog(`\nTotal unique rubrics accumulated: ${uniqueRubrics.length}`);

        const remedyResults = RemedyScoringService.calculate(uniqueRubrics);
        topRemedies = getTopRemedies(remedyResults, 5);

        // Save results to cache
        cacheService.set(cacheKeySymptoms, undefined, { matrixData: uniqueRubrics, topRemedies });
        originalConsoleLog("Results saved to cache.");
    }

    originalConsoleLog("\n--- Final Totality Analysis Results (from cache or calculation) ---");
    originalConsoleLog("Top 5 Remedies:", topRemedies);

    // Verification Step 1: Check for rubrics from specific chapters
    const chaptersPresent = uniqueRubrics.map(r => r.chapter.toUpperCase());
    const mindPresent = chaptersPresent.some(c => c.includes("MIND"));
    const femalePresent = chaptersPresent.some(c => c.includes("FEMALE"));
    const headPresent = chaptersPresent.some(c => c.includes("HEAD"));

    originalConsoleLog(`Rubrics from MIND chapter present: ${mindPresent}`);
    originalConsoleLog(`Rubrics from FEMALE chapter present: ${femalePresent}`);
    originalConsoleLog(`Rubrics from HEAD chapter present: ${headPresent}`);

    if (mindPresent && femalePresent && headPresent) {
      originalConsoleLog("Verification PASSED: Rubrics from MIND, FEMALE, and HEAD are ALL present.");
    } else {
      originalConsoleLog("Verification FAILED: One or more expected chapters (MIND, FEMALE, HEAD) not sufficiently covered.");
    }

    // Verification Step 2: Check cache file directly
    const fs = require("fs"); // Need fs here for direct file read
    const path = require("path"); // Need path here for direct file path
    const cacheData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/repertory_query_cache.json"), "utf8"));
    
    const cacheEntry = cacheData[cacheKey];

    if (cacheEntry) {
      originalConsoleLog("Verification PASSED: Results found in repertory_query_cache.json.");
    } else {
      originalConsoleLog("Verification FAILED: Results NOT found in repertory_query_cache.json.");
      originalConsoleLog("Expected cache key:", cacheKey);
      originalConsoleLog("Actual cache keys:", Object.keys(cacheData));
    }

  } catch (error) {
    originalConsoleLog.error("Test execution failed:", error);
  } finally {
    console.log = originalConsoleLog; // Ensure console.log is restored for final exit message
    originalConsoleLog("Test run complete. Exiting gracefully.");
    process.exit(0); // Graceful exit
  }
}

runTotalityEvaluation();
