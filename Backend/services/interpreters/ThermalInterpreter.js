const thermalProfiles = require('../thermalProfiles_v2.json');
const { normalizeChapterName } = require('../clinicalOntologyService');

module.exports = {
    interpret: (symptomInput) => {
        if (typeof symptomInput === 'object' && symptomInput !== null && symptomInput.field === 'thermal') {
            const thermalType = symptomInput.value.toUpperCase();
            const profile = thermalProfiles[thermalType];

            if (profile) {
                const primaryChapter = normalizeChapterName(profile.repertoryChapter[0]);
                const canonicalSymptom = profile.canonicalName; // e.g., "Hot", "Chilly"
                const searchTerms = [
                    canonicalSymptom,
                    ...profile.synonyms,
                    ...profile.patientExpressions,
                    ...profile.clinicalKeywords
                ];
                const confidence = 99; // High confidence for direct thermal mapping as per dedicated knowledge profile

                console.log(`\n--- Thermal Interpretation ---`);
                console.log(`Field: ${symptomInput.field}`);
                console.log(`Value: ${symptomInput.value}`);
                console.log(`Matched thermal profile: ${canonicalSymptom}`);
                console.log(`Canonical symptom: ${canonicalSymptom}`);
                console.log(`Primary chapter: ${primaryChapter}`);
                console.log(`Confidence: ${confidence}%`);
                console.log(`------------------------------\n`);

                return {
                    handled: true,
                    originalSymptom: symptomInput,
                    canonicalSymptom: canonicalSymptom,
                    primaryChapter: primaryChapter,
                    secondaryChapters: [], // Thermal is generally a primary, direct mapping
                    globalAllowedChapters: [primaryChapter, normalizeChapterName("GENERALITIES")],
                    rejectedChapters: [],
                    confidence: confidence,
                    searchTerms: [...new Set(searchTerms)],
                    detectedClinicalField: "THERMAL"
                };
            }
        }
        return {
            handled: false
        };
    }
};