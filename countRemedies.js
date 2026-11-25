const fs = require('fs');

const fileContent = fs.readFileSync('./Backend/services/thermalProfiles_v2.json', 'utf8');
const data = JSON.parse(fileContent);

const allRemedies = new Set();

for (const category of ["HOT", "CHILLY", "AMBITHERMAL"]) {
  for (const remedyType of ["strongRemedies", "moderateRemedies", "possibleRemedies"]) {
    data[category][remedyType].forEach(remedy => allRemedies.add(remedy));
  }
}

console.log(`Total unique remedies: ${allRemedies.size}`);