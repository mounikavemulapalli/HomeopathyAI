const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "RepertoryEngine.js");
let code = fs.readFileSync(filePath, "utf8");

const extraWords = "|irritability|dullness|absorbed|impatience|impetuous|convulsion|warm room|copious flow|sleep\\s*,\\s*before|on abdomen|talking during|difficult > going to sleep";
if (code.includes("indisposition to play|laughing|playful") && !code.includes("irritability|dullness|absorbed")) {
  code = code.replace(
    "indisposition to play|laughing|playful)",
    "indisposition to play|laughing|playful" + extraWords + ")",
  );
  fs.writeFileSync(filePath, code, "utf8");
  console.log("Expanded analyzeCase noiseRegex for extra MIND/SLEEP rubrics.");
}
