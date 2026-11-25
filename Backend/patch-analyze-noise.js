const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "RepertoryEngine.js");
let code = fs.readFileSync(filePath, "utf8");

const marker = "// [ANALYZE_CASE_NOISE_CLEANUP]";
if (!code.includes(marker)) {
  const cleanupSnippet = [
    "",
    "    " + marker,
    "    if (Array.isArray(selectedRubrics) && selectedRubrics.length > 0) {",
    "      const noiseRegex = /\\b(testes|barking|delusions|delirium|arrested|knocking|knitting|admonition|coition|lochia|panting|rattling|sighing|catching|wakes tired|unrefreshing|larynx|begging|entreating|company aversion|color|mistake|cheerful|pregnant|christ|calculating|oppression|irregular|babbling|hesitating|sopor|indisposition to play|laughing|playful)\\b/i;",
    "      const stubRegex = /^(on|in|at|to|of|thirst|sweat|appetite|craving for|raving|discharge from|low down in|thirst and drinking|thirst with|sleep\\s*,\\s*before)$/i;",
    "      const filteredList = selectedRubrics.filter((r) => {",
    '        const rub = String((r && (r.rubric || r.name)) || "").trim();',
    '        const pathStr = String((r && r.path) || "").trim();',
    "        const combined = pathStr + \" \" + rub;",
    "        const rubLower = rub.toLowerCase();",
    "        if (rub.length <= 4) return false;",
    "        if (stubRegex.test(rubLower)) return false;",
    "        if (/_[0-9]+\\b/.test(rubLower)) return false;",
    "        if (noiseRegex.test(combined)) return false;",
    "        return true;",
    "      });",
    "      if (filteredList.length > 0) {",
    "        selectedRubrics = filteredList;",
    "      }",
    "    }",
  ].join("\n");

  const dedupEnd = "      selectedRubrics = Array.from(byNorm.values());\n    }";
  if (code.includes(dedupEnd)) {
    code = code.replace(dedupEnd, dedupEnd + cleanupSnippet);
    fs.writeFileSync(filePath, code, "utf8");
    console.log("Added analyzeCase noise/stub/fragment cleanup.");
  } else {
    const analyzeRe = /(async analyzeCase\([^)]*\)\s*\{)/;
    code = code.replace(analyzeRe, "$1" + cleanupSnippet);
    fs.writeFileSync(filePath, code, "utf8");
    console.log("Added analyzeCase noise cleanup at entry.");
  }
}
