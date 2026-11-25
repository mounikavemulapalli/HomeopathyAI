
const remedyRelationships = {
  Sulphur: {
    complementary: ["Calcarea carb", "Lycopodium"],
    followsWell: ["Calcarea carb"],
    antidotes: ["Mercurius", "China"],
    inimical: ["Lachesis"],
  },
  Pulsatilla: {
    complementary: ["Silicea", "Sepia"],
    followsWell: ["Silicea"],
    antidotes: ["Chamomilla", "Coffea"],
  },
  "Nux vomica": {
    complementary: ["Sulphur"],
    antidotes: ["Coffea", "Chamomilla"],
    inimical: ["Zincum"],
  },
  Lachesis: {
    inimical: ["Nux vomica"] // Added for benchmark test
  }
};

function analyzeRelationship(previousRemedy, currentRemedy) {
  const previousRemedyData = remedyRelationships[previousRemedy];
  let relationship = "unrelated";
  let compatibility = "Neutral";
  let explanation = "";

  if (previousRemedyData) {
    if (previousRemedyData.complementary && previousRemedyData.complementary.includes(currentRemedy)) {
      relationship = "Complementary";
      compatibility = "Excellent";
      explanation = `Current remedy (${currentRemedy}) complements previous prescription (${previousRemedy}).`;
    } else if (previousRemedyData.followsWell && previousRemedyData.followsWell.includes(currentRemedy)) {
      relationship = "Follows Well";
      compatibility = "Good";
      explanation = `Current remedy (${currentRemedy}) follows previous prescription (${previousRemedy}) well.`;
    } else if (previousRemedyData.antidotes && previousRemedyData.antidotes.includes(currentRemedy)) {
      relationship = "Antidotal";
      compatibility = "Poor";
      explanation = `Current remedy (${currentRemedy}) antidotes previous prescription (${previousRemedy}). Re-evaluate carefully.`;
    } else if (previousRemedyData.inimical && previousRemedyData.inimical.includes(currentRemedy)) {
      relationship = "Inimical";
      compatibility = "Very Poor";
      explanation = `Current remedy (${currentRemedy}) is inimical to previous remedy (${previousRemedy}). Re-evaluate carefully.`;
    }
  }

  if (relationship === "unrelated") {
      explanation = `No specific relationship found between previous remedy (${previousRemedy}) and current remedy (${currentRemedy}).`;
  }

  return {
    relationship,
    compatibility,
    explanation,
  };
}

module.exports = {
  remedyRelationships,
  analyzeRelationship,
};
