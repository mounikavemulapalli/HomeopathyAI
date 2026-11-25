const assert = require('assert');
const p = require('./services/physicianThinkingService');
const RepertoryEngine = require('./services/RepertoryEngine');

(async () => {
  console.log('=== 1. UNIT TESTS: PARENT CONTEXT CHAPTER LOCK ===');

  const unitCases = [
    {
      label: 'Female System + Bland discharge',
      input: { field: 'Chief Complaint Description', value: 'Bland discharge', parentComplaintContext: 'Female System' },
      expectedPrimary: 'FEMALE',
      expectLocked: true,
    },
    {
      label: 'Female Genitalia + Bland discharge',
      input: { field: 'Chief Complaint Description', value: 'Bland discharge', parentComplaintContext: 'Female Genitalia' },
      expectedPrimary: 'GENITALIA FEMALE',
      expectLocked: true,
    },
    {
      label: 'Nose + Blocked nose',
      input: { field: 'Chief Complaint Description', value: 'Blocked nose', parentComplaintContext: 'Nose' },
      expectedPrimary: 'NOSE',
      expectLocked: true,
    },
    {
      label: 'Rectum + Pain',
      input: { field: 'Chief Complaint Description', value: 'Pain', parentComplaintContext: 'Rectum' },
      expectedPrimary: 'RECTUM',
      expectLocked: true,
    },
    {
      label: 'Head + Headache',
      input: { field: 'Chief Complaint Description', value: 'Headache', parentComplaintContext: 'Head' },
      expectedPrimary: 'HEAD',
      expectLocked: true,
    },
    {
      label: 'Male System + Male complaint',
      input: { field: 'Chief Complaint Description', value: 'Swelling and pain', parentComplaintContext: 'Male System' },
      expectedPrimary: 'MALE',
      expectLocked: true,
    },
    {
      label: 'Thermal early-return + Parent lock (Rectum)',
      input: { field: 'Chief Complaint Modalities', value: 'worse from cold air', parentComplaintContext: 'Rectum' },
      expectedPrimary: 'RECTUM',
      expectLocked: true,
    },
    {
      label: 'Aversions early-return + Parent lock (Nose)',
      input: { field: 'Chief Complaint Description', value: 'aversion to milk', parentComplaintContext: 'Nose' },
      expectedPrimary: 'NOSE',
      expectLocked: true,
    },
    {
      label: 'No parent + Headache (existing fallback preserved)',
      input: { field: 'Chief Complaint', value: 'Headache' },
      expectedPrimary: 'HEAD',
      expectLocked: false,
    },
    {
      label: 'Unknown parent + Headache (existing fallback preserved)',
      input: { field: 'Chief Complaint Description', value: 'Headache', parentComplaintContext: 'UnmappedCustomLabel123' },
      expectedPrimary: 'HEAD',
      expectLocked: false,
    },
  ];

  for (const tc of unitCases) {
    const res = p.inferClinicalMeaning(tc.input);
    assert.strictEqual(
      res.primaryChapter,
      tc.expectedPrimary,
      `${tc.label}: expected ${tc.expectedPrimary}, got ${res.primaryChapter}`
    );
    if (tc.expectLocked) {
      assert.deepStrictEqual(
        res.chapterCandidates,
        { [tc.expectedPrimary]: 0.99 },
        `${tc.label}: expected strict single candidate { ${tc.expectedPrimary}: 0.99 }, got ${JSON.stringify(res.chapterCandidates)}`
      );
      assert.ok(res.searchTerms.length > 0, `${tc.label}: searchTerms should be preserved`);
    }
    console.log(`PASS: ${tc.label} -> ${res.primaryChapter} | candidates=${JSON.stringify(res.chapterCandidates)}`);
  }

  console.log('\n=== 2. INTEGRATION TEST: Female System -> Bland discharge ===');
  const engine = new RepertoryEngine();
  await engine.init();

  const descSym = {
    field: 'Chief Complaint Description',
    value: 'Bland discharge',
    parentComplaintContext: 'Female System',
  };
  const interp = p.inferClinicalMeaning(descSym);
  const out = await engine.findIntelligentRubrics(descSym, interp.isMindSymptom, interp);
  const finals = out?.[0]?.rubrics?.finalRubrics || [];

  console.log('Locked chapter:', interp.primaryChapter);
  console.log('Search terms:', interp.searchTerms.slice(0, 6));
  console.log(
    'Final rubrics:',
    finals.map((r) => `[${r.source}] [${r.chapter}] ${r.rubric}`)
  );

  for (const r of finals) {
    const ch = String(r.chapter || '').toUpperCase();
    assert.ok(
      ch.includes('FEMALE'),
      `Expected only Female chapter family rubrics, got chapter "${r.chapter}" for "${r.rubric}"`
    );
  }
  console.log('ALL AUDIT TESTS PASSED!');
})().catch((err) => {
  console.error('AUDIT TEST FAILED:', err);
  process.exit(1);
});
