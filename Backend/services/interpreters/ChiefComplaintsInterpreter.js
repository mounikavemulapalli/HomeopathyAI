const chiefComplaintsProfiles = require("../profiles/chiefComplaintsProfiles.json");
const { normalizeChapterName } = require("../clinicalOntologyService");

class ChiefComplaintsInterpreter {
  interpret(symptom) {
    if (
  typeof symptom !== "object" ||
  !symptom.field ||
  !["chief complaint", "chief complaints"].includes(
    String(symptom.field).trim().toLowerCase()
  )
) {
      return { handled: false };
    }

    const text = symptom.value.toLowerCase();

    for (const profile of chiefComplaintsProfiles) {
      if (profile.synonyms.some(syn => text === syn.toLowerCase()) ||
          profile.searchTerms.some(term => text === term.toLowerCase())) {
        
        const primaryChapter = profile.suggestedPrimaryChapter ? normalizeChapterName(profile.suggestedPrimaryChapter).toUpperCase() : null;
        const secondaryChapters = profile.suggestedSecondaryChapters ? profile.suggestedSecondaryChapters.map(chap => normalizeChapterName(chap).toUpperCase()) : [];

        let chapterCandidates = {};
        if(primaryChapter) chapterCandidates[primaryChapter] = 0.95;
        secondaryChapters.forEach(chap => {
            chapterCandidates[chap] = Math.max(chapterCandidates[chap] || 0, 0.70);
        });
        const normalizedGeneralities = normalizeChapterName("GENERALITIES").toUpperCase();
        chapterCandidates[normalizedGeneralities] = Math.max(chapterCandidates[normalizedGeneralities] || 0, 0.50);

        return {
          handled: true,
          canonicalSymptom: profile.canonicalName,
          primaryChapter: primaryChapter,
          secondaryChapters: secondaryChapters,
          searchTerms: profile.searchTerms,
          confidence: 99, 
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
          confidence: 96, 
          matchType: "PROFILE_ALIAS",
          chapterCandidates: chapterCandidates
        };
      }
    }

    return {
      handled: false,
      canonicalSymptom: null,
      primaryChapter: null,
      secondaryChapters: [],
      searchTerms: [],
      confidence: 0, 
      matchType: "FALLBACK",
      chapterCandidates: {}
    };
  }
}

module.exports = ChiefComplaintsInterpreter;