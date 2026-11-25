const assert = require('assert');
const p = require('./services/physicianThinkingService');
const RepertoryEngine = require('./services/RepertoryEngine');

(async () => {
  const engine = new RepertoryEngine();
  await engine.init();

  const symptoms = [
    { field: 'Chief Complaint', value: 'Female System' },
    { field: 'Chief Complaint Description', value: 'Bland discharge', parentComplaintContext: 'Female System' },
    { field: 'Chief Complaint Modalities', value: 'worse in morning', parentComplaintContext: 'Female System' },
  ];

  const collected = [];
  for (const sym of symptoms) {
    const interp = p.inferClinicalMeaning(sym);
    const out = await engine.findIntelligentRubrics(sym, interp.isMindSymptom, interp);
    const finals = out?.[0]?.rubrics?.finalRubrics || [];
    for (const r of finals) {
      collected.push(r);
    }
  }

  assert.ok(collected.length > 0, 'Expected rubrics from Female System case');
  for (const r of collected) {
    const ch = String(r.chapter || '').toUpperCase();
    assert.ok(ch.includes('FEMALE'), `Unexpected chapter "${r.chapter}" in case rubrics`);
  }

  const analysis = await engine.analyzeCase(collected);
  const flatRows = (analysis.matrix || []).flatMap((g) => g.rubrics || []);
  const topCols = (analysis.classicalRankedRemedies || analysis.remedies || []).slice(0, 8);

  console.log('Matrix groups:', analysis.matrix.length);
  console.log('Flat rubric rows:', flatRows.length);
  console.log(
    'Top remedies (name, totalGrade, rubricsCovered):',
    topCols.map((c) => `${c.name} (${c.totalGrade ?? 0}/${c.rubricsCovered ?? 0})`)
  );
  console.log('E2E FEMALE CASE MATRIX CHECK PASSED!');
})().catch((err) => {
  console.error('E2E CHECK FAILED:', err);
  process.exit(1);
});
