const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "services", "VectorSearchService.js");
let code = fs.readFileSync(filePath, "utf8");

const marker = "// [MODIFIER_TERM_BOOST]";
if (!code.includes(marker)) {
  const boostBlock = [
    "",
    "      " + marker,
    "      const modifierTerms = [",
    '        "bland", "acrid", "profuse", "scanty", "thick", "thin",',
    '        "milky", "yellow", "white", "greenish", "offensive", "clotted", "corrosive"',
    "      ];",
    "      for (const mod of modifierTerms) {",
    "        if (lowerQuery.includes(mod) && rubricText.includes(mod)) {",
    "          score += 0.35;",
    "          c.debug.modifierBoost = (c.debug.modifierBoost || 0) + 0.35;",
    "        }",
    "      }",
  ].join("\n");

  const anchor = "      // I. Exact Match Boost";
  if (code.includes(anchor)) {
    code = code.replace(anchor, boostBlock + "\n\n" + anchor);
    fs.writeFileSync(filePath, code, "utf8");
    console.log("Added modifier term boost to VectorSearchService.js");
  } else {
    console.log("Could not locate Exact Match Boost anchor.");
  }
} else {
  console.log("Modifier term boost already present.");
}
