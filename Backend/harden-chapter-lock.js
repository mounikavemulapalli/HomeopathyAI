const fs = require("fs");
const path = require("path");

const enginePath = path.join(__dirname, "services", "RepertoryEngine.js");
let code = fs.readFileSync(enginePath, "utf8");

const oldCall = "          const cleaned = this._applyChapterLockAndClean(entry.rubrics.finalRubrics, symptom, interp);\n          entry.rubrics.finalRubrics = cleaned;";
const safeCall = [
  "          try {",
  "            const cleaned = this._applyChapterLockAndClean(entry.rubrics.finalRubrics, symptom, interp);",
  "            if (Array.isArray(cleaned) && cleaned.length > 0) {",
  "              entry.rubrics.finalRubrics = cleaned;",
  "            }",
  "          } catch (cleanErr) {",
  '            console.warn("[CHAPTER_LOCK_SAFE_SKIP]:", cleanErr && cleanErr.message ? cleanErr.message : cleanErr);',
  "          }",
].join("\n");

if (code.includes(oldCall)) {
  code = code.replace(oldCall, safeCall);
}

const fnStart = code.indexOf("  _applyChapterLockAndClean(rubrics, symptomInput, interp = {}) {");
const nextFn = code.indexOf("\n  async analyzeCase(", fnStart);
if (fnStart !== -1 && nextFn !== -1) {
  const safeMethod = [
    "  _applyChapterLockAndClean(rubrics, symptomInput, interp = {}) {",
    "    if (!Array.isArray(rubrics) || rubrics.length === 0) return [];",
    "    try {",
    "      const lockedChapters = this._getLockedChaptersForSymptom(symptomInput, interp);",
    "      const dedup = (arr) => {",
    "        const seen = new Map();",
    "        for (const r of arr) {",
    '          const chap = String((r && r.chapter) || "").trim().toUpperCase();',
    '          const norm = String((r && (r.rubric || r.name)) || "")',
    "            .toLowerCase()",
    '            .replace(/[^a-z0-9]+/g, " ")',
    "            .trim();",
    '          const key = norm ? (chap + "::" + norm) : String(r && r.id);',
    "          const prev = seen.get(key);",
    "          if (!prev || (Number(r && r.score) || 0) > (Number(prev && prev.score) || 0)) {",
    "            seen.set(key, r);",
    "          }",
    "        }",
    "        return Array.from(seen.values());",
    "      };",
    "      const strictFiltered = rubrics.filter((r) => {",
    '        const chap = String((r && r.chapter) || "").toUpperCase();',
    '        const rub = String((r && (r.rubric || r.name)) || "").trim();',
    "        const rubLower = rub.toLowerCase();",
    "        if (rub.length <= 2) return false;",
    '        if (/^(on|in|at|to|of|by|for|and|or)$/i.test(rubLower)) return false;',
    "        if (/\\btestes\\b/i.test(rubLower)) return false;",
    "        if (Array.isArray(lockedChapters) && lockedChapters.length > 0 && chap) {",
    "          const matchesLock = lockedChapters.some((lc) => chap.includes(lc) || lc.includes(chap));",
    "          if (!matchesLock) return false;",
    "        }",
    "        return true;",
    "      });",
    "      const cleanedStrict = dedup(strictFiltered);",
    "      if (cleanedStrict.length > 0) return cleanedStrict;",
    "      const fallback = dedup(rubrics.filter((r) => String((r && (r.rubric || r.name)) || '').trim().length > 2));",
    "      return fallback.length > 0 ? fallback.slice(0, 10) : rubrics;",
    "    } catch (_) {",
    "      return rubrics;",
    "    }",
    "  }",
  ].join("\n");

  code = code.slice(0, fnStart) + safeMethod + code.slice(nextFn);
}

fs.writeFileSync(enginePath, code, "utf8");
console.log("Hardened _applyChapterLockAndClean with try/catch.");
