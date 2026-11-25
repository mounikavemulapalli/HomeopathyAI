const localVectorStoreService = require("./services/localVectorStoreService");
const VectorSearchService = require("./services/VectorSearchService");
const RepertoryEngine = require("./services/RepertoryEngine");

(async () => {
  const health = await localVectorStoreService.checkHealth();
  console.log("Vector store health:", health);

  const engine = new RepertoryEngine();
  await engine.init();

  const lexicalMatches = engine.findIntelligentRubrics
    ? await engine.findIntelligentRubrics("bland discharge", { chapter: "FEMALE" })
    : [];
  console.log("Lexical count:", Array.isArray(lexicalMatches) ? lexicalMatches.length : "n/a");

  const vecMatches = await localVectorStoreService.search("bland discharge", 10, {
    allowedChapters: ["FEMALE", "GENITALIA FEMALE", "CLINICAL_FEMALE_NEW_ADDED", "CLINICAL_CLARKE_FEMALE_NEW_ADDED"],
  });
  console.log("Top vector matches (Female chapters):", vecMatches.slice(0, 5));

  const hybridMatches = await VectorSearchService.hybridSearch("bland discharge", null, 10);
  console.log("Hybrid search sample count:", hybridMatches.length);
})().catch(console.error);
