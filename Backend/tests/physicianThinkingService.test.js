const physicianThinkingService = require('../services/physicianThinkingService');

describe('Clinical field detection regression', () => {
    test.each([
        [{ field: 'Chest', value: 'chest pain' }, 'CHEST', false],
        [{ field: 'Skin', value: 'itching' }, 'SKIN', false],
        [{ field: 'Mind', value: 'anxiety' }, 'MIND', true],
        [{ field: 'Stomach', value: 'nausea' }, 'STOMACH', false],
        [
            {
                field: 'Chest',
                value: 'heaviness worse at night, pain radiating to left hand'
            },
            'CHEST',
            false
        ]
    ])(
        'detects the expected field for %j',
        (input, expectedField, expectedMindFlag) => {
            const result = physicianThinkingService.inferClinicalMeaning(input);

            expect(result.detectedClinicalField).toBe(expectedField);
            expect(result.isMindSymptom).toBe(expectedMindFlag);
            expect(result.chapterCandidates).toHaveProperty(expectedField);
        }
    );
});


describe('Mind symptom fallback regression', () => {
    test('unknown symptom does not become a Mind symptom from fallback alone', () => {
        const result = physicianThinkingService.inferClinicalMeaning(
            'unclassified physical sensation'
        );

        expect(result.detectedClinicalField).toBe('UNKNOWN');
        expect(result.chapterCandidates.MIND).toBeGreaterThan(0);
        expect(result.isMindSymptom).toBe(false);
    });

    test('anxiety remains classified as a Mind symptom', () => {
        const result = physicianThinkingService.inferClinicalMeaning('anxiety');

        expect(result.detectedClinicalField).toBe('MIND');
        expect(result.isMindSymptom).toBe(true);
    });
});

describe('Parent complaint context regression', () => {
    test.each([
        ['heaviness', 'Chest pain'],
        ['radiating to left hand', 'Chest pain']
    ])(
        'preserves parent context for description "%s"',
        (value, parentComplaintContext) => {
            const result = physicianThinkingService.inferClinicalMeaning({
                field: 'Chief Complaint Description',
                value,
                parentComplaintContext
            });

            expect(result.originalSymptom).toEqual({
                field: 'Chief Complaint Description',
                value,
                parentComplaintContext
            });
            expect(result.searchTerms).toEqual(expect.any(Array));

            const normalizedSearchTerms = result.searchTerms.map(term =>
                String(term).toLowerCase().trim()
            );

            expect(normalizedSearchTerms).toContain(
                `${parentComplaintContext} ${value}`.toLowerCase()
            );
        }
    );
});

describe('Parent chapter lock aliases', () => {
    test.each([
        ['Female System', 'Bland discharge', 'FEMALE'],
        ['Female Genitalia', 'Bland discharge', 'GENITALIA FEMALE'],
        ['Nose', 'Blocked nose', 'NOSE'],
        ['Rectum', 'Pain', 'RECTUM'],
        ['Head', 'Headache', 'HEAD'],
        ['Male System', 'Swelling and pain', 'MALE']
    ])(
        'locks "%s" parent context to %s',
        (parentComplaintContext, value, expectedChapter) => {
            const result = physicianThinkingService.inferClinicalMeaning({
                field: 'Chief Complaint Description',
                value,
                parentComplaintContext
            });

            expect(result.primaryChapter).toBe(expectedChapter);
            expect(result.chapterCandidates).toEqual({ [expectedChapter]: 0.99 });
            expect(result.secondaryChapters).toEqual([]);
            expect(result.parentChapterLocked).toBe(true);
        }
    );

    test.each([
        ['Female System', 'FEMALE'],
        ['Female Genitalia', 'GENITALIA FEMALE'],
        ['Nose', 'NOSE'],
        ['Rectum', 'RECTUM'],
        ['Head', 'HEAD'],
        ['Male System', 'MALE']
    ])(
        'locks and searches the chapter named in Chief Complaint: %s',
        (chapterName, expectedChapter) => {
            const result = physicianThinkingService.inferClinicalMeaning({
                field: 'Chief Complaint',
                value: chapterName
            });

            expect(result.primaryChapter).toBe(expectedChapter);
            expect(result.chapterCandidates).toEqual({ [expectedChapter]: 0.99 });
            expect(result.parentChapterLocked).toBe(true);
            expect(result.searchTerms).toContain(chapterName);
        }
    );

    test.each([
        [
            { field: 'Chief Complaint Modalities', value: 'worse from cold air' },
            'Rectum'
        ],
        [{ field: 'Sleep', value: 'disturbed sleep' }, 'Nose'],
        [{ field: 'Dreams', value: 'dreams of snakes' }, 'Rectum'],
        [{ field: 'cravings', value: 'sweets' }, 'Nose'],
        [{ field: 'Aversions', value: 'aversion to milk' }, 'Nose']
    ])(
        'applies the parent lock to specialized interpretation %j',
        (input, parentComplaintContext) => {
            const result = physicianThinkingService.inferClinicalMeaning({
                ...input,
                parentComplaintContext
            });

            const withoutParent = physicianThinkingService.inferClinicalMeaning(input);

            expect(result.parentChapterLocked).toBe(true);
            expect(result.primaryChapter).toBe(
                parentComplaintContext === 'Rectum' ? 'RECTUM' : 'NOSE'
            );
            expect(result.chapterCandidates).toEqual({
                [result.primaryChapter]: 0.99
            });
            expect(result.canonicalSymptom).toBe(withoutParent.canonicalSymptom);
            expect(result.searchTerms).toEqual(
                expect.arrayContaining(withoutParent.searchTerms)
            );
            expect(result.confidence).toBe(withoutParent.confidence);
            expect(result.isMindSymptom).toBe(withoutParent.isMindSymptom);
        }
    );

    test('preserves the symptom meaning when a parent chapter is locked', () => {
        const result = physicianThinkingService.inferClinicalMeaning({
            field: 'Chief Complaint Description',
            value: 'weeping',
            parentComplaintContext: 'Female System'
        });

        expect(result.primaryChapter).toBe('FEMALE');
        expect(result.canonicalSymptom).toBe('Weeping tendency');
        expect(result.isMindSymptom).toBe(true);
    });

    test('keeps existing symptom classification for an unknown parent label', () => {
        const result = physicianThinkingService.inferClinicalMeaning({
            field: 'Chief Complaint Description',
            value: 'Headache',
            parentComplaintContext: 'UnmappedCustomLabel123'
        });

        expect(result.primaryChapter).toBe('HEAD');
        expect(result.parentChapterLocked).toBeUndefined();
        expect(result.chapterCandidates.MIND).toBeUndefined();
    });
});

describe('Headache chapter lock', () => {
    test.each([
        'headache',
        'head pain',
        'pain in the head',
        'throbbing headache',
        { field: 'Chief Complaint', value: 'headache' }
    ])('routes %j only to HEAD', (symptom) => {
        const result = physicianThinkingService.inferClinicalMeaning(symptom);

        expect(result.primaryChapter).toBe('HEAD');
        expect(result.chapterCandidates).toEqual({ HEAD: 0.99 });
        expect(result.detectedClinicalField).toBe('HEAD');
        expect(result.isMindSymptom).toBe(false);
    });
});

describe('Menses chapter lock', () => {
    test.each([
        'menses',
        'delayed menses',
        'scanty menses'
    ])('routes %j to GENITALIA FEMALE', (symptom) => {
        const result = physicianThinkingService.inferClinicalMeaning(symptom);

        expect(result.primaryChapter).toBe('GENITALIA FEMALE');
        expect(result.chapterCandidates.MIND).toBeUndefined();
    });
});
