const appetiteProfiles = require("./appetiteProfiles.json");

class AppetiteInterpreter {
  /**
   * Interprets appetite-related symptoms based on predefined profiles.
   * @param {string} symptomInput - The raw symptom text from the user.
   * @returns {object} An object containing interpretation details.
   */
  interpret(symptomInput) {
    const lowerCaseSymptomInput = symptomInput.toLowerCase();

    for (const profileKey in appetiteProfiles) {
      const profile = appetiteProfiles[profileKey];
      for (const keyword of profile.keywords) {
        if (lowerCaseSymptomInput.includes(keyword.toLowerCase())) {
          return {
            handled: true,
            canonicalSymptom: profile.canonicalSymptom,
            primaryChapter: profile.primaryChapter,
            secondaryChapters: profile.secondaryChapters, // Added as per requirement
            searchTerms: profile.keywords, // Now using keywords for search terms as well
            confidence: profile.confidence,
            matchType: profile.matchType // Added as per requirement
          };
        }
      }
    }

    return { handled: false };
  }
}

module.exports = new AppetiteInterpreter();