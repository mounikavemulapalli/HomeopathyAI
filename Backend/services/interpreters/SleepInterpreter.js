
const sleepProfiles = require('./sleepProfiles.json');

class SleepInterpreter {
  interpret(symptom) {
    const sleepField = symptom.Sleep;

    if (!sleepField || symptom.Dreams) {
      return { handled: false };
    }

    const lowerCaseSleepField = sleepField.toLowerCase();

    for (const category in sleepProfiles) {
      for (const profileKey in sleepProfiles[category]) {
        const profile = sleepProfiles[category][profileKey];
        for (const searchTerm of profile.searchTerms) {
          if (lowerCaseSleepField.includes(searchTerm.toLowerCase())) {
            return {
              handled: true,
              canonicalSymptom: profile.canonicalSymptom,
              primaryChapter: profile.primaryChapter,
              secondaryChapters: [],
              searchTerms: profile.searchTerms,
              confidence: profile.confidence,
              matchType: profile.matchType,
            };
          }
        }
      }
    }

    return { handled: false };
  }
}

module.exports = SleepInterpreter;
