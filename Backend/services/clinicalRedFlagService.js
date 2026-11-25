const clinicalRedFlagService = {
  analyze: (input) => {
    const {
      symptoms,
      age,
      history,
      remarks
    } = input;

    let emergency = false;
    let severity = "Low";
    let category = "No Red Flags";
    let matchedRedFlags = [];
    let recommendation = "Continue with homeopathy treatment.";
    let physicianComment = "";

    // Helper function to update red flag status
    const updateRedFlag = (isEmergency, newSeverity, newCategory, flags) => {
      if (isEmergency) emergency = true;
      const severityOrder = { "Low": 0, "Moderate": 1, "High": 2, "Critical": 3 };
      if (severityOrder[newSeverity] > severityOrder[severity]) {
        severity = newSeverity;
      }
      // Ensure category is a unique set of matched categories
      const currentCategories = category.split(', ').filter(c => c !== "No Red Flags");
      if (!currentCategories.includes(newCategory)) {
        currentCategories.push(newCategory);
      }
      category = currentCategories.length > 0 ? currentCategories.join(', ') : "No Red Flags";

      matchedRedFlags.push(...(Array.isArray(flags) ? flags : [flags]));
      matchedRedFlags = [...new Set(matchedRedFlags)]; // Ensure unique flags
    };

    // Red Flag Detection Logic

    // 1. Cardiac emergencies
    if (symptoms.includes("chest pain") && symptoms.includes("radiating pain") && symptoms.includes("sweating")) {
      updateRedFlag(true, "Critical", "Cardiac Emergency", "Cardiac Emergency (Chest Pain, Radiating Pain, Sweating)");
    }

    // 2. Stroke symptoms
    if (symptoms.includes("sudden weakness") && symptoms.includes("facial deviation") && symptoms.includes("slurred speech")) {
      updateRedFlag(true, "Critical", "Stroke", "Stroke Symptoms (Sudden Weakness, Facial Deviation, Slurred Speech)");
    }

    // 3. Severe dehydration
    if (symptoms.includes("severe thirst") && symptoms.includes("dry mouth") && symptoms.includes("reduced urination") && (history.includes("vomiting") || history.includes("diarrhea"))) {
      updateRedFlag(true, "High", "Severe Dehydration", "Severe Dehydration");
    }

    // 4. Acute abdomen
    if (symptoms.includes("severe abdominal pain") && (symptoms.includes("rebound tenderness") || symptoms.includes("guarding"))) {
      updateRedFlag(true, "Critical", "Acute Abdomen", "Acute Abdomen (Severe Abdominal Pain, Rebound Tenderness/Guarding)");
    }

    // 5. Sepsis
    if (symptoms.includes("fever") && symptoms.includes("chills") && symptoms.includes("confusion") && (symptoms.includes("rapid heart rate") || symptoms.includes("rapid breathing"))) {
      updateRedFlag(true, "Critical", "Sepsis", "Sepsis (Fever, Chills, Confusion, Rapid Heart Rate/Breathing)");
    }

    // 6. Suicidal ideation
    const suicidalRedFlagsList = [
      "hopelessness",
      "suicidal thoughts",
      "self harm",
    ];
    const matchedSuicidalFlags = symptoms.filter(symptom => suicidalRedFlagsList.includes(symptom));
    if (matchedSuicidalFlags.length > 0) {
      updateRedFlag(true, "Critical", "Suicidal Ideation", matchedSuicidalFlags.map(flag => `Suicidal Ideation (${flag})`));
      recommendation = "Immediate psychiatric evaluation and conventional medical attention required for suicidal ideation."; // Override recommendation for critical case
    }

    // 7. Cancer red flags
    const cancerRedFlagsList = [
      "unexplained weight loss",
      "night sweats",
      "unexplained bleeding",
      "persistent lump",
    ];
    const matchedCancerFlags = symptoms.filter(symptom => cancerRedFlagsList.includes(symptom));
    if (matchedCancerFlags.length > 0) {
      updateRedFlag(true, "High", "Cancer Red Flags", matchedCancerFlags.map(flag => `Cancer Red Flag (${flag})`));
      if (severity !== "Critical") { // Don't override critical recommendations
        recommendation = "Immediate conventional medical evaluation for cancer red flags.";
      }
    }

    // 8. Severe respiratory distress
    if (symptoms.includes("severe shortness of breath") && (symptoms.includes("wheezing") || symptoms.includes("gasping for air"))) {
      updateRedFlag(true, "Critical", "Severe Respiratory Distress", "Severe Respiratory Distress (Shortness of Breath, Wheezing/Gasping)");
    }

    // 9. Pregnancy emergencies
    // Assuming 'history' or 'remarks' might indicate pregnancy
    const isPregnant = history.includes("pregnant") || remarks.includes("pregnant");
    if (isPregnant && (symptoms.includes("severe vaginal bleeding") || symptoms.includes("severe abdominal pain during pregnancy") || symptoms.includes("sudden swelling of face/hands"))) {
      updateRedFlag(true, "Critical", "Pregnancy Emergency", "Pregnancy Emergency");
    }

    // 10. Pediatric emergencies
    // Assuming 'age' can be used for pediatric cases (e.g., age < 12)
    if (age < 12 && (symptoms.includes("unusual lethargy") || symptoms.includes("difficulty breathing") || symptoms.includes("non-blanching rash"))) {
      updateRedFlag(true, "Critical", "Pediatric Emergency", "Pediatric Emergency");
    }

    // Final recommendation based on highest severity if not already critical
    if (!emergency) {
      recommendation = "Continue with homeopathy treatment.";
    } else if (severity === "Critical" && !recommendation.includes("Immediate hospital referral")) {
      recommendation = "Immediate hospital referral required.";
    } else if (severity === "High" && !recommendation.includes("medical evaluation")) {
      recommendation = "Urgent conventional medical evaluation recommended.";
    } else if (severity === "Moderate" && !recommendation.includes("conventional medical doctor")) {
      recommendation = "Consult with a conventional medical doctor soon.";
    }

    const redFlagAnalysis = {
      emergency,
      severity,
      category: category === "No Red Flags" && matchedRedFlags.length > 0 ? matchedRedFlags.join(', ') : category, // Clean up category if still default and flags exist
      matchedRedFlags,
      recommendation,
      physicianComment,
    };

    // Debug output
    console.log("[RED FLAG ANALYSIS]");
    console.log("Matched:", redFlagAnalysis.matchedRedFlags.join(", ") || "None");
    console.log("Severity:", redFlagAnalysis.severity);
    console.log("Recommendation:", redFlagAnalysis.recommendation);

    return redFlagAnalysis;
  },
};

module.exports = clinicalRedFlagService;
