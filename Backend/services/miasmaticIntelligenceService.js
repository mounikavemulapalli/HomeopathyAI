
// Backend/services/miasmaticIntelligenceService.js

const miasmaticIntelligenceService = {

  symptomProfiles: {
    psora: {
      keynotes: ["anxiety", "fear", "itching", "skin itching", "restlessness"],
      moderate: ["functional complaints", "weakness", "chilly", "digestive complaints", "flatulence", "disturbed sleep"],
      weak: ["lack of confidence", "grief", "headache", "sensitivity to sun"]
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
        const normalizedSymptom = String(symptom).toLowerCase().trim();

        const matchesFeature = (feature) => {
          const normalizedFeature = String(feature).toLowerCase().trim();
          return normalizedSymptom === normalizedFeature ||
            normalizedSymptom.includes(normalizedFeature) ||
            normalizedFeature.includes(normalizedSymptom);
        };

        if (profile.keynotes.some(matchesFeature)) {
          scores[miasm] += 20;
          matchedSymptoms[miasm].push(symptom);
        } else if (profile.moderate.some(matchesFeature)) {
          scores[miasm] += 10;
          matchedSymptoms[miasm].push(symptom);
        } else if (profile.weak.some(matchesFeature)) {
          scores[miasm] += 5;
          matchedSymptoms[miasm].push(symptom);
        }
      }
    }

    // Sort miasms by score in descending order
    const sortedMiasms = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);

    const hasMiasmaticMatch = Object.values(scores).some(score => score > 0);
    const dominantMiasm = hasMiasmaticMatch ? sortedMiasms[0] : null;
    const secondaryMiasm = hasMiasmaticMatch && scores[sortedMiasms[1]] > 0 ? sortedMiasms[1] : null;

    // Log for debugging
    console.log("[MIASM ANALYSIS]");
    console.log("Dominant:", dominantMiasm);
    console.log("Secondary:", secondaryMiasm);
    console.log("Scores:", scores);
    console.log("Matched Symptoms:", matchedSymptoms);

    return {
      dominantMiasm: dominantMiasm ? dominantMiasm.charAt(0).toUpperCase() + dominantMiasm.slice(1) : null,
      secondaryMiasm: secondaryMiasm ? secondaryMiasm.charAt(0).toUpperCase() + secondaryMiasm.slice(1) : null,
      scores,
      matchedSymptoms,
    };
  },
};

module.exports = miasmaticIntelligenceService;





