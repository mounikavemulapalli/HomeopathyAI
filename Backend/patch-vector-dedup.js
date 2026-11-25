const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "VectorSearchService.js");
let code = fs.readFileSync(filePath, "utf8");

const marker = "// [DEDUP_HYBRID_BY_RUBRIC_TEXT]";
if (!code.includes(marker)) {
  const dedupBlock = [
    "",
    "    " + marker,
    "    if (Array.isArray(finalResult) && finalResult.length > 1) {",
    "      const seenRubricText = new Map();",
    "      for (const item of finalResult) {",
    '        const normKey = String((item && item.rubric) || "")',
    "          .toLowerCase()",
    '          .replace(/[^a-z0-9]+/g, " ")',
    "          .trim();",
    "        if (!normKey) continue;",
    "        const prev = seenRubricText.get(normKey);",
    "        const currScore = Number(item && item.finalScore) || 0;",
    "        const prevScore = Number(prev && prev.finalScore) || 0;",
    "        if (!prev || currScore > prevScore) {",
    "          seenRubricText.set(normKey, item);",
    "        }",
    "      }",
    "      finalResult = Array.from(seenRubricText.values());",
    "    }",
    "",
    "    return finalResult;",
  ].join("\n");

  const targetReturn = "    return finalResult;";
  if (code.includes(targetReturn)) {
    code = code.replace(targetReturn, dedupBlock);
    fs.writeFileSync(filePath, code, "utf8");
    console.log("Added hybrid result deduplication before return finalResult.");
  } else {
    console.log("Could not locate return finalResult.");
  }
} else {
  console.log("Hybrid deduplication already present.");
}
