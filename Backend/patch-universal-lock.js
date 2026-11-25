const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "RepertoryEngine.js");
let code = fs.readFileSync(filePath, "utf8");

const marker = "// [UNIVERSAL_CHAPTER_LOCK_AND_CLEAN_SEARCH]";
if (!code.includes(marker)) {
  const helperBlock = [
    "",
    "  " + marker,
    "  _getLockedChaptersForSymptom(symptomInput, interp = {}) {",
    "    const rawText =",
    '      typeof symptomInput === "string"',
    "        ? symptomInput",
    '        : String((symptomInput && (symptomInput.value || symptomInput.symptom)) || "");',
    "    const lower = rawText.toLowerCase();",
    "",
    "    if (Array.isArray(interp && interp.allowedChapters) && interp.allowedChapters.length > 0) {",
    "      return interp.allowedChapters.map((c) => String(c).toUpperCase());",
    "    }",
    "    if (interp && interp.primaryChapter) {",
    "      return [String(interp.primaryChapter).toUpperCase()];",
    "    }",
    "",
    "    if (/\\b(leucorrh|menses|menstrual|vagina|uterus|ovary|female|discharge)\\b/i.test(lower)) {",
    '      return ["GENITALIA FEMALE", "CLINICAL_FEMALE_NEW_ADDED", "CLINICAL_CLARKE_FEMALE_NEW_ADDED"];',
    "    }",
    "    if (/\\b(back|lumbar|sciatic|spine|coccyx|cervical|scapulae)\\b/i.test(lower)) {",
    '      return ["BACK", "CLINICAL_CLARKE_SCIATICA_BACKRADIATION", "EXTREMITIES"];',
    "    }",
    "    if (/\\b(sleep|dream|ghost)\\b/i.test(lower)) {",
    '      return ["SLEEP", "CLINICAL_CLARKE_SLEEP", "CLINICAL_CLARKE_MIND_SYMPTOMS"];',
    "    }",
    "    if (/\\b(sweat|perspir)\\b/i.test(lower)) {",
    '      return ["PERSPIRATION"];',
    "    }",
    "    return null;",
    "  }",
    "",
    "  _applyChapterLockAndClean(rubrics, symptomInput, interp = {}) {",
    "    if (!Array.isArray(rubrics) || rubrics.length === 0) return [];",
    "    const lockedChapters = this._getLockedChaptersForSymptom(symptomInput, interp);",
    "    const rawText =",
    '      typeof symptomInput === "string"',
    "        ? symptomInput",
    '        : String((symptomInput && (symptomInput.value || symptomInput.symptom)) || "");',
    "    const symLower = rawText.toLowerCase();",
    "",
    "    const baseNoise = /\\b(testes|barking|delusions|delirium|arrested|knocking|knitting|admonition|coition|lochia|panting|rattling|sighing|catching|wakes tired|unrefreshing|larynx|begging|entreating|company aversion|color|mistake|cheerful|pregnant|christ|calculating|oppression|irregular|babbling|hesitating|sopor|indisposition to play|laughing|playful|irritability|dullness|absorbed|impatience|impetuous|convulsion|warm room|copious flow)\\b/i;",
    "    const stubRegex = /^(on|in|at|to|of|thirst|sweat|appetite|craving for|raving|discharge from|low down in|thirst and drinking|thirst with|sleep\\s*,\\s*before|sleep\\s*,\\s*position\\s*,\\s*on\\s*abdomen\\s*,\\s*amel\\.?|sleep\\s*,\\s*talking\\s*during|sleep\\s*,\\s*difficult\\s*>\\s*going\\s*to\\s*sleep)$/i;",
    "",
    "    let list = rubrics.filter((r) => {",
    '      const chap = String((r && r.chapter) || "").toUpperCase();',
    '      const rub = String((r && (r.rubric || r.name)) || "").trim();',
    '      const pth = String((r && r.path) || "").trim();',
    "      const combined = (pth + \" \" + rub).toLowerCase();",
    "      const rubLower = rub.toLowerCase();",
    "",
    "      if (Array.isArray(lockedChapters) && lockedChapters.length > 0 && chap) {",
    "        if (!lockedChapters.includes(chap)) return false;",
    "      }",
    "",
    "      if (rub.length <= 4) return false;",
    "      if (stubRegex.test(rubLower)) return false;",
    "      if (/_[0-9]+\\b/.test(rubLower)) return false;",
    "      if (baseNoise.test(combined)) return false;",
    "",
    "      if (/\\brefresh\\b/i.test(symLower) && !/\\bunrefresh\\b/i.test(symLower) && /\\bunrefresh\\b/i.test(combined)) {",
    "        return false;",
    "      }",
    "",
    "      return true;",
    "    });",
    "",
    "    const seen = new Map();",
    "    for (const r of list) {",
    '      const chap = String((r && r.chapter) || "").trim().toUpperCase();',
    '      const norm = String((r && r.rubric) || "")',
    "        .toLowerCase()",
    '        .replace(/[^a-z0-9]+/g, " ")',
    "        .trim();",
    '      const key = norm ? (chap + "::" + norm) : String(r && r.id);',
    "      const prev = seen.get(key);",
    "      if (!prev || (Number(r && r.score) || 0) > (Number(prev && prev.score) || 0)) {",
    "        seen.set(key, r);",
    "      }",
    "    }",
    "    return Array.from(seen.values());",
    "  }",
  ].join("\n");

  const anchor = "  async analyzeCase(";
  if (code.includes(anchor)) {
    code = code.replace(anchor, helperBlock + "\n\n" + anchor);
    code = code.replace(
      "      if (filteredList.length > 0) {\n        selectedRubrics = filteredList;\n      }",
      "      selectedRubrics = this._applyChapterLockAndClean(filteredList.length > 0 ? filteredList : selectedRubrics, \"\");",
    );
    fs.writeFileSync(filePath, code, "utf8");
    console.log("Added universal chapter-lock and clean helper to RepertoryEngine.js");
  }
}
