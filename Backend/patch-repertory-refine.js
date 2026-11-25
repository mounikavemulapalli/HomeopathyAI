const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "RepertoryEngine.js");
let code = fs.readFileSync(filePath, "utf8");

if (!code.includes("_refineFinalRubrics(")) {
  const helperCode = [
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
    "    let filtered = rubrics.filter((r) => {",
    '      const pathText = String((r && (r.path || r.rubric)) || "").toLowerCase();',
    '      const rubText = String((r && r.rubric) || "").toLowerCase();',
    "",
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
    "      if (wantsRight) {",
    "        if (/\\bleft\\b/i.test(rubText) && !/\\bright\\b/i.test(rubText)) {",
    "          return false;",
    "        }",
    "      } else if (wantsLeft) {",
    "        if (/\\bright\\b/i.test(rubText) && !/\\bleft\\b/i.test(rubText)) {",
    "          return false;",
    "        }",
    "      }",
    "",
    "      return true;",
    "    });",
    "",
    "    if (filtered.length === 0) {",
    "      filtered = rubrics;",
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
    "",
  ].join("\n");

  const targetAnchor = "  async findIntelligentRubrics(";
  if (code.includes(targetAnchor)) {
    code = code.replace(targetAnchor, helperCode + targetAnchor);
  }
}

const assignLine = "symptomResult.rubrics.finalRubrics = finalRubrics;";
if (code.includes(assignLine) && !code.includes("finalRubrics = this._refineFinalRubrics(finalRubrics, symptom);")) {
  code = code.replace(
    assignLine,
    "finalRubrics = this._refineFinalRubrics(finalRubrics, symptom);\n        " + assignLine,
  );
}

fs.writeFileSync(filePath, code, "utf8");
console.log("Updated RepertoryEngine.js successfully.");
