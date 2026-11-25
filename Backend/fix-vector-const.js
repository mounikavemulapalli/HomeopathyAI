const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "VectorSearchService.js");
let code = fs.readFileSync(filePath, "utf8");

const badAssign = "      finalResult = Array.from(seenRubricText.values());\n    }\n\n    return finalResult;";
const goodReturn = "      const dedupedFinalResult = Array.from(seenRubricText.values());\n      return dedupedFinalResult;\n    }\n\n    return finalResult;";

if (code.includes(badAssign)) {
  code = code.replace(badAssign, goodReturn);
  fs.writeFileSync(filePath, code, "utf8");
  console.log("Fixed const assignment in VectorSearchService.js");
} else {
  code = code.replace(/finalResult = Array\.from\(seenRubricText\.values\(\)\);/g, "const dedupedFinalResult = Array.from(seenRubricText.values());");
  code = code.replace(/return finalResult;\s*$/m, "return typeof dedupedFinalResult !== \"undefined\" ? dedupedFinalResult : finalResult;");
  fs.writeFileSync(filePath, code, "utf8");
  console.log("Applied fallback const fix in VectorSearchService.js");
}
