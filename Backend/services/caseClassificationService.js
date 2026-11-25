
const caseClassificationService = {
  classifyCase: (caseData) => {
    let acuteScore = 0;
    let chronicScore = 0;
    let miasmaticScore = 0;
    let miasmaticFlareScore = 0;

    const symptoms = caseData.symptoms || [];
    const duration = caseData.duration || "";
    const onset = caseData.onset || "";
    const history = caseData.history || "";
    const recurrence = caseData.recurrence || "";
    const miasmaticAnalysis = caseData.miasmaticAnalysis || {};

    // Acute Indicators
    const acuteIndicators = ["sudden", "recent", "hours", "days", "fever", "injury", "infection"];
    acuteIndicators.forEach(indicator => {
      if (duration.toLowerCase().includes(indicator) || onset.toLowerCase().includes(indicator) || symptoms.some(s => s.toLowerCase().includes(indicator))) {
        acuteScore += 10;
      }
    });

    // Chronic Indicators
    const chronicIndicators = ["years", "recurring", "recurrent", "long standing", "constitutional symptoms", "mental generals"];
    chronicIndicators.forEach(indicator => {
      if (duration.toLowerCase().includes(indicator) || history.toLowerCase().includes(indicator) || recurrence.toLowerCase().includes(indicator) || symptoms.some(s => s.toLowerCase().includes(indicator))) {
        chronicScore += 10;
      }
    });

    // Miasmatic Intelligence Score
    const miasmaticScores = miasmaticAnalysis.scores || {};
    const calculatedMiasmaticScore = Math.max(0, ...Object.values(miasmaticScores).map(score => Number(score) || 0));
    miasmaticScore = calculatedMiasmaticScore;

    // Miasmatic Flare Indicators
    const miasmaticFlareIndicators = ["suppression history", "recurrent pathology", "alternating complaints"];
    miasmaticFlareIndicators.forEach(indicator => {
      if (history.toLowerCase().includes(indicator) || recurrence.toLowerCase().includes(indicator) || symptoms.some(s => s.toLowerCase().includes(indicator)) || miasmaticAnalysis[indicator]) {
        miasmaticFlareScore += 10;
      }
    });

    let type = "Unclassified";
    let confidence = 0;
    let reasoning = "Insufficient indicators to classify the case.";

    if (chronicScore > acuteScore && chronicScore > miasmaticScore) {
      type = "Chronic";
      confidence = Math.min(95, 50 + chronicScore);
      reasoning = "Long-standing complaints with deep pathology indicate a chronic case.";
    } else if (acuteScore > chronicScore && acuteScore > miasmaticScore) {
      type = "Acute";
      confidence = Math.min(95, 50 + acuteScore);
      reasoning = "Sudden onset with recent symptoms strongly indicates an acute condition.";
    } else if (miasmaticFlareScore > acuteScore && miasmaticFlareScore > chronicScore) {
      type = "Miasmatic Flare";
      confidence = Math.min(95, 50 + miasmaticFlareScore);
      reasoning = "Presence of suppression history, recurrent pathology, or alternating complaints indicates a miasmatic flare.";
    }
    else if (miasmaticScore > acuteScore && miasmaticScore > chronicScore) {
      type = "Miasmatic Pattern";
      confidence = Math.min(95, 50 + miasmaticScore);
      reasoning = "Miasmatic pattern score is dominant without sufficient active flare indicators."; 
    }

    // Check for Acute on Chronic
    if (acuteScore > 0 && chronicScore > 0 && acuteScore > miasmaticScore && chronicScore > miasmaticScore) {
        type = "Acute on Chronic";
        confidence = Math.min(95, 50 + Math.min(acuteScore, chronicScore));
        reasoning = "Chronic condition with a recent acute exacerbation.";
    }

    // Debug logs
    console.log("[CASE CLASSIFICATION]");
    console.log(`Acute Score: ${acuteScore}`);
    console.log(`Chronic Score: ${chronicScore}`);
    console.log(`Miasmatic Score: ${miasmaticScore}`);
    console.log(`Miasmatic Flare Score: ${miasmaticFlareScore}`);
    console.log(`Final Type: ${type}`);
    console.log(`Confidence: ${confidence}`);
    console.log(`Reasoning: ${reasoning}`);

    return {
      type,
      confidence,
      reasoning,
    };
  },
};

module.exports = caseClassificationService;







