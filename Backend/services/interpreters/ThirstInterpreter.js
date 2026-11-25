const thirstProfiles = require("./thirstProfiles.json");

class ThirstInterpreter {
  /**
   * Interprets thirst-related symptoms based on predefined profiles.
   * @param {string} symptomInput - The raw symptom text from the user.
   * @returns {object} An object containing interpretation details.
   */
  interpret(symptomInput) {
    const lowerCaseSymptomInput = symptomInput.toLowerCase();

    for (const profile of thirstProfiles.thirstProfiles) {
      for (const keyword of profile.keywords) {
        if (lowerCaseSymptomInput.includes(keyword.toLowerCase())) {
          return {
            handled: true,
            canonicalSymptom: profile.canonicalSymptom,
            primaryChapter: profile.primaryChapter,
            searchTerms: profile.searchTerms,
            confidence: profile.confidence,
            matchType: profile.matchType
          };
        }
      }
    }

    return { handled: false };
  }
}

module.exports = new ThirstInterpreter();