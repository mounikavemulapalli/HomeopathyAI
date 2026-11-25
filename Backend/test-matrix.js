const p = require('./services/physicianThinkingService');
const RepertoryEngine = require('./services/RepertoryEngine');

const cleanSource = (src) =>
  String(src || 'UNKNOWN')
    .replace(/(\.json)+$/gi, '')
    .replace(/_master_db$/i, '')
    .replace(/_db$/i, '');

(async () => {
  const engine = new RepertoryEngine();
  await engine.init();

  const syms = [
    { field: 'Chief Complaint', value: 'back pain' },
    { field: 'Chief Complaint Description', value: 'lumbar back ache' },
    { field: 'Chief Complaint Description', value: 'radiating to right leg' },
    { field: 'Chief Complaint Description', value: 'throbbing type of pain' },
    { field: 'Modalities', value: 'worse rising from sitting' },
    { field: 'Modalities', value: 'better pressure' },
  ];

  const dedupedByKey = new Map();

  for (const s of syms) {
    const interp = p.inferClinicalMeaning(s);
    const out = await engine.findIntelligentRubrics(s, interp.isMindSymptom, interp);
    const finals = out?.[0]?.rubrics?.finalRubrics || [];

    for (const rub of finals) {
      const key =
        rub.id ||
        `${cleanSource(rub.source)}::${rub.chapter || ''}::${String(rub.rubric || '').trim().toLowerCase()}`;
      const existing = dedupedByKey.get(key);
      if (!existing || (Number(rub.score) || 0) > (Number(existing.score) || 0)) {
        dedupedByKey.set(key, { ...rub, _symptom: s.value });
      }
    }
  }

  const uniqueRubrics = Array.from(dedupedByKey.values());
  const analysis = await engine.analyzeCase(uniqueRubrics);
  const flatRubrics = analysis.matrix.flatMap((g) => g.rubrics || []);
  const topCols = (analysis.classicalRankedRemedies || analysis.remedies).slice(0, 7);

  console.log('=== REPERTORISATION MATRIX TEST ===');
  console.log(`Symptoms: ${flatRubrics.length} | Remedies: ${analysis.remedies.length}`);
  console.log('Remedy Name |', topCols.map((r) => r.name).join(' | '));
  console.log(
    'Totality / Covered |',
    topCols
      .map((r) => `${r.totalGrade ?? r.totalityScore ?? 0} / ${r.rubricsCovered ?? r.symptomsCovered ?? 0}`)
      .join(' | ')
  );

  for (const rub of flatRubrics) {
    const src = cleanSource(rub.source);
    const label = `[${src}] [${rub.chapter || ''}] ${rub.rubric}`;
    const cells = topCols.map((col) => {
      const found = (rub.remedies || []).find((rm) => rm.name === col.name);
      return found && found.grade > 0 ? String(found.grade) : '.';
    });
    console.log(label, '|', cells.join(' | '));
  }
})().catch((err) => {
  console.error('ERR:', err);
  process.exit(1);
});
