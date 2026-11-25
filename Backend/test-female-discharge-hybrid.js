const RepertoryEngine = require("./services/RepertoryEngine");
const VectorSearchService = require("./services/VectorSearchService");

(async () => {
  const engine = new RepertoryEngine();
  await engine.init();

  const femaleChapters = [
    "FEMALE",
    "GENITALIA FEMALE",
    "CLINICAL_FEMALE_NEW_ADDED",
    "CLINICAL_CLARKE_FEMALE_NEW_ADDED",
  ];

  const hits = await VectorSearchService.hybridSearch("bland discharge", null, 10, {
    allowedChapters: femaleChapters,
  });

  console.log(
    JSON.stringify(
      hits.map((h) => ({
        id: h.id,
        chapter: h.chapter,
        rubric: h.rubric,
        finalScore: h.finalScore,
        remedyCount: Array.isArray(h.remedies) ? h.remedies.length : 0,
      })),
      null,
      2,
    ),
  );
})().catch(console.error);
