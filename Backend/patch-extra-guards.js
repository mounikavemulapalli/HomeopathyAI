const fs = require("fs");
const path = require("path");

const enginePath = path.join(__dirname, "services", "RepertoryEngine.js");
let code = fs.readFileSync(enginePath, "utf8");

const marker = "// [EXTRA_CASE_NOISE_GUARDS]";
if (!code.includes(marker)) {
  const extraGuards = [
    "",
    "      " + marker,
    "      const trimmedRub = rubText.trim();",
    "      if (trimmedRub.length <= 3) return false;",
    "      if (/\\b(testes|barking)\\b/i.test(combined)) return false;",
    "      if (/\\brefresh\\b/i.test(symLower) && !/\\bunrefresh\\b/i.test(symLower) && /\\bunrefresh\\b/i.test(combined)) {",
    "        return false;",
    "      }",
    "      if (/\\bconstipat/i.test(symLower) && /\\bcheerful\\b/i.test(combined)) {",
    "        return false;",
    "      }",
  ].join("\n");

  const target = "      return true;\n    });";
  if (code.includes(target)) {
    code = code.replace(target, extraGuards + "\n\n" + target);
    fs.writeFileSync(enginePath, code, "utf8");
    console.log("Added extra noise/opposite-sleep/gender guards to _refineFinalRubrics.");
  }
}
