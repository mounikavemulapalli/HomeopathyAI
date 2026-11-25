const p = require('./services/physicianThinkingService');
const RepertoryEngine = require('./services/RepertoryEngine');

(async () => {
  const engine = new RepertoryEngine();
  await engine.init();

  const modSyms = [
    { field: 'Modalities', value: 'worse rising from sitting' },
    { field: 'Modalities', value: 'better pressure' },
  ];

  for (const s of modSyms) {
    const interp = p.inferClinicalMeaning(s);
    console.log('=== MODALITY:', s.value, '===');
    console.log('primary:', interp.primaryChapter, '| secondary:', interp.secondaryChapters);
    console.log('candidates:', JSON.stringify(interp.chapterCandidates));
    console.log('canonical:', interp.canonicalSymptom);
    const out = await engine.findIntelligentRubrics(s, interp.isMindSymptom, interp);
    const finals = out?.[0]?.rubrics?.finalRubrics || [];
    console.log('finalRubrics:', finals.map((r) => `${r.chapter}:${r.rubric}`));
  }
})().catch(console.error);
