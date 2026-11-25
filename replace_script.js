const fs = require('fs');

const filePath = 'c:\\Users\\bhanu\\Downloads\\HomeopathyAi\\Backend\\services\\physicianThinkingService.js';

let fileContent = fs.readFileSync(filePath, 'utf8');

fileContent = fileContent.replace(/CravingsInterpreter.interpret\(/g, 'this.cravingsInterpreter.interpret(');
fileContent = fileContent.replace(/AversionsInterpreter.interpret\(/g, 'this.aversionsInterpreter.interpret(');
fileContent = fileContent.replace(/ChiefComplaintsInterpreter.interpret\(/g, 'this.chiefComplaintsInterpreter.interpret(');

fs.writeFileSync(filePath, fileContent, 'utf8');

console.log('Replacements completed.');