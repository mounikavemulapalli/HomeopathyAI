const {
    searchRubricsWithChapterLock
} = require("../services/masterRubricSearchService.cjs");

describe("master rubric chapter lock", () => {
    beforeAll(() => {
        global.masterRepertory = [
            {
                id: 0,
                chapter: "HEAD",
                rubric: "Headache",
                path: "HEAD > Pain > Headache",
                source: "Kent",
                grade: 1
            },
            {
                id: 1,
                chapter: "MIND",
                rubric: "Headache during anxiety",
                path: "MIND > Anxiety > Headache during anxiety",
                source: "Kent",
                grade: 1
            },
            {
                id: 2,
                chapter: "KIDNEYS",
                rubric: "Headache with kidney pain",
                path: "KIDNEYS > Pain > Headache with kidney pain",
                source: "Kent",
                grade: 1
            },
            {
                id: 3,
                chapter: "GENITALIA FEMALE",
                rubric: "Menses",
                path: "GENITALIA FEMALE > Menses",
                source: "Kent",
                grade: 1
            },
            {
                id: 4,
                chapter: "MIND",
                rubric: "Menses with anxiety",
                path: "MIND > Anxiety > Menses with anxiety",
                source: "Kent",
                grade: 1
            },
            {
                id: 5,
                chapter: "GENERALITIES",
                rubric: "Menses",
                path: "GENERALITIES > Menses",
                source: "Kent",
                grade: 1
            }
        ];
    });

    test("does not recover rubrics from other chapters when HEAD has few matches", async () => {
        const result = await searchRubricsWithChapterLock(
            ["headache"],
            {
                primaryChapter: "HEAD",
                chapterCandidates: {
                    HEAD: 0.99,
                    MIND: 0.1,
                    KIDNEYS: 0.1
                }
            },
            "Headache",
            false,
            "headache"
        );

        expect(result.rubrics).toHaveLength(1);
        expect(result.rubrics[0].chapter).toBe("HEAD");
    });

    test("keeps menses results in GENITALIA FEMALE, not MIND or GENERALITIES", async () => {
        const result = await searchRubricsWithChapterLock(
            ["menses"],
            {
                primaryChapter: "GENITALIA FEMALE",
                chapterCandidates: {
                    "GENITALIA FEMALE": 0.99,
                    MIND: 0.1,
                    GENERALITIES: 0.15
                }
            },
            "Menses",
            false,
            "menses"
        );

        expect(result.rubrics.length).toBeGreaterThan(0);
        expect(result.rubrics.every(
            (rubric) => rubric.chapter === "GENITALIA FEMALE"
        )).toBe(true);
    });
});
