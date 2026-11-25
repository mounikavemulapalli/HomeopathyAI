const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "RepertoryEngine.js");
let code = fs.readFileSync(filePath, "utf8");

const marker = "// [SUGGESTION_CHAPTER_LOCK_FILTER]";
if (!code.includes(marker)) {
  const hookBlock = [
    "",
    "    " + marker,
    "    if (Array.isArray(allResults) && allResults.length > 0 && typeof this._applyChapterLockAndClean === \"function\") {",
    "      for (const entry of allResults) {",
    "        if (entry && entry.rubrics && Array.isArray(entry.rubrics.finalRubrics)) {",
    "          const cleaned = this._applyChapterLockAndClean(entry.rubrics.finalRubrics, symptom, interp);",
    "          entry.rubrics.finalRubrics = cleaned;",
    "        }",
    "      }",
    "    }",
    "",
    "    return allResults;",
  ].join("\n");

  const targetReturn = "    return allResults;";
  if (code.includes(targetReturn)) {
    code = code.replace(targetReturn, hookBlock);
    fs.writeFileSync(filePath, code, "utf8");
    console.log("Successfully wired _applyChapterLockAndClean before return allResults.");
  } else {
    console.log("Could not locate return allResults.");
  }
} else {
  console.log("Suggestion chapter-lock filter already wired.");
}
