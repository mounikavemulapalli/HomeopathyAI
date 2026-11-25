const fs = require("fs");

const physicianPath = "./services/physicianThinkingService.js";
const enginePath = "./services/RepertoryEngine.js";

let physician = fs.readFileSync(physicianPath, "utf8");
let engine = fs.readFileSync(enginePath, "utf8");

const chapterAnchor = "  _getAllChapters() {";
const inferenceAnchor =
    "const clinicalIntelligence = physicianThinkingService.inferClinicalMeaning(symptom);";

function countOccurrences(source, target) {
    return source.split(target).length - 1;
}

if (countOccurrences(physician, chapterAnchor) !== 1) {
    throw new Error("PhysicianThinkingService anchor mismatch. No files modified.");
}

if (countOccurrences(engine, inferenceAnchor) !== 1) {
    throw new Error("RepertoryEngine anchor mismatch. No files modified.");
}

const method = `  async inferChapterWithLocalLLM(symptomInput) {
    const symptomValue =
      typeof symptomInput === "object" && symptomInput !== null
        ? symptomInput.value
        : symptomInput;

    if (typeof symptomValue !== "string" || !symptomValue.trim()) {
      return null;
    }

    const cacheKey = symptomValue.trim().toLowerCase().replace(/\\s+/g, " ");

    if (!this._localLLMCache) {
      this._localLLMCache = new Map();
    }

    if (this._localLLMCache.has(cacheKey)) {
      return this._localLLMCache.get(cacheKey);
    }

    const chapters = this._getAllChapters();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const prompt = [
      "You are a repertory chapter classification assistant.",
      "Choose the chapter directly matching the symptom.",
      "Do not infer a cause or a different organ.",
      "Examples: vertigo -> VERTIGO; ear pain -> EAR; eye pain -> EYE; skin eruption -> SKIN; anxiety -> MIND.",
      "Return exactly one chapter name from this allowlist:",
      chapters.join(", "),
      "Symptom: " + symptomValue.trim(),
      "Return only the exact chapter name."
    ].join("\\n");

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5:3b",
          prompt,
          stream: false,
          options: {
            temperature: 0,
            num_predict: 16
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const output = String(data.response || "")
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim()
        .toUpperCase();

      const chapter = chapters.find(
        candidate => candidate.toUpperCase() === output
      );

      if (!chapter) {
        console.warn("[LOCAL LLM] Rejected invalid chapter output:", output);
        return null;
      }

      this._localLLMCache.set(cacheKey, chapter);
      return chapter;
    } catch (error) {
      console.warn(
        "[LOCAL LLM] Classification unavailable:",
        error.name === "AbortError" ? "timeout" : error.message
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

`;

const engineReplacement = `const clinicalIntelligence = physicianThinkingService.inferClinicalMeaning(symptom);

            if (
                clinicalIntelligence &&
                (
                    clinicalIntelligence.detectedClinicalField === "UNKNOWN" ||
                    Number(clinicalIntelligence.confidence) < 0.5
                )
            ) {
                const llmChapter =
                    await physicianThinkingService.inferChapterWithLocalLLM(symptom);

                if (
                    llmChapter &&
                    clinicalIntelligence.chapterCandidates &&
                    typeof clinicalIntelligence.chapterCandidates === "object"
                ) {
                    clinicalIntelligence.chapterCandidates[llmChapter] =
                        Math.max(
                            clinicalIntelligence.chapterCandidates[llmChapter] || 0,
                            0.75
                        );

                    console.log(
                        "[LOCAL LLM CHAPTER]",
                        String(typeof symptom === "object" ? symptom.value : symptom),
                        "->",
                        llmChapter
                    );
                }
            }`;

physician = physician.replace(chapterAnchor, method + chapterAnchor);
engine = engine.replace(inferenceAnchor, engineReplacement);

fs.writeFileSync(physicianPath, physician, "utf8");
fs.writeFileSync(enginePath, engine, "utf8");

console.log("PATCH APPLIED: Local Qwen chapter fallback added.");
console.log("Modified only:");
console.log(physicianPath);
console.log(enginePath);
