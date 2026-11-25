const path = require("path");
const p = require("./services/physicianThinkingService");
const RepertoryEngine = require("./services/RepertoryEngine");
const VectorSearchService = require("./services/VectorSearchService");

const cleanSource = (src) =>
  String(src || "UNKNOWN")
    .replace(/(\.json)+$/gi, "")
    .replace(/_master_db$/i, "")
    .replace(/_db$/i, "");

(async () => {
  const engine = new RepertoryEngine();
  await engine.init();

  const syms = [
    { field: "Chief Complaint", value: "leucorrhoea" },
    { field: "Chief Complaint Description", value: "bland discharge" },
    { field: "Chief Complaint Description", value: "offensive discharge" },
    { field: "Chief Complaint Description", value: "scanty menses" },
    { field: "Appetite", value: "low appetite" },
    { field: "Cravings", value: "craving chicken" },
    { field: "Aversions", value: "aversion to milk" },
    { field: "Thirst", value: "low thirst" },
    { field: "Bowel", value: "constipated" },
    { field: "Urine", value: "scanty urine" },
    { field: "Sleep", value: "refreshing sleep" },
    { field: "Dreams", value: "ghost dreams" },
    { field: "Sweat", value: "excess sweat" },
    { field: "Thermal", value: "chilly" },
  ];

  const dedupedByKey = new Map();
  const useHybridVector = process.env.ENABLE_HYBRID_VECTOR_SEARCH === "true";

  for (const s of syms) {
    const interp = p.inferClinicalMeaning(s);
    const out = await engine.findIntelligentRubrics(s, interp.isMindSymptom, interp);
    const finals = [...(out?.[0]?.rubrics?.finalRubrics || [])];

    if (useHybridVector && s?.value) {
      const allowedChapters =
        Array.isArray(interp?.allowedChapters) && interp.allowedChapters.length > 0
          ? interp.allowedChapters
          : interp?.primaryChapter
            ? [interp.primaryChapter]
            : undefined;

      const hybridHits = await VectorSearchService.hybridSearch(
        s.value,
        null,
        15,
        { ...(interp || {}), allowedChapters },
      );

      for (const hit of hybridHits || []) {
        const hitChap = String(hit.chapter || "").toUpperCase();
        if (
          Array.isArray(allowedChapters) &&
          allowedChapters.length > 0 &&
          !allowedChapters.map((c) => String(c).toUpperCase()).includes(hitChap)
        ) {
          continue;
        }
        finals.push(hit);
      }
    }

    const refinedFinals = engine._refineFinalRubrics(finals, s);
    for (const rub of refinedFinals) {
      const key =
        rub.id ||
        `${cleanSource(rub.source)}::${rub.chapter || ""}::${String(rub.rubric || "").trim().toLowerCase()}`;
      const existing = dedupedByKey.get(key);
      if (!existing || (Number(rub.score) || 0) > (Number(existing.score) || 0)) {
        dedupedByKey.set(key, rub);
      }
    }
  }

  const uniqueRubrics = Array.from(dedupedByKey.values());
  const analysis = await engine.analyzeCase(uniqueRubrics);
  const topRemedies = (analysis.classicalRankedRemedies || analysis.remedies || []).slice(0, 8);
  const flatRubrics = (analysis.matrix || []).flatMap((g) => g.rubrics || []);

  console.log("Total Rubrics:", flatRubrics.length);
  console.log(
    "Rubrics:",
    flatRubrics.map((r) => `[${cleanSource(r.source)}][${r.chapter}] ${r.rubric}`),
  );
  console.log(
    "Top Remedies:",
    topRemedies.map((r) => ({
      name: r.name,
      totalGrade: r.totalGrade ?? r.totalityScore ?? 0,
      rubricsCovered: r.rubricsCovered ?? r.symptomsCovered ?? 0,
    })),
  );
})().catch(console.error);
