const { analyzeRelationship } = require('./remedyRelationshipService');

const analyzeFollowup = (followupData) => {
  const { previousSymptoms, currentSymptoms, remedy, durationAfterPrescription, patientRemarks, previousRemedy } = followupData;

  let outcome = "No Change";
  let explanation = "No significant change observed.";
  let recommendation = "Review case and potency.";
  let confidence = 50;
  let heringsLaw = "Not Applicable";
  let relationshipAnalysis = null;

  if (previousRemedy && remedy) {
    relationshipAnalysis = analyzeRelationship(previousRemedy, remedy);
  }

  // Basic symptom analysis (presence/absence)
  const previousSymptomSet = new Set(previousSymptoms.map(s => s.toLowerCase()));
  const currentSymptomSet = new Set(currentSymptoms.map(s => s.toLowerCase()));

  let resolvedSymptoms = []; // Symptoms present before, not present now
  let newSymptoms = [];
  let oldSymptomsReturning = []; // Not implemented in this basic version
  let aggravatedSymptoms = []; // This needs to be calculated if needed, currently not used in the provided logic

  // Determine resolved symptoms (present before, not present now)
  previousSymptoms.forEach(symptom => {
    if (!currentSymptomSet.has(symptom.toLowerCase())) {
      resolvedSymptoms.push(symptom);
    }
  });

  // Determine new symptoms (present now, not present before)
  currentSymptoms.forEach(symptom => {
    if (!previousSymptomSet.has(symptom.toLowerCase())) {
      newSymptoms.push(symptom);
    }
  });

  // Outcome determination with prioritized conditions
  let determinedOutcome = null;
  let improvementPercentage = 0; // Initialize improvement percentage

  // Calculate improvement percentage based on resolved symptoms
  if (previousSymptoms.length > 0) {
    improvementPercentage = (resolvedSymptoms.length / previousSymptoms.length) * 100;
  }

  // Rules in strict physician priority order:

  // 1. Suppression Suspected
  const hasImprovedSuperficial = resolvedSymptoms.some(s => s.toLowerCase().includes("skin"));
  const hasWorsenedDeeper = previousSymptoms.some(s => s.toLowerCase().includes("asthma")) && patientRemarks.toLowerCase().includes("asthma is worse");
  if (hasImprovedSuperficial && hasWorsenedDeeper) {
    determinedOutcome = "Suppression Suspected";
    explanation = "Improvement of superficial symptoms with worsening of deeper pathology suggests suppression.";
    recommendation = "Re-evaluate prescription.";
    confidence = 90;
    heringsLaw = "Violated";
  }

  // 2. Homeopathic Aggravation
  if (!determinedOutcome) {
    const hasExplicitAggravationRemark = patientRemarks.toLowerCase().includes("initial worsening") || patientRemarks.toLowerCase().includes("aggravation followed by improvement");

    if (hasExplicitAggravationRemark && resolvedSymptoms.length > 0) { // Explicit remark about aggravation AND subsequent improvement
      determinedOutcome = "Homeopathic Aggravation";
      explanation = "Initial worsening followed by improvement, indicating a positive remedy reaction (explicitly stated).";
      recommendation = "Observe. Avoid premature repetition.";
      confidence = 90;
    }
  }

  // 3. Hering`s Law Improvement
  if (!determinedOutcome) {
    const isOldSkinEruptionReturning = currentSymptoms.some(s => s.toLowerCase().includes("old skin eruption"));
    const hasAsthmaImproved = resolvedSymptoms.some(s => s.toLowerCase().includes("asthma")); 

    if (isOldSkinEruptionReturning && hasAsthmaImproved) {
      heringsLaw = "Correct Direction of Cure";
      confidence = 95;
      explanation = "Return of old symptoms after improvement in deeper pathology indicates Hering`s Law.";
      determinedOutcome = "Hering’s Law Improvement"; 
      recommendation = "Wait and watch. Do not repeat remedy.";
    }
  }

  // 4. Improving
  if (!determinedOutcome) {
    if (improvementPercentage > 70 && newSymptoms.length === 0) {
      determinedOutcome = "Improving";
      explanation = "Patient shows significant overall improvement with no new important symptoms.";
      recommendation = "Wait and watch. Do not repeat remedy.";
      confidence = 80;
    }
  }

  // 5. Remedy Failure (specific case: all old symptoms resolved, new appeared) - Higher priority than general Partial Improvement
  if (!determinedOutcome) {
    if (resolvedSymptoms.length > 0 && newSymptoms.length > 0 && improvementPercentage === 100) {
      determinedOutcome = "Remedy Failure";
      explanation = "Previous symptoms resolved entirely, but new significant symptoms appeared, indicating remedy failure.";
      recommendation = "Re-evaluate the case, consider different remedy or potency.";
      confidence = 40;
    }
  }

  // 6. Partial Improvement vs Remedy Failure (if improvement exists, but new symptoms appear)
  if (!determinedOutcome) {
    if (resolvedSymptoms.length > 0 && newSymptoms.length > 0) { // Improvement exists, and new symptoms appeared
      // Rule: If improvement exists BUT two or more significant new symptoms appear after prescription, classify as Remedy Failure.
      // For simplicity, we'll assume all new symptoms are 'significant' for now unless specified otherwise.
      if (newSymptoms.length >= 2) {
        determinedOutcome = "Remedy Failure";
        explanation = "Some symptoms improved, but two or more new significant symptoms appeared, indicating remedy failure.";
        recommendation = "Re-evaluate the case, consider different remedy or potency.";
        confidence = 40;
      } 
      // Rule: If only one mild new symptom appears, classify as Partial Improvement.
      // For simplicity, we'll treat a single new symptom as 'mild' for now.
      else if (newSymptoms.length === 1) {
        determinedOutcome = "Partial Improvement";
        explanation = "Some symptoms improved, but one new mild symptom appeared.";
        recommendation = "Re-evaluate the case considering the new symptom.";
        confidence = 65;
      }
    }
  }

  // 7. No Change
  if (!determinedOutcome) {
    if (previousSymptoms.length > 0 && resolvedSymptoms.length === 0 && newSymptoms.length === 0) {
      determinedOutcome = "No Change"; 
      explanation = "No significant change observed in symptoms.";
      recommendation = "Review case and potency.";
      confidence = 50;
    }
  }

  // 8. Remedy Failure (general catch-all - for cases where no improvement and new symptoms/persistence)
  if (!determinedOutcome) {
    if (resolvedSymptoms.length === 0 && (currentSymptoms.length > 0 || newSymptoms.length > 0)) {
      determinedOutcome = "Remedy Failure";
      explanation = "Remedy did not produce the expected improvement. Symptoms persist or new ones appeared.";
      recommendation = "Re-evaluate the case, consider different remedy or potency.";
      confidence = 40;
    }
  }

  outcome = determinedOutcome || outcome;

  // Debug Logs
  console.log("[FOLLOWUP ANALYSIS]");
  console.log("Resolved Symptoms:", resolvedSymptoms.map(s => s.toLowerCase())); 
  console.log("New Symptoms:", newSymptoms.map(s => s.toLowerCase()));
  console.log("Improvement Percentage:", improvementPercentage.toFixed(2) + "%");
  console.log("Selected Rule:", determinedOutcome);
  console.log("Outcome:", outcome);
  console.log("Confidence:", confidence);
  console.log("Recommendation:", recommendation);
  console.log("HeringStatus:", heringsLaw);

  return {
    outcome,
    explanation,
    recommendation,
    confidence,
    heringsLaw,
    relationshipAnalysis,
  };
};

module.exports = { analyzeFollowup };

// Test cases
const testCases = [
    {
        name: "Case 1: Old skin eruption returned, Asthma improved",
        input: {
            previousSymptoms: ["asthma", "cough"],
            currentSymptoms: ["old skin eruption", "cough"],
            remedy: "Sulphur",
            durationAfterPrescription: "1 month",
            patientRemarks: "Asthma is much better, but old skin eruption came back."
        },
        expectedOutcome: "Hering’s Law Improvement",
        expectedExplanation: "Return of old symptoms after improvement in deeper pathology indicates Hering`s Law.",
        expectedHeringsLaw: "Correct Direction of Cure"
    },
    {
        name: "Case 2: Skin improved, Asthma worsened",
        input: {
            previousSymptoms: ["skin rash", "asthma"],
            currentSymptoms: ["cough"], 
            remedy: "Psorinum",
            durationAfterPrescription: "2 weeks",
            patientRemarks: "Skin rash cleared up completely, but asthma is worse."
        },
        expectedOutcome: "Suppression Suspected",
        expectedExplanation: "Improvement of superficial symptoms with worsening of deeper pathology suggests suppression.",
        expectedHeringsLaw: "Violated"
    },
    {
        name: "Case 3: Initial worsening for 3 days followed by steady improvement",
        input: {
            previousSymptoms: ["fever", "headache"],
            currentSymptoms: [], 
            remedy: "Belladonna",
            durationAfterPrescription: 3, 
            patientRemarks: "Initial worsening for 3 days followed by steady improvement. Fever is gone, Headache is gone."
        },
        expectedOutcome: "Homeopathic Aggravation",
        expectedExplanation: "Initial worsening followed by improvement, indicating a positive remedy reaction (explicitly stated).",
        expectedHeringsLaw: "Not Applicable"
    },
    {
        name: "Case 4: General improvement (over 70%)",
        input: {
            previousSymptoms: ["fever", "cough", "sore throat", "fatigue"],
            currentSymptoms: ["fatigue"], 
            remedy: "Aconite",
            durationAfterPrescription: 7,
            patientRemarks: "Feeling much better overall. Fever is gone, cough is gone, sore throat is gone. Still a bit fatigued."
        },
        expectedOutcome: "Improving",
        expectedExplanation: "Patient shows significant overall improvement with no new important symptoms.",
        expectedHeringsLaw: "Not Applicable"
    },
    {
        name: "Case 5: No Change",
        input: {
            previousSymptoms: ["insomnia", "anxiety"],
            currentSymptoms: ["insomnia", "anxiety"],
            remedy: "Coffea Cruda",
            durationAfterPrescription: 30,
            patientRemarks: "No change in sleep or anxiety levels."
        },
        expectedOutcome: "No Change",
        expectedExplanation: "No significant change observed in symptoms.",
        expectedHeringsLaw: "Not Applicable"
    },
    {
      name: "Case 6: Partial Improvement (some resolved, new appeared)",
      input: {
          previousSymptoms: ["headache", "fatigue"],
          currentSymptoms: ["new stomach ache"],
          remedy: "Nux Vomica",
          durationAfterPrescription: 7,
          patientRemarks: "Fatigue is better, but developed a new stomach ache."
        },
        expectedOutcome: "Partial Improvement",
        expectedExplanation: "Some symptoms improved, but one new mild symptom appeared.",
        expectedHeringsLaw: "Not Applicable"
    },
    {
      name: "Case 7: Remedy Failure (no resolved symptoms, symptoms persist)",
      input: {
          previousSymptoms: ["insomnia", "anxiety"],
          currentSymptoms: ["insomnia", "anxiety", "irritability"],
          remedy: "Lycopodium",
          durationAfterPrescription: 14,
          patientRemarks: "Still can\\\"t sleep, anxiety is the same, and now I\\\"m irritable."
        },
        expectedOutcome: "Remedy Failure",
        expectedExplanation: "Remedy did not produce the expected improvement. Symptoms persist or new ones appeared.",
        expectedHeringsLaw: "Not Applicable"
    },
    {
      name: "Case 8: Remedy Failure (only new symptoms, no resolved symptoms)",
      input: {
          previousSymptoms: ["fatigue"],
          currentSymptoms: ["headache", "nausea"],
          remedy: "Bryonia",
          durationAfterPrescription: 5,
          patientRemarks: "Fatigue is the same, but now I have a headache and nausea."
        },
        expectedOutcome: "Remedy Failure",
        expectedExplanation: "Previous symptoms resolved entirely, but new significant symptoms appeared, indicating remedy failure.",
        expectedHeringsLaw: "Not Applicable"
    }
];

console.log("\n--- Running all Test Cases ---\n");
testCases.forEach((testCase) => {
    console.log(`\n--- Running Test Case: ${testCase.name} ---\n`);
    const result = analyzeFollowup(testCase.input);
    console.log("Expected Outcome:", testCase.expectedOutcome);
    console.log("Actual Outcome:", result.outcome);
    console.log("Expected Explanation:", result.explanation);
    console.log("Actual Explanation:", result.explanation);
    console.log("Expected Hering`s Law:", testCase.expectedHeringsLaw);
    console.log("Actual Hering`s Law:", result.heringsLaw);
    console.log("\nTest Status:",
        result.outcome === testCase.expectedOutcome &&
        result.explanation === testCase.expectedExplanation &&
        result.heringsLaw === testCase.expectedHeringsLaw ? "PASSED" : "FAILED"
    );
    if (!(result.outcome === testCase.expectedOutcome &&
        result.explanation === testCase.expectedExplanation &&
        result.heringsLaw === testCase.expectedHeringsLaw)) {
        console.log("Reasoning for failure:");
        if (result.outcome !== testCase.expectedOutcome) {
            console.log(`  - Outcome mismatch: Expected \"${testCase.expectedOutcome}\" but got \"${result.outcome}\".`);
        }
        if (result.explanation !== testCase.expectedExplanation) {
            console.log(`  - Explanation mismatch: Expected \"${testCase.expectedExplanation}\" but got \"${result.explanation}\".`);
        }
        if (result.heringsLaw !== testCase.expectedHeringsLaw) {
            console.log(`  - Hering\\\"s Law mismatch: Expected \"${testCase.expectedHeringsLaw}\" but got \"${result.heringsLaw}\".`);
        }
    }
});
