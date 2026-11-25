const fs = require("fs");
const path = require("path");

// 1. Update _refineFinalRubrics in RepertoryEngine.js
const enginePath = path.join(__dirname, "services", "RepertoryEngine.js");
let engineCode = fs.readFileSync(enginePath, "utf8");

const startIdx = engineCode.indexOf("  _refineFinalRubrics(rubrics, symptomInput) {");
const endIdx = engineCode.indexOf("  async findIntelligentRubrics(");

if (startIdx !== -1 && endIdx !== -1) {
  const improvedHelper = [
    "  _refineFinalRubrics(rubrics, symptomInput) {",
    "    if (!Array.isArray(rubrics) || rubrics.length === 0) return rubrics || [];",
    "",
    "    const rawSymptomText =",
    '      typeof symptomInput === "string"',
    "        ? symptomInput",
    '        : String((symptomInput && (symptomInput.value || symptomInput.symptom)) || "");',
    "    const symLower = rawSymptomText.toLowerCase();",
    "",
    "    const wantsAmel = /\\b(better|amel\\.?|amelioration|relieved)\\b/i.test(symLower);",
    "    const wantsAgg = /\\b(worse|agg\\.?|aggravation)\\b/i.test(symLower);",
    "    const wantsRight = /\\bright\\b/i.test(symLower) && !/\\bleft\\b/i.test(symLower);",
    "    const wantsLeft = /\\bleft\\b/i.test(symLower) && !/\\bright\\b/i.test(symLower);",
    "",
    "    const stopWords = new Set([",
    '      "pain", "ache", "type", "of", "from", "to", "in", "on", "the", "a", "an",',
    '      "with", "and", "or", "for", "worse", "better", "agg", "amel", "region", "side"',
    "    ]);",
    "    const coreTokens = symLower",
    '      .replace(/[^a-z0-9]+/g, " ")',
    "      .trim()",
    '      .split(/\\s+/)',
    "      .filter((t) => t.length >= 4 && !stopWords.has(t));",
    "",
    "    let filtered = rubrics.filter((r) => {",
    '      const pathText = String((r && (r.path || r.rubric)) || "").toLowerCase();',
    '      const rubText = String((r && r.rubric) || "").toLowerCase();',
    '      const combined = pathText + " " + rubText;',
    "",
    "      // 1. Modality direction guard",
    "      if (wantsAmel && !wantsAgg) {",
    "        if (/(^|\\s|>\\s*)aggravation\\b/i.test(pathText) || /\\bagg\\.?\\s*$/i.test(rubText)) {",
    "          return false;",
    "        }",
    "      } else if (wantsAgg && !wantsAmel) {",
    "        if (/(^|\\s|>\\s*)amelioration\\b/i.test(pathText) || /\\bamel\\.?\\s*$/i.test(rubText)) {",
    "          return false;",
    "        }",
    "      }",
    "",
    "      // 2. Laterality guard",
    "      if (wantsRight && /\\bleft\\b/i.test(combined) && !/\\bright\\b/i.test(combined)) {",
    "        return false;",
    "      }",
    "      if (wantsLeft && /\\bright\\b/i.test(combined) && !/\\bleft\\b/i.test(combined)) {",
    "        return false;",
    "      }",
    "",
    "      // 3. Drop noisy Kent numbered fragment stubs like Leg_32 > right_2",
    "      if (/\\b[a-z]+_[0-9]+\\s*>\\s*(right|left)(_[0-9]+)?\\s*$/i.test(rubText)) {",
    "        return false;",
    "      }",
    "",
    "      // 4. Require at least one core symptom token match in rubric/path when core tokens exist",
    "      if (coreTokens.length > 0) {",
    "        const hasCoreMatch = coreTokens.some((tok) => combined.includes(tok.slice(0, 5)));",
    "        if (!hasCoreMatch) return false;",
    "      }",
    "",
    "      return true;",
    "    });",
    "",
    "    if (filtered.length === 0) {",
    "      filtered = rubrics.filter((r) => {",
    '        const combined = (String((r && r.path) || "") + " " + String((r && r.rubric) || "")).toLowerCase();',
    "        if (wantsRight && /\\bleft\\b/i.test(combined) && !/\\bright\\b/i.test(combined)) return false;",
    "        if (wantsLeft && /\\bright\\b/i.test(combined) && !/\\bleft\\b/i.test(combined)) return false;",
    "        return true;",
    "      });",
    "      if (filtered.length === 0) filtered = rubrics;",
    "    }",
    "",
    "    const deduped = new Map();",
    "    for (const r of filtered) {",
    '      const chap = String((r && r.chapter) || "").trim().toUpperCase();',
    '      const normRubric = String((r && r.rubric) || "")',
    "        .toLowerCase()",
    '        .replace(/[^a-z0-9]+/g, " ")',
    "        .trim();",
    '      const key = normRubric ? (chap + "::" + normRubric) : String(r && r.id);',
    "      const existing = deduped.get(key);",
    "      if (!existing || (Number(r && r.score) || 0) > (Number(existing && existing.score) || 0)) {",
    "        deduped.set(key, r);",
    "      }",
    "    }",
    "",
    "    return Array.from(deduped.values());",
    "  }",
    "\n",
  ].join("\n");

  engineCode = engineCode.slice(0, startIdx) + improvedHelper + engineCode.slice(endIdx);
  fs.writeFileSync(enginePath, engineCode, "utf8");
  console.log("Updated _refineFinalRubrics with fragment, laterality, and core-token guards.");
}

// 2. Also pass hybridHits through engine._refineFinalRubrics in generate-matrix-preview.js
const previewPath = path.join(__dirname, "generate-matrix-preview.js");
if (fs.existsSync(previewPath)) {
  let previewCode = fs.readFileSync(previewPath, "utf8");
  if (previewCode.includes("finals.push(hit);") && !previewCode.includes("engine._refineFinalRubrics(finals, s)")) {
    previewCode = previewCode.replace(
      "for (const rub of finals) {",
      "const refinedFinals = engine._refineFinalRubrics(finals, s);\n    for (const rub of refinedFinals) {",
    );
    fs.writeFileSync(previewPath, previewCode, "utf8");
    console.log("Wired _refineFinalRubrics on hybrid hits in generate-matrix-preview.js.");
  }
}
