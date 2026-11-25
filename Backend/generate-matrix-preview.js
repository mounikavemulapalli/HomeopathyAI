const fs = require('fs');
const path = require('path');
const p = require('./services/physicianThinkingService');
const RepertoryEngine = require('./services/RepertoryEngine');
const VectorSearchService = require('./services/VectorSearchService');

const cleanSource = (src) =>
  String(src || 'UNKNOWN')
    .replace(/(\.json)+$/gi, '')
    .replace(/_master_db$/i, '')
    .replace(/_db$/i, '');

const esc = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

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
  const useHybridVector = process.env.ENABLE_HYBRID_VECTOR_SEARCH === 'true';

  for (const s of syms) {
    const interp = p.inferClinicalMeaning(s);
    const out = await engine.findIntelligentRubrics(s, interp.isMindSymptom, interp);
    const finals = [...(out?.[0]?.rubrics?.finalRubrics || [])];

    if (useHybridVector && s?.value) {
      const allowedChapters = Array.isArray(interp?.allowedChapters) && interp.allowedChapters.length > 0
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
        const hitChap = String(hit.chapter || '').toUpperCase();
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
        `${cleanSource(rub.source)}::${rub.chapter || ''}::${String(rub.rubric || '').trim().toLowerCase()}`;
      const existing = dedupedByKey.get(key);
      if (!existing || (Number(rub.score) || 0) > (Number(existing.score) || 0)) {
        dedupedByKey.set(key, rub);
      }
    }
  }

  const uniqueRubrics = Array.from(dedupedByKey.values());

  const allCaseText = syms.map((x) => String((x && x.value) || '')).join(' ').toLowerCase();
  const caseRight = /\bright\b/.test(allCaseText) && !/\bleft\b/.test(allCaseText);
  const caseLeft = /\bleft\b/.test(allCaseText) && !/\bright\b/.test(allCaseText);
  const caseTokens = Array.from(
    new Set(
      allCaseText
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter((t) => t.length >= 4 && !['pain', 'type', 'from', 'worse', 'better'].includes(t)),
    ),
  );

  const cleanedUniqueRubrics = uniqueRubrics.filter((r) => {
    const txt = (String((r && r.path) || '') + ' ' + String((r && r.rubric) || '')).toLowerCase();
    if (caseRight && /\bleft\b/.test(txt) && !/\bright\b/.test(txt)) return false;
    if (caseLeft && /\bright\b/.test(txt) && !/\bleft\b/.test(txt)) return false;
    if (/\b[a-z]+_[0-9]+\s*>/.test(String((r && r.rubric) || '').toLowerCase())) return false;
    if (/\b(diarrh|rectum|navicular|cervical|coccyx|scapulae|abdomen|cold taken|urging in)\b/.test(txt)) return false;
    return caseTokens.some((tok) => txt.includes(tok.slice(0, 5)));
  });

  const finalMatrixRubrics = cleanedUniqueRubrics.length > 0 ? cleanedUniqueRubrics : uniqueRubrics;
  const analysis = await engine.analyzeCase(finalMatrixRubrics);
  const flatRubrics = analysis.matrix.flatMap((g) => g.rubrics || []);
  const topCols = (analysis.classicalRankedRemedies || analysis.remedies).slice(0, 10);

  const gradeClass = (g) => {
    if (g >= 3) return 'g3';
    if (g === 2) return 'g2';
    if (g === 1) return 'g1';
    return '';
  };

  const rowsHtml = flatRubrics
    .map((rub) => {
      const src = cleanSource(rub.source);
      const chap = rub.chapter || '';
      const remCount = Array.isArray(rub.remedies) ? rub.remedies.length : 0;
      const cells = topCols
        .map((col) => {
          const found = (rub.remedies || []).find(
            (rm) => String(rm.name || '').toUpperCase() === String(col.name || '').toUpperCase()
          );
          const g = found && found.grade > 0 ? found.grade : 0;
          return `<td class="cell ${gradeClass(g)}">${g > 0 ? g : ''}</td>`;
        })
        .join('');

      return `
        <tr>
          <td class="rubric-col">
            <span class="tag">[${esc(src)}]</span>
            <span class="tag">[${esc(chap)}]</span>
            <span class="rubric-text">${esc(rub.rubric)}</span>
            <span class="count">(${remCount})</span>
          </td>
          ${cells}
        </tr>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Repertorisation Matrix Preview</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background: #f8fafc; color: #1e293b; }
  .topbar { background: #0284c7; color: #fff; padding: 14px 20px; font-size: 18px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
  .subbar { background: #0369a1; color: #e0f2fe; padding: 8px 20px; font-size: 14px; }
  .wrap { overflow-x: auto; background: #fff; }
  table { border-collapse: collapse; width: 100%; min-width: 920px; }
  th, td { border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 13px; }
  th { background: #f1f5f9; color: #0f172a; font-weight: 700; text-align: center; position: sticky; top: 0; }
  th.rubric-col, td.rubric-col { text-align: left; min-width: 340px; max-width: 440px; position: sticky; left: 0; background: #fff; z-index: 2; }
  th.rubric-col { background: #f1f5f9; color: #0284c7; z-index: 3; }
  .totality-row td { background: #f8fafc; color: #0284c7; font-weight: 700; text-align: center; }
  .totality-row td.rubric-col { text-align: left; color: #0284c7; }
  .tag { font-weight: 700; color: #0f172a; }
  .count { color: #64748b; font-weight: 600; }
  td.cell { text-align: center; font-weight: 700; width: 68px; }
  td.g3 { background: #fca5a5; color: #7f1d1d; }
  td.g2 { background: #fde047; color: #713f12; }
  td.g1 { background: #bbf7d0; color: #14532d; }
</style>
</head>
<body>
  <div class="topbar">
    <span>Repertorisation</span>
    <span>Symptoms: ${flatRubrics.length} &nbsp;|&nbsp; Remedies: ${analysis.remedies.length}</span>
  </div>
  <div class="subbar">
    Test Case: ${esc(syms.map((s) => s.value).join(' • '))}
  </div>
  <div class="wrap">
    <table>
      <thead>
        <tr>
          <th class="rubric-col">Remedy Name</th>
          ${topCols.map((c) => `<th>${esc(c.name)}</th>`).join('')}
        </tr>
        <tr class="totality-row">
          <td class="rubric-col">Totality / Symptom Covered</td>
          ${topCols.map((c) => `<td>${c.totalGrade ?? c.totalityScore ?? 0} / ${c.rubricsCovered ?? c.symptomsCovered ?? 0}</td>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const outPath = path.join(__dirname, 'repertorisation-preview.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Generated:', outPath);
})().catch((err) => {
  console.error('ERR:', err);
  process.exit(1);
});
