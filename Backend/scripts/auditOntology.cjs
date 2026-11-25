const fs = require("fs");
const path = require("path");
const process = require("process");

function auditOntology() {
    const startTime = process.hrtime.bigint();
    const ontologyFilePath = path.join(__dirname, "..", "services", "clinicalOntologyData.json");

    let clinicalOntology = {};
    let rawData = "";

    try {
        rawData = fs.readFileSync(ontologyFilePath, "utf8");
        clinicalOntology = JSON.parse(rawData);
    } catch (error) {
        console.error(`Error loading clinical ontology: ${error.message}`);
        process.exit(1);
    }

    const loadEndTime = process.hrtime.bigint();
    const startupLoadTimeMs = Number(loadEndTime - startTime) / 1_000_000;

    // 1. File size
    const fileSizeBytes = fs.statSync(ontologyFilePath).size;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    let totalOntologyEntries = 0; // Each canonical concept is an entry
    const canonicalConceptsSeen = new Set(); // To track unique canonical concepts
    const duplicateCanonicalConcepts = new Set(); // To track canonical concepts that appear more than once
    let duplicateSynonymsCount = 0;
    const allSynonyms = new Set();
    let totalChapters = 0;
    const conceptsPerChapter = {};

    for (const chapterName in clinicalOntology) {
        totalChapters++;
        const chapterConcepts = clinicalOntology[chapterName];
        conceptsPerChapter[chapterName] = 0;

        for (const canonicalName in chapterConcepts) {
            totalOntologyEntries++;
            conceptsPerChapter[chapterName]++;

            const lowerCanonicalName = canonicalName.toLowerCase();
            if (canonicalConceptsSeen.has(lowerCanonicalName)) {
                duplicateCanonicalConcepts.add(lowerCanonicalName);
            }
            canonicalConceptsSeen.add(lowerCanonicalName);
            
            const entry = chapterConcepts[canonicalName];
            const termsToCheck = [
                ...(entry.commonMedicalSynonyms || []),
                ...(entry.clinicalSynonyms || []),
                ...(entry.diseaseAliases || []),
                ...(entry.commonAbbreviations || []),
            ];

            for (const term of termsToCheck) {
                const lowerTerm = term.toLowerCase();
                if (allSynonyms.has(lowerTerm)) {
                    duplicateSynonymsCount++;
                } else {
                    allSynonyms.add(lowerTerm);
                }
            }
        }
    }

    // Approximate memory usage
    // This is a very rough approximation, as Node.js process memory can fluctuate.
    // We will use process.memoryUsage().rss for a snapshot of Resident Set Size.
    const memoryUsageBeforeParsing = process.memoryUsage().rss; // Resident Set Size in bytes

    // Force garbage collection to get a more accurate post-load memory usage, though not guaranteed
    if (global.gc) {
        global.gc();
    }
    const memoryUsageAfterLoading = process.memoryUsage().rss;

    // The memory used by the loaded object itself is hard to isolate precisely.
    // We can consider the difference from before loading to after loading as an approximation
    // Or, more simply, report the RSS after the ontology is loaded.
    const approximateMemoryUsageMB = (memoryUsageAfterLoading / (1024 * 1024));

    console.log(`\n--- Clinical Ontology Audit ---`);
    console.log(`Total ontology entries: ${totalOntologyEntries}`);
    console.log(`Total unique canonical concepts: ${canonicalConceptsSeen.size}`);
    console.log(`Duplicate canonical concepts: ${duplicateCanonicalConcepts.size}`);
    console.log(`Duplicate synonyms: ${duplicateSynonymsCount}`);
    console.log(`Total chapters: ${totalChapters}`);
    console.log(`Concepts per chapter:`);
    for (const chapter in conceptsPerChapter) {
        console.log(`  - ${chapter}: ${conceptsPerChapter[chapter]}`);
    }
    console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);
    console.log(`Startup load time: ${startupLoadTimeMs.toFixed(2)} ms`);
    console.log(`Approximate memory usage: ${approximateMemoryUsageMB.toFixed(2)} MB`);
    console.log(`-----------------------------`);

    process.exit(0);
}

auditOntology();
