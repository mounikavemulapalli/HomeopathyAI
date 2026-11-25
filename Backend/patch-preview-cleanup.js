const fs = require("fs");
const path = require("path");

const previewPath = path.join(__dirname, "generate-matrix-preview.js");
let code = fs.readFileSync(previewPath, "utf8");

const marker = "// [CASE_LEVEL_MATRIX_CLEANUP]";
if (!code.includes(marker)) {
  const cleanupBlock = [
    "",
    "  " + marker,
    "  const allCaseText = syms.map((x) => String(x && x.value || \"\")).join(\" \").toLowerCase();",
    "  const caseRight = /\\bright\\b/.test(allCaseText) && !/\\bleft\\b/.test(allCaseText);",
    "  const caseLeft = /\\bleft\\b/.test(allCaseText) && !/\\bright\\b/.test(allCaseText);",
    "  const caseTokens = Array.from(new Set(",
    "    allCaseText",
    "      .replace(/[^a-z0-9]+/g, \" \")",
    "      .trim()",
    "      .split(/\\s+/)",
    "      .filter((t) => t.length >= 4 && ![\"pain\", \"type\", \"from\", \"worse\", \"better\"].includes(t))",
    "  ));",
    "  const cleanedUniqueRubrics = uniqueRubrics.filter((r) => {",
    "    const txt = (String((r && r.path) || \"\") + \" \" + String((r && r.rubric) || \"\")).toLowerCase();",
    "    if (caseRight && /\\bleft\\b/.test(txt) && !/\\bright\\b/.test(txt)) return false;",
    "    if (caseLeft && /\\bright\\b/.test(txt) && !/\\bleft\\b/.test(txt)) return false;",
    "    if (/\\b[a-z]+_[0-9]+\\s*>/.test(String((r && r.rubric) || \"\").toLowerCase())) return false;",
    "    if (/\\b(diarrh|rectum|navicular|cervical|coccyx|scapulae|abdomen|cold taken)\\b/.test(txt)) return false;",
    "    return caseTokens.some((tok) => txt.includes(tok.slice(0, 5)));",
    "  });",
    "  const finalMatrixRubrics = cleanedUniqueRubrics.length > 0 ? cleanedUniqueRubrics : uniqueRubrics;",
  ].join("\n");

  code = code.replace(
    "const analysis = await engine.analyzeCase(uniqueRubrics);",
    cleanupBlock + "\n  const analysis = await engine.analyzeCase(finalMatrixRubrics);",
  );
  code = code.replace(/uniqueRubrics/g, (m, offset) => {
    const before = code.slice(0, offset);
    return before.includes(marker) ? "finalMatrixRubrics" : m;
  });

  fs.writeFileSync(previewPath, code, "utf8");
  console.log("Added case-level matrix cleanup to generate-matrix-preview.js");
}
