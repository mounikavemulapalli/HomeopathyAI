
// Backend/services/miasmaticIntelligenceService.js

const miasmaticIntelligenceService = {

  symptomProfiles: {
    psora: {
      keynotes: ["anxiety", "fear", "itching"],
      moderate: ["functional complaints", "weakness", "chilly"],
      weak: ["lack of confidence", "digestive complaints"]
    },
    sycosis: {
      keynotes: ["warts", "overgrowth", "jealousy"],
      moderate: ["secrecy", "fixed ideas", "thick discharges"],
      weak: ["obesity", "suppression history"]
    },
    syphilis: {
      keynotes: ["destructiveness", "suicidal thoughts", "ulceration"],
      moderate: ["night aggravation", "violence"],
      weak: ["bone pains", "self destruction"]
    },
    tubercular: {
      keynotes: ["restlessness", "changeability", "recurrent infections"],
      moderate: ["desire to travel", "rapid exhaustion"],
      weak: ["alternating complaints"]
    },
    cancerinic: {
      keynotes: ["perfectionism", "fastidiousness", "suppressed emotions"],
      moderate: ["high responsibility"],
      weak: ["control issues"]
    }
  },

  analyzeMiasm: (symptoms) => {
    const scores = {
      psora: 0,
      sycosis: 0,
      syphilis: 0,
      tubercular: 0,
      cancerinic: 0,
    };

    const matchedSymptoms = {
      psora: [],
      sycosis: [],
      syphilis: [],
      tubercular: [],
      cancerinic: [],
    };

    for (const symptom of symptoms) {
      for (const miasm in miasmaticIntelligenceService.symptomProfiles) {
        const profile = miasmaticIntelligenceService.symptomProfiles[miasm];
        if (profile.keynotes.includes(symptom.toLowerCase())) {
          scores[miasm] += 20;
          matchedSymptoms[miasm].push(symptom);
        } else if (profile.moderate.includes(symptom.toLowerCase())) {
          scores[miasm] += 10;
          matchedSymptoms[miasm].push(symptom);
        } else if (profile.weak.includes(symptom.toLowerCase())) {
          scores[miasm] += 5;
          matchedSymptoms[miasm].push(symptom);
        }
      }
    }

    // Sort miasms by score in descending order
    const sortedMiasms = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);

    const dominantMiasm = sortedMiasms[0];
    const secondaryMiasm = sortedMiasms[1];

    // Log for debugging
    console.log("[MIASM ANALYSIS]");
    console.log("Dominant:", dominantMiasm);
    console.log("Secondary:", secondaryMiasm);
    console.log("Scores:", scores);
    console.log("Matched Symptoms:", matchedSymptoms);

    return {
      dominantMiasm: dominantMiasm.charAt(0).toUpperCase() + dominantMiasm.slice(1),
      secondaryMiasm: secondaryMiasm.charAt(0).toUpperCase() + secondaryMiasm.slice(1),
      scores,
      matchedSymptoms,
    };
  },
};

module.exports = miasmaticIntelligenceService;
