const { getThermalClassification } = require('./ThermalLookupService');
const { resolveCanonicalRemedyName } = require('./repertoryLoaderService.cjs');
const remedyScoringService = {
  calculate(selectedRubrics, weights = {}) { console.log("[THERMAL VALUE]", JSON.stringify({ thermalGenerals: weights.thermalGenerals, thermal: weights.thermal }));
    console.log("Selected Rubrics:", selectedRubrics);

    const remedyMap = new Map();

    for (const rubric of selectedRubrics) {
      const remedies = rubric.remedies || [];

        remedies.forEach(remedy => {
        const rawRemedyName = remedy.canonical || remedy.name;
const canonicalRemedyName =
  resolveCanonicalRemedyName(rawRemedyName) || rawRemedyName.toUpperCase();
          if (!remedyMap.has(canonicalRemedyName)) {
            remedyMap.set(canonicalRemedyName, {
              name: remedy.name, // Preserve original casing for display if needed, but use canonical for keying
              canonicalName: canonicalRemedyName,
              score: 0,
              finalScore: 0,
              rawTotalityScore: 0, // NEW: For classical repertory display
              totalGrade: 0, // New: Sum of actual rubric grades
              rubricsCovered: 0, // New: Number of rubrics with grade > 0
              matchedRubrics: []
          });
        }

        const entry = remedyMap.get(canonicalRemedyName);

        // The rubric.grade here is the original grade from the master repertory.
        // In RepertoryEngine, this rubric.grade may have already been scaled by constitutionalWeight.
        // The `remedy.grade` here refers to the grade of the remedy within the specific rubric (e.g., 1, 2, 3).
        // The `rubric.grade` that comes from `selectedRubrics` (from RepertoryEngine) *already* has constitutional weighting applied.
        // So, to get the raw rubric grade for classical totality, we use `remedy.grade` (the original one from master repertory)
        
        // Add to raw totality score (for classical matrix display)
        entry.rawTotalityScore += (remedy.grade || 1);

        // Calculate totalGrade and rubricsCovered for classical ranking
        entry.totalGrade += (remedy.grade || 0);
        if ((remedy.grade || 0) > 0) {
          entry.rubricsCovered++;
        }

        const rubricPriorityWeight = rubric.priority_weight || 1;
        // `rubric.constitutionalWeight` is from RepertoryEngine and applies to the overall rubric, not just this remedy's grade
        const constitutionalWeightedRemedyGrade = (remedy.normalizedGrade || 1) * (rubric.constitutionalWeight || 1) * rubricPriorityWeight;
        
        entry.score += constitutionalWeightedRemedyGrade; // entry.score accumulates the weighted grades for AI ranking
        entry.finalScore = entry.score; // temporary assignment, will be updated after bonuses

        // Store the constitutionalWeight and effective grade for debugging/matrix display if needed
        remedy.constitutionalWeight = rubric.constitutionalWeight || 1; // Add this to the individual remedy object
        remedy.effectiveGrade = constitutionalWeightedRemedyGrade; // Add this to the individual remedy object

        entry.matchedRubrics.push({
          id: rubric.id,
          rubric:
            rubric.rubric ||
            rubric.target ||
            rubric.name,
          grade: remedy.grade || rubric.grade || 1,
          effectiveGrade: constitutionalWeightedRemedyGrade // Store for potential display in matrix
        });
      });
    }

    // Calculate bonuses and apply them
    const totalRubricsSelected = selectedRubrics.length;

    // Collect all unique rubrics with their remedies for rarity calculation
    const allRubricRemedyCounts = {};
    selectedRubrics.forEach(rubric => {
        allRubricRemedyCounts[rubric.id] = rubric.remedies ? rubric.remedies.length : 0;
    });

    const RARE_RUBRIC_THRESHOLD = 5; // Example: Rubrics with 5 or fewer remedies are considered rare

    console.log("[REMEDY MAP]", remedyMap.size, Array.from(remedyMap.keys())); for (const [remedyName, entry] of remedyMap.entries()) {
        let totalWeightedScore = 0; // This will accumulate the weighted grades for this remedy
        let mentalGeneralCount = 0;
        let generalSymptomCount = 0;
        let rareRubricCount = 0;

        // Re-calculate coverage count based on matchedRubrics.length after all processing
        const coverageCount = entry.matchedRubrics.length;

        entry.matchedRubrics.forEach(matchedRubric => {
            totalWeightedScore += matchedRubric.effectiveGrade; 

            // Access original rubric data for classification
            const originalRubric = selectedRubrics.find(r => r.id === matchedRubric.id); // Find the full rubric object

            if (originalRubric) {
                if (originalRubric.constitutionalInfo?.category === "Mental Generals") {
                    mentalGeneralCount++;
                } else if (originalRubric.constitutionalInfo?.category === "Physical Generals") { 
                    generalSymptomCount++;
                }
                if (allRubricRemedyCounts[originalRubric.id] <= RARE_RUBRIC_THRESHOLD) {
                    rareRubricCount++;
                }
            }
        });

        // The entry.score accumulated above already represents the sum of constitutional and priority weighted grades
        // Reassign it here to make it clear that it's the base for bonuses
        entry.score = totalWeightedScore;

        // --- Apply Bonuses --- 
        // Note: Bonus values are illustrative and can be tuned
        const COVERAGE_BONUS_FACTOR = 0.05; // 5% of base score per covered rubric
        const MENTAL_GENERAL_BONUS_PER_RUBRIC = 50; 
        const GENERAL_SYMPTOM_BONUS_PER_RUBRIC = 20; 
        const RARE_RUBRIC_BONUS_PER_RUBRIC = 40; 

        let bonuses = 0;

        // Coverage Bonus: A percentage of the base score for each rubric covered.
        bonuses += entry.score * COVERAGE_BONUS_FACTOR * coverageCount;

        // Mental General Bonus
        bonuses += mentalGeneralCount * MENTAL_GENERAL_BONUS_PER_RUBRIC;

        // General Symptom Bonus
        bonuses += generalSymptomCount * GENERAL_SYMPTOM_BONUS_PER_RUBRIC;

        // Rare Rubric Bonus
        bonuses += rareRubricCount * RARE_RUBRIC_BONUS_PER_RUBRIC;

        // --- Thermal Alignment Bonus ---
        const patientThermal = weights.thermalGenerals || weights.thermal;
        if (patientThermal) {
            console.log("[THERMAL LOOP]", remedyName); const thermalResult = getThermalClassification(remedyName, patientThermal); if (String(remedyName).toUpperCase().includes("PULSATILLA")) { console.log("[THERMAL DEBUG]", { remedyName, patientThermal, thermalResult }); }
            if (thermalResult?.patientAlignment === "MATCH") {
                const thermalPoints = String(patientThermal).toUpperCase() === "HOT"
                    ? (weights.HOT_BONUS_POINTS || 0)
                    : (weights.CHILLY_BONUS_POINTS || 0);

                bonuses += thermalPoints * (weights.THERMAL_BONUS_WEIGHT || 1);
            }
        }

        entry.finalScore = entry.score + bonuses;
        // console.log(`Remedy ${remedyName}: Base Score=${entry.score.toFixed(2)}, Bonuses=${bonuses.toFixed(2)} (Coverage=${coverageCount}, MentalGeneral=${mentalGeneralCount}, GeneralSymptom=${generalSymptomCount}, Rare=${rareRubricCount}), Final Score=${entry.finalScore.toFixed(2)}`);
    }

    // Get all remedies, sorted classically. This will be used for the matrix.
    const classicalRankedRemedies = Array.from(remedyMap.values()).sort((a, b) => {
        if (b.totalGrade !== a.totalGrade) {
            return b.totalGrade - a.totalGrade;
        }
        if (b.rubricsCovered !== a.rubricsCovered) {
            return b.rubricsCovered - a.rubricsCovered;
        }
        return a.canonicalName.localeCompare(b.canonicalName);
    }).map((remedy, index) => { // Add rank and coveragePercentage to all classical remedies
        const coveragePercentage = (remedy.rubricsCovered / totalRubricsSelected) * 100;
        return {
            rank: index + 1,
            name: remedy.name,
            totalGrade: remedy.totalGrade,
            rubricsCovered: remedy.rubricsCovered,
            coveragePercentage: parseFloat(coveragePercentage.toFixed(2))
        };
    });

    // Select only the first 5 remedies for the Top 5 panel (from the already ranked list)
    const top5ClassicalRemediesForPanel = classicalRankedRemedies.slice(0, 5);

    console.log("Full Classical Ranked Remedies (for matrix, up to 30):");
    console.log(classicalRankedRemedies.slice(0,30));
    console.log("Top 5 Classical Remedies (for panel):");
    console.log(top5ClassicalRemediesForPanel);

    // The existing bonus calculations for 'finalScore' for all remedies
    // should remain for other parts of the application that use AI/bonuses.
    // After this block, the 'remedyMap' still contains all remedies with their 'score' and 'finalScore' updated.

    const remedies = Array.from(remedyMap.values()).sort((a, b) => b.finalScore - a.finalScore);

    console.log("Calculated Remedies (with AI bonuses and full list):");
    console.log(remedies.slice(0,10));
return {
      remedies: remedies, // Full list of remedies with AI bonuses (for other uses if any)
      classicalRankedRemedies: classicalRankedRemedies.slice(0, 30), // Top 30 for the matrix
      top5ClassicalRemediesForPanel: top5ClassicalRemediesForPanel, // Top 5 for the panel
      metadata: {
        totalRubrics: selectedRubrics.length
      }
    };
  }
};

module.exports = remedyScoringService;

















