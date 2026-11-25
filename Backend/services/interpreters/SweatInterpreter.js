const sweatProfiles = require("./sweatProfiles.json");

class SweatInterpreter {
  /**
   * Interprets perspiration-related symptoms based on predefined profiles.
   * @param {string} symptomInput - The raw symptom text from the user.
   * @returns {object} An object containing interpretation details.
   */
  interpret(symptomInput) {
    const lowerCaseSymptomInput = symptomInput.toLowerCase();

    for (const profile of sweatProfiles) {
      for (const searchTerm of profile.searchTerms) {
        if (lowerCaseSymptomInput.includes(searchTerm.toLowerCase())) {
          return {
            handled: true,
            canonicalSymptom: profile.canonicalSymptom,
            primaryChapter: profile.primaryChapter,
            secondaryChapters: profile.secondaryChapters || [], // Ensure secondaryChapters is an array
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

module.exports = new SweatInterpreter();