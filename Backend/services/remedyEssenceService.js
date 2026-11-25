
const remedyEssences = {
  "Puls": {
    keySymptoms: [
      "mild yielding weeping patient",
      "thirstless",
      "changeable symptoms",
      "worse from warmth",
      "better from open air"
    ]
  },
  "Sulph": {
    keySymptoms: [
      "dirty unkempt appearance",
      "burning feet",
      "heat on top of head",
      "worse from warmth",
      "philosophical"
    ]
  },
  "Lach": {
    keySymptoms: [
      "jealousy",
      "loquacity",
      "left sided complaints",
      "suspicious",
      "worse after sleep",
      "constriction sensation"
    ]
  },
  "Ars": {
    keySymptoms: [
      "fear of death",
      "restlessness",
      "burning pains",
      "thirstless small quantities",
      "anxiety",
      "fastidious"
    ]
  },
  "Nux": {
    keySymptoms: [
      "irritable",
      "impatient",
      "sedentary lifestyle",
      "overindulgence",
      "constipation"
    ]
  },
  "Calc": {
    keySymptoms: [
      "chilly",
      "sweaty head",
      "craves eggs",
      "obstinate",
      "anxiety about health"
    ]
  },
  "Sep": {
    keySymptoms: [
      "indifference to loved ones",
      "bearing down sensation",
      "worse before menses",
      "sadness",
      "craves pickles"
    ]
  },
  "Lyc": {
    keySymptoms: [
      "right sided complaints",
      "worse 4-8pm",
      "anticipatory anxiety",
      "bloating",
      "craves sweets"
    ]
  },
  "Phos": {
    keySymptoms: [
      "sympathetic",
      "fear of darkness",
      "craves cold drinks",
      "burning pains",
      "hemorrhages"
    ]
  },
  "NatMur": {
    keySymptoms: [
      "grief",
      "ailments from grief",
      "aggravation from consolation",
      "craves salt",
      "headaches like hammer blows"
    ]
  }
}

function analyzeEssence(symptoms) {
  const matchingEssences = [];

  for (const remedy in remedyEssences) {
    let matchedSymptoms = [];
    let score = 0;

    for (const keySymptom of remedyEssences[remedy].keySymptoms) {
      if (symptoms.includes(keySymptom)) {
        matchedSymptoms.push(keySymptom);
        score += 10; // Each matched key symptom adds to the score
      }
    }

    if (matchedSymptoms.length > 0) {
      // Calculate essenceScore based on the number of matched symptoms vs total key symptoms
      const essenceScore = (matchedSymptoms.length / remedyEssences[remedy].keySymptoms.length) * 100;
      matchingEssences.push({
        remedy: remedy,
        essenceScore: Math.round(essenceScore), // Round to nearest whole number
        matchedSymptoms: matchedSymptoms,
      });
    }
  }

  // Sort by essenceScore in descending order
  matchingEssences.sort((a, b) => b.essenceScore - a.essenceScore);

  return matchingEssences;
}

module.exports = {
  remedyEssences,
  analyzeEssence,
};
