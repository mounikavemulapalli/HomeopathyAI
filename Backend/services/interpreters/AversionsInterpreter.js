const aversionsProfiles = require("../profiles/aversionsProfiles.json");
const { normalizeChapterName } = require("../clinicalOntologyService");

class AversionsInterpreter {
  interpret(symptom) {
    if (typeof symptom !== 'object' || !symptom.field || symptom.field.toLowerCase() !== "aversions") {
      return { handled: false };
    }

    const text = symptom.value.toLowerCase();

    for (const profile of aversionsProfiles) {
      if (profile.synonyms.some(syn => text === syn.toLowerCase()) ||
          profile.searchTerms.some(term => text === term.toLowerCase())) {
        
        const primaryChapter = profile.suggestedPrimaryChapter ? normalizeChapterName(profile.suggestedPrimaryChapter).toUpperCase() : null;
        const secondaryChapters = profile.suggestedSecondaryChapters ? profile.suggestedSecondaryChapters.map(chap => normalizeChapterName(chap).toUpperCase()) : [];

        let chapterCandidates = {};
        if(primaryChapter) chapterCandidates[primaryChapter] = 0.95;
        secondaryChapters.forEach(chap => {
            chapterCandidates[chap] = Math.max(chapterCandidates[chap] || 0, 0.70);
        });
        // Add GENERALITIES with a lower weight if not already covered
        const normalizedGeneralities = normalizeChapterName("GENERALITIES").toUpperCase();
        chapterCandidates[normalizedGeneralities] = Math.max(chapterCandidates[normalizedGeneralities] || 0, 0.50);

        return {
          handled: true,
          canonicalSymptom: profile.canonicalName,
          primaryChapter: primaryChapter,
          secondaryChapters: secondaryChapters,
          searchTerms: profile.searchTerms,
          confidence: 99, // PROFILE_EXACT
          matchType: "PROFILE_EXACT",
          chapterCandidates: chapterCandidates
        };
      }

      if (profile.synonyms.some(syn => text.includes(syn.toLowerCase())) || 
          profile.commonExpressions.some(exp => text.includes(exp.toLowerCase())) ||
          profile.searchTerms.some(term => text.includes(term.toLowerCase()))
          ) {
        
        const primaryChapter = profile.suggestedPrimaryChapter ? normalizeChapterName(profile.suggestedPrimaryChapter).toUpperCase() : null;
        const secondaryChapters = profile.suggestedSecondaryChapters ? profile.suggestedSecondaryChapters.map(chap => normalizeChapterName(chap).toUpperCase()) : [];

        let chapterCandidates = {};
        if(primaryChapter) chapterCandidates[primaryChapter] = 0.90;
        secondaryChapters.forEach(chap => {
            chapterCandidates[chap] = Math.max(chapterCandidates[chap] || 0, 0.65);
        });
        const normalizedGeneralities = normalizeChapterName("GENERALITIES").toUpperCase();
        chapterCandidates[normalizedGeneralities] = Math.max(chapterCandidates[normalizedGeneralities] || 0, 0.45);

        return {
          handled: true,
          canonicalSymptom: profile.canonicalName,
          primaryChapter: primaryChapter,
          secondaryChapters: secondaryChapters,
          searchTerms: profile.searchTerms,
          confidence: 96, // PROFILE_ALIAS
          matchType: "PROFILE_ALIAS",
          chapterCandidates: chapterCandidates
        };
      }
    }

    // If no specific profile matches, but it's an aversion, handle it with general food/drink chapters
    const defaultPrimaryChapter = normalizeChapterName("FOOD AND DRINKS").toUpperCase();
    let defaultChapterCandidates = {};
    defaultChapterCandidates[defaultPrimaryChapter] = 0.8; // A reasonable default confidence
    defaultChapterCandidates[normalizeChapterName("GENERALITIES").toUpperCase()] = 0.6; // Also include generalities

    return {
      handled: true, // Mark as handled to prevent generic ontology fallback
      canonicalSymptom: `Aversion, ${symptom.value}`, // Use the original value to form canonical symptom
      primaryChapter: defaultPrimaryChapter,
      secondaryChapters: [],
      searchTerms: [symptom.value],
      confidence: 50, // Assign a lower confidence than profile matches
      matchType: "GENERIC_AVERSION", // Indicate it's a generic match
      chapterCandidates: defaultChapterCandidates
    };
  }
}

module.exports = AversionsInterpreter;
