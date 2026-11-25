
const posologyIntelligenceService = {
  analyzeCase: ({ caseClassification, constitutionalWeight, miasmaticAnalysis, vitality, pathologyLevel, patientAge, sensitivity, remedy, mentalGeneralsCount, physicalGeneralsCount }) => {
    let potency = "";
    let repetition = "";
    let doseAdvice = "";
    let confidence = 70; // Default confidence
    let explanation = "";
    let physicianAdvice = "";

    // Debugging information
    console.log("[POSOLOGY] Vitality:", vitality);
    console.log("[POSOLOGY] Sensitivity:", sensitivity);
    console.log("[POSOLOGY] Case Type:", caseClassification);

    // 1. Potency and Repetition Logic

    // Acute cases
    if (caseClassification === "Acute") {
      if (vitality === "Low") {
        potency = "30C";
        repetition = "Repeated";
        explanation += "Acute case with low vitality, suggesting 30C repeated. ";
      } else if (vitality === "High") {
        potency = "200C";
        repetition = "Repeated";
        explanation += "Acute case with high vitality, suggesting 200C repeated. ";
      }
    }

    // Chronic constitutional cases
    if (caseClassification === "Chronic constitutional") {
      if (mentalGeneralsCount > 0 && physicalGeneralsCount > 0 && vitality === "High") {
        potency = "200C"; // Default, could be 1M based on further refinement
        repetition = "Single dose";
        explanation += "Strong constitutional picture with prominent mental and physical generals and high vitality, suggesting a high potency single dose (200C). ";
        confidence += 5;
      }

      // Mental generals dominant: Increase potency recommendation
      if (mentalGeneralsCount > physicalGeneralsCount && potency === "200C") {
        potency = "1M";
        explanation += "Dominant mental generals further support a higher potency (1M). ";
        confidence += 5;
      }
    }

    // Pathological advanced disease
    if (pathologyLevel === "Irreversible") {
      potency = "30C";
      repetition = "Repeated cautiously";
      doseAdvice = "Administer cautiously, monitor closely for reactions.";
      explanation += "Advanced pathological disease necessitates a lower potency (30C) repeated cautiously. ";
      confidence += 5;
    }

    // Very sensitive patients
    if (sensitivity === "High") {
      potency = "6C"; // Start low potency
      repetition = "Repeated";
      explanation += "Very sensitive patient, starting with a low potency (6C). ";
      confidence += 10;
    }

    // Children
    if (patientAge < 12 && potency === "") { // If potency not already set by more specific rules
      potency = "30C";
      repetition = "Repeated";
      explanation += "For children, 30C is generally preferred. ";
    }

    // Elderly with low vitality
    if (patientAge >= 65 && vitality === "Low") {
      potency = "30C";
      repetition = "Infrequent";
      doseAdvice = "Administer infrequently, observe closely.";
      explanation += "Elderly patient with low vitality, suggesting 30C infrequently. ";
      confidence += 5;
    }

    // Default catch-all if no specific rules apply
    if (potency === "") {
        potency = "30C";
        repetition = "Repeated";
        explanation += "No specific rules applied, defaulting to 30C repeated. ";
    }

    // Refine repetition and dose advice
    if (repetition === "Single dose") {
        physicianAdvice = "Wait and observe before repetition.";
    } else if (repetition === "Repeated") {
        physicianAdvice = "Repeat as needed, observing patient's response.";
    } else if (repetition === "Repeated cautiously") {
        physicianAdvice = "Repeat cautiously, monitor closely for any aggravations or improvements.";
    } else if (repetition === "Infrequent") {
        physicianAdvice = "Administer infrequently, monitoring patient's vitality and response.";
    }


    // Final Debugging output
    console.log("[POSOLOGY] Recommended Potency:", potency);
    console.log("[POSOLOGY] Repetition:", repetition);

    return {
      potency,
      repetition,
      doseAdvice: doseAdvice || "As per standard homeopathic practice.",
      confidence: Math.min(confidence, 100), // Cap confidence at 100
      explanation: explanation.trim(),
      physicianAdvice,
    };
  },
};

module.exports = posologyIntelligenceService;
