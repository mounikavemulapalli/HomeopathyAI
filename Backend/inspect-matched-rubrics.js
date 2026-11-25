const fs = require("fs");
const path = require("path");
const p = require("./services/physicianThinkingService");
const RepertoryEngine = require("./services/RepertoryEngine");
const VectorSearchService = require("./services/VectorSearchService");

(async () => {
  const engine = new RepertoryEngine();
  await engine.init();

  const syms = [
    { field: "Chief Complaint", value: "back pain" },
    { field: "Chief Complaint Description", value: "lumbar back ache" },
    { field: "Chief Complaint Description", value: "radiating to right leg" },
    { field: "Chief Complaint Description", value: "throbbing type of pain" },
    { field: "Modalities", value: "worse rising from sitting" },
    { field: "Modalities", value: "better pressure" },
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
      const hybridHits = await VectorSearchService.hybridSearch(s.value, null, 15, {
        ...(interp || {}),
        allowedChapters,
      });
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

    for (const rub of finals) {
      const key =
        rub.id ||
        `${rub.source || ""}::${rub.chapter || ""}::${String(rub.rubric || "").trim().toLowerCase()}`;
      const existing = dedupedByKey.get(key);
      if (!existing || (Number(rub.score) || 0) > (Number(existing.score) || 0)) {
        dedupedByKey.set(key, rub);
      }
    }
  }

  const uniqueRubrics = Array.from(dedupedByKey.values());
  const analysis = await engine.analyzeCase(uniqueRubrics);

  for (const r of (analysis.remedies || []).slice(0, 6)) {
    console.log(
      JSON.stringify(
        {
          name: r.name,
          totalGrade: r.totalGrade,
          rubricsCovered: r.rubricsCovered,
          finalScore: r.finalScore,
          matchedRubrics: (r.matchedRubrics || []).map((m) => ({
            id: m.id,
            rubric: m.rubric || m.name,
            grade: m.grade,
          })),
        },
        null,
        2,
      ),
    );
  }
})().catch(console.error);
