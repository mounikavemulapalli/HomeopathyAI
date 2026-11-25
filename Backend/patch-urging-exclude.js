const fs = require("fs");
const path = require("path");

const previewPath = path.join(__dirname, "generate-matrix-preview.js");
let code = fs.readFileSync(previewPath, "utf8");

code = code.replace(
  "diarrh|rectum|navicular|cervical|coccyx|scapulae|abdomen|cold taken",
  "diarrh|rectum|navicular|cervical|coccyx|scapulae|abdomen|cold taken|urging in",
);

fs.writeFileSync(previewPath, code, "utf8");
console.log("Excluded unrelated 'urging in' general rubric from matrix preview.");
