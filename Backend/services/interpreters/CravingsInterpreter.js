const cravingsProfiles = require("../profiles/cravingsProfiles.json");

class CravingsInterpreter {
  interpret(symptom) {
    console.log(
      `[CravingsInterpreter] Interpreting symptom: ${JSON.stringify(symptom)}`
    );

    if (
      !symptom ||
      typeof symptom !== "object" ||
      symptom.field !== "cravings"
    ) {
      console.log(
        "[CravingsInterpreter] Symptom field is not 'cravings', returning handled:false."
      );
      return { handled: false };
    }

    const text = String(symptom.value || "").toLowerCase().trim();

    console.log(
      `[CravingsInterpreter] Processing craving text: '${text}'`
    );

    const normalize = (value) =>
      String(value || "").toLowerCase().trim();

    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const matchesWholeTerm = (value, term) => {
      const normalizedTerm = normalize(term);

      if (!normalizedTerm) return false;

      const pattern = `(^|\\s)${escapeRegex(normalizedTerm)}(?=\\s|$)`;

      return new RegExp(pattern, "i").test(value);
    };

    const buildResult = (profile, confidence, matchType) => ({
      handled: true,
      canonicalSymptom: profile.canonicalName,
      primaryChapter: "FOOD AND DRINKS",
      secondaryChapters: ["GENERALITIES"],
      searchTerms: profile.searchTerms,
      confidence,
      matchType
    });

    // 1. Search ALL profiles for exact matches first.
    // This prevents profile-array order from deciding the result.
    const exactMatches = [];

    for (const profile of cravingsProfiles) {
      const exactTerms = [
        ...(profile.synonyms || []),
        ...(profile.searchTerms || [])
      ];

      for (const term of exactTerms) {
        if (normalize(text) === normalize(term)) {
          exactMatches.push({
            profile,
            term,
            length: normalize(term).length
          });
        }
      }
    }

    if (exactMatches.length > 0) {
      exactMatches.sort((a, b) => b.length - a.length);

      const selected = exactMatches[0];

      console.log(
        `[CravingsInterpreter] Exact match found for '${text}' with profile: ${selected.profile.canonicalName}`
      );

      return buildResult(
        selected.profile,
        99,
        "PROFILE_EXACT"
      );
    }

    // 2. Collect ALL alias matches instead of returning the first match.
    // Whole-term matching prevents 'rice' from matching 'ice'.
    const aliasMatches = [];

    for (const profile of cravingsProfiles) {
      const candidates = [
        ...(profile.synonyms || []).map((term) => ({
          term,
          type: "synonym"
        })),
        ...(profile.commonExpressions || []).map((term) => ({
          term,
          type: "expression"
        })),
        ...(profile.searchTerms || []).map((term) => ({
          term,
          type: "searchTerm"
        }))
      ];

      for (const candidate of candidates) {
        const term = normalize(candidate.term);

        if (!term) continue;

        let matched = false;

        if (candidate.type === "expression") {
          matched = text.includes(term);
        } else {
          matched = matchesWholeTerm(text, term);
        }

        if (matched) {
          aliasMatches.push({
            profile,
            term,
            length: term.length,
            type: candidate.type
          });
        }
      }
    }

    if (aliasMatches.length > 0) {
      // Longer and more specific phrases get priority.
      aliasMatches.sort((a, b) => {
        if (b.length !== a.length) {
          return b.length - a.length;
        }

        return a.profile.canonicalName.localeCompare(
          b.profile.canonicalName
        );
      });

      const selected = aliasMatches[0];

      console.log(
        `[CravingsInterpreter] Partial/alias match found for '${text}' with profile: ${selected.profile.canonicalName} using term: '${selected.term}'`
      );

      return buildResult(
        selected.profile,
        96,
        "PROFILE_ALIAS"
      );
    }

    // 3. Safe fallback.
    console.log(
      `[CravingsInterpreter] No specific profile match found for '${text}', returning handled:false.`
    );

    return {
      handled: false,
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
