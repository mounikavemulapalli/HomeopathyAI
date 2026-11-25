const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "RepertoryEngine.js");
let code = fs.readFileSync(filePath, "utf8");

const marker = "// [DEDUP_CROSS_SOURCE_RUBRICS]";
if (!code.includes(marker)) {
  const dedupSnippet = [
    "",
    "    " + marker,
    "    if (Array.isArray(selectedRubrics) && selectedRubrics.length > 1) {",
    "      const byNorm = new Map();",
    "      for (const r of selectedRubrics) {",
    "        if (!r) continue;",
    "        const normText = String(r.rubric || r.name || \"\")",
    "          .toLowerCase()",
    "          .replace(/[^a-z0-9]+/g, \" \")",
    "          .trim();",
    "        const key = normText ? normText : String(r.id);",
    "        const prev = byNorm.get(key);",
    "        const currRank = (Number(r.score) || 0) * 10 + (Number(r.grade) || Number(r.finalWeightedGrade) || 0);",
    "        const prevRank = prev ? ((Number(prev.score) || 0) * 10 + (Number(prev.grade) || Number(prev.finalWeightedGrade) || 0)) : -1;",
    "        if (!prev || currRank > prevRank) {",
    "          byNorm.set(key, r);",
    "        }",
    "      }",
    "      selectedRubrics = Array.from(byNorm.values());",
    "    }",
  ].join("\n");

  const re = /(async analyzeCase\([^)]*\)\s*\{)/;
  if (re.test(code)) {
    code = code.replace(re, "$1" + dedupSnippet);
    fs.writeFileSync(filePath, code, "utf8");
    console.log("Added cross-source rubric deduplication to analyzeCase.");
  } else {
    console.log("Could not locate analyzeCase signature.");
  }
} else {
  console.log("Cross-source deduplication already present.");
}
