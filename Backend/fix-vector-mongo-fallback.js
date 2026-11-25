const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "VectorSearchService.js");
let code = fs.readFileSync(filePath, "utf8");

// Remove any Mongoose model or dbService imports
code = code.replace(/^.*require\(["']\.\.\/models\/Rubric.*["']\);?\r?\n/gm, "");
code = code.replace(/^.*require\(["']\.\/dbService["']\);?\r?\n/gm, "");

// Auto-embed query locally if queryEmbedding is null/empty
const autoEmbedSnippet = `    // 2. Local Embedded Semantic Search
    let semanticMatches = [];
    try {
      let activeEmbedding = queryEmbedding;
      if (!Array.isArray(activeEmbedding) || activeEmbedding.length === 0) {
        activeEmbedding = await localVectorStoreService.embedQuery(
          cleanQuery || positiveQuery,
        );
      }
      if (Array.isArray(activeEmbedding) && activeEmbedding.length > 0) {
        const allowedChapters = Array.isArray(parsedQuery?.allowedChapters)
          ? parsedQuery.allowedChapters
          : undefined;
        semanticMatches = await localVectorStoreService.search(
          activeEmbedding,
          100,
          { allowedChapters },
        );
      }
    } catch (error) {
      console.error("❌ Local semantic search failed:", error.message);
    }`;

code = code.replace(
  /\/\/ 2\. Local Embedded Semantic Search[\s\S]*?console\.error\("❌ Local semantic search failed:", error\.message\);\s*\}/m,
  autoEmbedSnippet,
);

// Replace any remaining dbService or Rubric.find calls with local masterRepertory lookup
code = code.replace(
  /await Rubric\.find\([\s\S]*?\)\.lean\(\)/g,
  "(Array.isArray(global.masterRepertory) ? global.masterRepertory : [])",
);
code = code.replace(
  /await Rubric\.find\([\s\S]*?\)/g,
  "(Array.isArray(global.masterRepertory) ? global.masterRepertory : [])",
);

fs.writeFileSync(filePath, code, "utf8");
console.log("Patched VectorSearchService.js: removed Mongoose calls and enabled local query embedding.");
