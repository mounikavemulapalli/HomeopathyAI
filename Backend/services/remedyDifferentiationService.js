
const remedyDifferentiationService = {
  remedyProfiles: {
    "Puls": {
      "name": "Pulsatilla",
      "keyFeatures": [
        "mild",
        "yielding",
        "thirstless",
        "weeping",
        "seeks consolation",
        "changeable symptoms",
        "better in open air",
        "warm-blooded"
      ]
    },
    "Sep": {
      "name": "Sepia",
      "keyFeatures": [
        "indifferent",
        "aversion to family",
        "irritable",
        "bearing down sensation",
        "wants to be alone",
        "chilly",
        "better by vigorous exercise",
        "sadness",
        "loathing of life"
      ]
    },
    "Nat-m": {
      "name": "Natrum Muriaticum",
      "keyFeatures": [
        "grief",
        "reserved",
        "avoids consolation",
        "dry mucous membranes",
        "craves salt",
        "worse from consolation",
        "sensitive",
        "weeping in secret"
      ]
    },
    // Add more remedy profiles here
  },

  differentiate: function(topRemedies, symptoms) {
    let bestMatch = { remedy: null, score: -1, matchedFeatures: [] };
    const remedyScores = {};
    const remedyExplanations = {};

    // Calculate scores for each top remedy based on symptoms
    for (const remedyCode of topRemedies) {
      const profile = this.remedyProfiles[remedyCode];
      if (!profile) continue;

      let score = 0;
      const matchedFeatures = [];
      const explanationParts = [];

      // Check for positive matches (patient symptoms matching remedy key features)
      for (const symptom of symptoms) {
        // Simple keyword matching for now, can be improved with NLP/ontology
        const symptomLower = symptom.toLowerCase();
        for (const feature of profile.keyFeatures) {
          if (symptomLower.includes(feature.toLowerCase()) || feature.toLowerCase().includes(symptomLower)) {
            score++;
            if (!matchedFeatures.includes(feature)) {
              matchedFeatures.push(feature);
            }
            if (!explanationParts.includes(feature)) {
              explanationParts.push(feature);
            }
          }
        }
      }

      // Prioritize symptoms more relevant to the remedy differentiation
      // This is a placeholder for more advanced logic
      if (remedyCode === "Puls" && matchedFeatures.some(f => f.includes("weeping") || f.includes("mild") || f.includes("thirstless"))) {
          score += 2; // Boost for key pulsatilla symptoms
      }
      if (remedyCode === "Sep" && matchedFeatures.some(f => f.includes("indifferent") || f.includes("irritable") || f.includes("wants to be alone"))) {
          score += 2; // Boost for key sepia symptoms
      }
      if (remedyCode === "Nat-m" && matchedFeatures.some(f => f.includes("grief") || f.includes("avoids consolation") || f.includes("craves salt"))) {
          score += 2; // Boost for key nat-m symptoms
      }

      remedyScores[remedyCode] = score;

      if (score > bestMatch.score) {
        bestMatch.score = score;
        bestMatch.remedy = remedyCode;
        bestMatch.matchedFeatures = matchedFeatures;
      }
    }

    const winnerCode = bestMatch.remedy;
    const winnerProfile = this.remedyProfiles[winnerCode];
    const winnerName = winnerProfile ? winnerProfile.name : winnerCode;

    let explanation = ``;
    if (winnerProfile) {
      const matchedFeaturesText = bestMatch.matchedFeatures.length > 0 
        ? `The patient exhibits ${bestMatch.matchedFeatures.join(", ")} which are prominent features of ${winnerName}.`
        : `There are no specific matching features identified for ${winnerName} from the provided symptoms.`;
      explanation += `${winnerName} ranks first because ${matchedFeaturesText}.\n\n`;
    }

    // Explain why others lost and missing features
    for (const remedyCode of topRemedies) {
      if (remedyCode === winnerCode) continue;

      const competingProfile = this.remedyProfiles[remedyCode];
      if (!competingProfile) continue;

      const competingName = competingProfile.name;
      const competingScore = remedyScores[remedyCode] || 0;

      // Features present in competing remedy but absent in patient symptoms
      const missingFeatures = competingProfile.keyFeatures.filter(feature => 
        !symptoms.some(symptom => 
          symptom.toLowerCase().includes(feature.toLowerCase()) || 
          feature.toLowerCase().includes(symptom.toLowerCase())
        )
      );

      // Features present in patient symptoms but absent in competing remedy
      const contradictorySymptoms = [...new Set(
        symptoms
          .filter(symptom =>
            !competingProfile.keyFeatures.some(feature =>
              symptom.toLowerCase().includes(feature.toLowerCase()) ||
              feature.toLowerCase().includes(symptom.toLowerCase())
            )
          )
          .map(symptom => symptom.trim())
          .filter(Boolean)
      )].slice(0, 5);


      if (competingScore < bestMatch.score) {
        explanation += `${competingName} ranks lower.`;
      } else {
        explanation += `${competingName} also has some matching features.`;
      }

      if (missingFeatures.length > 0) {
        explanation += ` Key features like ${missingFeatures.join(", ")} typically associated with ${competingName} are absent in the patient's presentation.`;
      }

      // Do not label unconfirmed symptoms as contradictions.
      explanation += `\n\n`;
    }

    // Refine explanation for Nat-m specific to consolation
    if (winnerCode === "Puls" && topRemedies.includes("Nat-m") && symptoms.some(s => s.toLowerCase().includes("consolation") || s.toLowerCase().includes("sympathy"))) {
      explanation += `Natrum muriaticum usually avoids consolation whereas this patient seeks sympathy.\n\n`;
    } else if (winnerCode === "Nat-m" && topRemedies.includes("Puls") && symptoms.some(s => s.toLowerCase().includes("avoids consolation"))) {
      explanation += `Pulsatilla seeks consolation, but this patient avoids it, which is characteristic of Natrum Muriaticum.\n\n`;
    }


    // Add debug output
    const debugOutput = [
      "[DIFFERENTIATION]",
      `Top Remedies: ${topRemedies.join(", ")}`,
      `Matched Features for ${winnerName}: ${bestMatch.matchedFeatures.join(", ")}`,
      `Explanation: ${explanation.trim()}`
    ].join("\n");

    console.log(debugOutput);

    return {
      winner: winnerCode,
      explanation: explanation.trim()
    };
  },
};

module.exports = remedyDifferentiationService;



