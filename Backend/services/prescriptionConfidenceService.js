
const calculatePrescriptionConfidence = ({ 
  repertoryResult, 
  keynoteConfirmation, 
  materiaMedicaVerification, 
  contradictionAnalysis, 
  essenceAnalysis, 
  miasmaticAnalysis, 
  constitutionalWeight, 
  caseClassification 
}) => {
  let confidenceScore = 0;
  const strengths = [];
  const cautions = [];

  // Scoring logic
  if (repertoryResult?.strongAgreement) { // Assuming repertoryResult has a property indicating strong agreement
    confidenceScore += 25;
    strengths.push("Strong repertory agreement");
  }

  if (keynoteConfirmation?.strongConfirmation) {
    confidenceScore += 20;
    strengths.push("Strong keynote confirmation");
  } else if (keynoteConfirmation?.moderateConfirmation) {
    cautions.push("Moderate keynote confirmation; additional evidence needed");
  } else if (keynoteConfirmation?.weakConfirmation) {
    confidenceScore -= 10;
    cautions.push("Weak keynote confirmation");
  }

  if (materiaMedicaVerification?.strongVerification) { // Assuming materiaMedicaVerification has a property indicating strong verification
    confidenceScore += 15;
    strengths.push("Strong MM verification");
  }

  if (essenceAnalysis?.strongMatch) { // Assuming essenceAnalysis has a property indicating strong match
    confidenceScore += 15;
    strengths.push("Strong essence match");
  }

  if (constitutionalWeight?.alignment) { // Assuming constitutionalWeight has a property indicating alignment
    confidenceScore += 10;
    strengths.push("Constitutional alignment");
  }

  if (miasmaticAnalysis?.agreement) { // Assuming miasmaticAnalysis has a property indicating agreement
    confidenceScore += 5;
    strengths.push("Miasmatic agreement");
  }

  if (contradictionAnalysis?.noContradictions) { // Assuming contradictionAnalysis has a property indicating no contradictions
    confidenceScore += 10;
    strengths.push("No contradictions");
  } else if (contradictionAnalysis?.majorContradiction) { // Assuming contradictionAnalysis has a property indicating major contradiction
    confidenceScore -= 15;
    cautions.push("Major contradiction");
  }

  // Ensure score is within 0-100
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  let confidenceLevel;
  if (confidenceScore >= 90) {
    confidenceLevel = "Very High";
  } else if (confidenceScore >= 75) {
    confidenceLevel = "High";
  } else if (confidenceScore >= 60) {
    confidenceLevel = "Moderate";
  } else {
    confidenceLevel = "Low";
  }

  // TODO: Generate more dynamic physicianComment based on strengths/cautions
  let physicianComment = "Prescription confidence is " + confidenceLevel.toLowerCase() + ".";
  if (strengths.length > 0) {
    physicianComment += " Clinical picture shows: " + strengths.join(", ") + ".";
  }
  if (cautions.length > 0) {
    physicianComment += " However, " + cautions.join(", ") + " should be considered.";
  }

  console.log("[PRESCRIPTION CONFIDENCE]");
  console.log("Repertory:", repertoryResult?.strongAgreement ? "Strong" : "Weak/None");
  console.log("Keynotes:", keynoteConfirmation?.strongConfirmation ? "Strong" : (keynoteConfirmation?.moderateConfirmation ? "Moderate" : (keynoteConfirmation?.weakConfirmation ? "Weak" : "None")));
  console.log("MM:", materiaMedicaVerification?.strongVerification ? "Strong" : "Weak/None");
  console.log("Contradictions:", contradictionAnalysis?.noContradictions ? "None" : (contradictionAnalysis?.majorContradiction ? "Major" : "Minor"));
  console.log("Final Score:", confidenceScore);

  return {
    confidenceScore,
    confidenceLevel,
    strengths,
    cautions,
    physicianComment,
  };
};

module.exports = { calculatePrescriptionConfidence };

