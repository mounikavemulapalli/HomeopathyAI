#!/usr/bin/env node
'use strict';

// READ-ONLY audit. Run from Backend root: node .\remedy_source_token_audit.cjs
// Reads source databases and remedyRegistry.json; writes reports only.
// Never joins split tokens or changes remedy mappings, grades, or scoring.

const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const DB_DIR = path.join(ROOT, 'database');
const REGISTRY_PATH = path.join(ROOT, 'data', 'remedyRegistry.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const DB_FILES = ['kent_master_db.json', 'bbcr_master_db.json', 'boger_master_db.json', 'clarke_master_db.json'];
const TARGETS = [
  'ANISUM STELLATUM','BISMUTHUM OXIDUM','CAINCA','CALTHA PALUSTRIS',
  'CETRARARIA ISLANDICA','CHENOPODIUM ANTHELMINTICUM','CITRUS LIMONUM',
  'COCAINUM MURIATICUM','CUPRUM NITRICUM','IRIS GERMANICA',
  'MAGNETIS POLI AMBO','PHASEOLUS NANUS','SOLANUM OLERACEUM',
  'STACHYS BETONICA','TANNINUM','TUSSILAGO FRAGRANS','ZINCUM CYANATUM'
];

function norm(s) {
  return String(s || '').replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[œŒ]/g, 'OE').replace(/[æÆ]/g, 'AE')
    .trim().toUpperCase().replace(/\s+/g, ' ');
}
function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}
function remedyList(r) {
  if (Array.isArray(r && r.remedies)) return r.remedies.map(x => ({name:String(x?.name || ''), grade:x?.grade}));
  if (r?.grading && typeof r.grading === 'object') return Object.entries(r.grading).map(([name,grade]) => ({name,grade}));
  if (r?.remedies && typeof r.remedies === 'object') return Object.entries(r.remedies).map(([name,grade]) => ({name,grade}));
  return [];
}
function main() {
  if (!fs.existsSync(REGISTRY_PATH)) throw new Error(`Registry not found: ${REGISTRY_PATH}. Run from Backend root.`);
  const regData = readJson(REGISTRY_PATH);
  const registry = Array.isArray(regData.remedies) ? regData.remedies : [];
  const regByName = new Map(registry.map(r => [norm(r.canonicalName), r]));
  const results = new Map(TARGETS.map(name => {
    const r = regByName.get(norm(name));
    return [name, {
      canonicalName:name, registryFound:!!r,
      registryAbbreviations:r?.abbreviations || [], registryAliases:r?.aliases || [],
      sourceTokenCounts:{}, exactOrAliasMatchCount:0, sampleMatches:[],
      status:'UNRESOLVED_REQUIRES_SOURCE_VERIFICATION'
    }];
  }));
  const incomplete = new Map();
  const sourceSummary = {};
  let totalRecords = 0;

  for (const file of DB_FILES) {
    const p = path.join(DB_DIR, file);
    if (!fs.existsSync(p)) {
      sourceSummary[file] = {exists:false, records:0};
      for (const item of results.values()) item.sourceTokenCounts[file] = {};
      continue;
    }
    const data = readJson(p);
    if (!Array.isArray(data)) throw new Error(`${file} is not a JSON array.`);
    totalRecords += data.length;
    const counts = new Map();
    const hitKeys = new Set();

    for (const record of data) {
      const remedies = remedyList(record);
      for (let i = 0; i < remedies.length; i++) {
        const remedy = remedies[i], raw = remedy.name.trim();
        if (!raw) continue;
        const key = norm(raw);
        counts.set(key, (counts.get(key) || 0) + 1);

        if (/[A-Z]-$/i.test(raw)) {
          const ikey = raw.toLowerCase();
          if (!incomplete.has(ikey)) incomplete.set(ikey, {token:raw, occurrences:0, examples:[]});
          const ent = incomplete.get(ikey);
          ent.occurrences++;
          if (ent.examples.length < 6) ent.examples.push({
            source:file, id:record.id || null, chapter:record.chapter || null,
            rubric:record.rubric || null, grade:remedy.grade,
            followingTokens:remedies.slice(i+1,i+4).map(x=>x.name)
          });
        }

        for (const item of results.values()) {
          const accepted = new Set([norm(item.canonicalName),
            ...item.registryAbbreviations.map(norm), ...item.registryAliases.map(norm)]);
          if (accepted.has(key)) {
            const unique = `${file}|${record.id || ''}|${raw}|${remedy.grade}`;
            if (!hitKeys.has(unique)) {
              hitKeys.add(unique);
              item.exactOrAliasMatchCount++;
              if (item.sampleMatches.length < 12) item.sampleMatches.push({
                source:file, id:record.id || null, chapter:record.chapter || null,
                rubric:record.rubric || null, token:raw, grade:remedy.grade
              });
            }
          }
        }
      }
    }
    sourceSummary[file] = {exists:true, records:data.length};
    for (const item of results.values()) {
      const keys = new Set([...item.registryAbbreviations, ...item.registryAliases].map(norm));
      item.sourceTokenCounts[file] = Object.fromEntries([...keys].map(k => [k, counts.get(k) || 0]));
    }
  }

  for (const item of results.values()) {
    if (item.exactOrAliasMatchCount > 0) item.status = 'SOURCE_TOKEN_MATCH_FOUND_REVIEW_IDENTITY';
  }
  const incompleteTop = [...incomplete.values()].sort((a,b)=>b.occurrences-a.occurrences).slice(0,250);
  const report = {
    reportType:'Read-only Remedy Source Token Audit',
    createdAt:new Date().toISOString(), projectRoot:ROOT,
    registryFile:path.relative(ROOT,REGISTRY_PATH), registryEntryCount:registry.length,
    sourceSummary, totalSourceRecordsAcrossFiles:totalRecords,
    targetResults:[...results.values()], incompleteTrailingHyphenTokensTop250:incompleteTop,
    safetyNotes:[
      'Read-only audit: source databases and remedyRegistry.json were not modified.',
      'Token counts are evidence for review, not approval of a canonical mapping.',
      'Following tokens are context only and are never automatically joined.',
      'No remedy grades, rubric scores, or scoring rules were changed.'
    ]
  };

  fs.mkdirSync(REPORT_DIR,{recursive:true});
  const jsonPath = path.join(REPORT_DIR,'remedy-source-token-audit.json');
  const mdPath = path.join(REPORT_DIR,'remedy-source-token-audit.md');
  fs.writeFileSync(jsonPath,JSON.stringify(report,null,2)+'\n','utf8');
  const md = [
    '# Read-only Remedy Source Token Audit','',
    `- Generated: ${report.createdAt}`,
    `- Registry entries: ${registry.length}`,
    `- Source records read: ${totalRecords}`,'',
    '## Target summary','',
    '| Remedy | Registry found | Exact/alias matches | Status |',
    '|---|---:|---:|---|',
    ...report.targetResults.map(x=>`| ${x.canonicalName} | ${x.registryFound?'Yes':'No'} | ${x.exactOrAliasMatchCount} | ${x.status} |`),
    '', '## Token counts by source',''
  ];
  for (const x of report.targetResults) {
    md.push(`### ${x.canonicalName}`);
    md.push(`- Abbreviations: ${x.registryAbbreviations.join(', ') || '(none)'}`);
    md.push(`- Aliases: ${x.registryAliases.join(', ') || '(none)'}`);
    for (const [file, counts] of Object.entries(x.sourceTokenCounts)) {
      md.push(`- ${file}: ${Object.entries(counts).map(([k,v])=>`${k}=${v}`).join(', ') || '(none)'}`);
    }
    for (const hit of x.sampleMatches.slice(0,5)) md.push(`- Match: ${hit.source} | ${hit.id || ''} | ${hit.rubric || ''} | ${hit.token} | grade ${hit.grade}`);
    md.push('');
  }
  md.push('## Incomplete tokens ending in hyphen (top 250)','',
    'Context only; no token joining or mapping was performed.','',
    '| Token | Count | Example source | Record | Rubric | Following tokens |',
    '|---|---:|---|---|---|---|');
  for (const x of incompleteTop) {
    const e=x.examples[0] || {};
    md.push(`| ${x.token} | ${x.occurrences} | ${e.source || ''} | ${e.id || ''} | ${e.rubric || ''} | ${(e.followingTokens || []).join(', ')} |`);
  }
  md.push('', '## Safety notes','',...report.safetyNotes.map(x=>`- ${x}`));
  fs.writeFileSync(mdPath,md.join('\n')+'\n','utf8');

  console.log('READ-ONLY AUDIT COMPLETE');
  console.log(`Registry entries: ${registry.length}`);
  console.log(`Source records read: ${totalRecords}`);
  console.log(`JSON report: ${path.relative(ROOT,jsonPath)}`);
  console.log(`Markdown report: ${path.relative(ROOT,mdPath)}`);
  console.log('\nTarget summary:');
  for (const x of report.targetResults) console.log(`${x.canonicalName}: ${x.status}; matches=${x.exactOrAliasMatchCount}`);
  console.log('\nNo source data, registry entries, grades, or scoring rules were changed.');
}
try { main(); } catch (e) { console.error('AUDIT FAILED:',e.message); process.exitCode=1; }
