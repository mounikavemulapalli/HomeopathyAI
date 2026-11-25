/** @format */

const fs = require("fs");
const path = require("path");
const RepertoryEngine = require("./services/RepertoryEngine");
const { computeLocalFallbackEmbedding } = require("./services/localVectorStoreService");

(async () => {
  const engine = new RepertoryEngine();
  await engine.init();

  const sourceList = Array.isArray(global.masterRepertory)
    ? global.masterRepertory
    : Array.isArray(engine.masterRepertory)
      ? engine.masterRepertory
      : [];

  if (!sourceList.length) {
    console.error("No masterRepertory entries found; aborting vector build.");
    process.exit(1);
  }

  const outDir = path.join(__dirname, "data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "rubric-vectors.json");
  const stream = fs.createWriteStream(outPath, { encoding: "utf8" });

  stream.write('{"version":1,"generatedAt":"' + new Date().toISOString() + '","entries":[');

  sourceList.forEach((item, idx) => {
    const id = item.id ?? idx + 1;
    const chapter = String(item.chapter || "").toUpperCase();
    const rubric = String(item.rubric || item.text || "");
    const embedText = chapter ? `${chapter} ${rubric}` : rubric;
    const record = JSON.stringify({
      id,
      chapter,
      rubric,
      embedding: computeLocalFallbackEmbedding(embedText),
    });
    stream.write((idx > 0 ? "," : "") + record);
  });

  stream.write("]}");
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end();
  });

  const stats = fs.statSync(outPath);
  console.log(`Generated ${sourceList.length} local rubric vectors (${(stats.size / (1024 * 1024)).toFixed(2)} MB) at ${outPath}`);
})().catch((err) => {
  console.error("Vector generation failed:", err);
  process.exit(1);
});
