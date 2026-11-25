
const clinicalContradictionService = {
  detect: (topRemedies, allSymptoms) => {
    const contradictions = [];

    // Define major contradiction rules
    // Define all contradiction rules
    const contradictionRules = [
      // Major Contradictions
      { remedy: "Arsenicum", symptom: "Thirstless", expected: "thirsty", severity: "major", explanation: (s, r, e) => `Patient exhibits ${s} whereas classical ${r} is generally ${e}. This significantly lowers remedy confidence.` },
      { remedy: "Pulsatilla", symptom: "Intense Thirst", expected: "Thirstless", severity: "major", explanation: (s, r, e) => `Patient exhibits ${s} whereas classical ${r} is generally ${e}. This significantly lowers remedy confidence.` },
      { remedy: "Pulsatilla", symptom: "Very Hot Patient", expected: "Warm-blooded", severity: "major", explanation: (s, r, e) => `Patient is a ${s.toLowerCase()} whereas classical ${r} is generally ${e}. This significantly lowers remedy confidence.` },
      { remedy: "Sulphur", symptom: "Chilly Patient", expected: "Warm-blooded/Hot", severity: "major", explanation: (s, r, e) => `Patient is a ${s.toLowerCase()} whereas classical ${r} is generally ${e}. This significantly lowers remedy confidence.` },
      { remedy: "Nux-v", symptom: "Mild Yielding Nature", expected: "Irritable/Impatient", severity: "major", explanation: (s, r, e) => `Patient exhibits a ${s.toLowerCase()} whereas classical ${r} is generally ${e}. This significantly lowers remedy confidence.` },
      { remedy: "Sepia", symptom: "Strong Desire for Consolation", expected: "Averse to Consolation", severity: "major", explanation: (s, r, e) => `Patient exhibits a ${s.toLowerCase()} whereas classical ${r} is generally ${e}. This significantly lowers remedy confidence.` },
      { remedy: "Nat-m", symptom: "Seeks Consolation", expected: "Averse to Consolation", severity: "major", explanation: (s, r, e) => `Patient ${s.toLowerCase()} whereas classical ${r} is generally ${e}. This significantly lowers remedy confidence.` },
      // Minor Contradictions (from example)
      { remedy: "Pulsatilla", symptom: "Chilly", expected: "Warm-blooded", severity: "mild", explanation: (s, r, e) => `Patient is ${s.toLowerCase()} whereas classical ${r} is generally ${e}. This lowers remedy confidence slightly.` },
    ];

    topRemedies.forEach(remedy => {
      contradictionRules.forEach(rule => {
        // Normalize symptoms for comparison (case-insensitive and remove extra spaces)
        const normalizedSymptoms = allSymptoms.map(symptom => symptom.toLowerCase().trim());
        const normalizedRuleSymptom = rule.symptom.toLowerCase().trim();

        if (rule.remedy === remedy && normalizedSymptoms.includes(normalizedRuleSymptom)) {
          contradictions.push({
            remedy: remedy,
            symptom: rule.symptom, // Keep original symptom for output
            expected: rule.expected,
            severity: rule.severity,
            explanation: rule.explanation(rule.symptom, remedy, rule.expected)
          });
        }
      });
    });

    return contradictions;
  },
};

module.exports = clinicalContradictionService;
