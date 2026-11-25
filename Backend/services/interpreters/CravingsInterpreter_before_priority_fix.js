const cravingsProfiles = require("../profiles/cravingsProfiles.json");

class CravingsInterpreter {
  interpret(symptom) {
    console.log(`[CravingsInterpreter] Interpreting symptom: ${JSON.stringify(symptom)}`);
    if (symptom.field !== "cravings") {
      console.log(`[CravingsInterpreter] Symptom field is not 'cravings', returning handled:false.`);
      return { handled: false };
    }

    const text = symptom.value.toLowerCase();
    console.log(`[CravingsInterpreter] Processing craving text: '${text}'`);

    for (const profile of cravingsProfiles) {
      // Check for exact matches first for higher confidence (PROFILE_EXACT)
      if (profile.synonyms.some(syn => text === syn.toLowerCase()) ||
          profile.searchTerms.some(term => text === term.toLowerCase())) {
        console.log(`[CravingsInterpreter] Exact match found for '${text}' with profile: ${profile.canonicalName}`);
        return {
          handled: true,
          canonicalSymptom: profile.canonicalName,
          primaryChapter: "FOOD AND DRINKS",
          secondaryChapters: ["GENERALITIES"],
          searchTerms: profile.searchTerms,
          confidence: 99, // PROFILE_EXACT
          matchType: "PROFILE_EXACT"
        };
      }

      // Check for partial matches or common expressions (PROFILE_ALIAS)
      // This condition will be checked only if an exact match is not found in the previous block.
      // We can also check if the text includes any part of the synonyms or common expressions.
      if (profile.synonyms.some(syn => text.includes(syn.toLowerCase())) || 
          profile.commonExpressions.some(exp => text.includes(exp.toLowerCase())) ||
          profile.searchTerms.some(term => text.includes(term.toLowerCase()))
          ) {
        console.log(`[CravingsInterpreter] Partial/alias match found for '${text}' with profile: ${profile.canonicalName}`);
        return {
          handled: true,
          canonicalSymptom: profile.canonicalName,
          primaryChapter: "FOOD AND DRINKS",
          secondaryChapters: ["GENERALITIES"],
          searchTerms: profile.searchTerms,
          confidence: 96, // PROFILE_ALIAS
          matchType: "PROFILE_ALIAS"
        };
      }
    }

    // Fallback if no specific profile matches
    console.log(`[CravingsInterpreter] No specific profile match found for '${text}', returning handled:false.`);
    return {
      handled: false, // Fallback is not handled by a specific profile
      canonicalSymptom: null,
      primaryChapter: null,
      secondaryChapters: [],
      searchTerms: [],
      confidence: 0, 
      matchType: "FALLBACK"
    };
  }
}

module.exports = CravingsInterpreter;