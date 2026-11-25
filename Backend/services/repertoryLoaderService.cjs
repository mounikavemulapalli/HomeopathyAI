const fs = require('fs');
const path = require('path');
const { normalizeRepertoryGrade } = require('./gradeNormalizationService.cjs'); // Import the new normalization function

const REPERTORY_DB_PATH = path.join(__dirname, '..', 'database');
const REMEDY_DATA_PATH = path.join(__dirname, '..', 'data', 'remedyAbbreviations.json');
const REMEDY_EXPLANATION_PATH = path.join(__dirname, '..', 'utils', 'brain', 'remedyExplanation.json');
const REMEDY_REGISTRY_PATH = path.join(__dirname, '..', 'data', 'remedyRegistry.json');

const debugMode = process.env.DEBUG_REPERTORY_NORMALIZATION === 'true';
function normalizeRemedyKey(name) {
    return String(name || '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[œŒ]/g, 'OE')
        .replace(/[æÆ]/g, 'AE')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ');
}

let normalizedKnownRemedyAbbreviations = new Set(); // To store VALID canonical normalized remedy names
const remedyAliasToCanonicalMap = new Map(); // Maps normalized alias to normalized canonical name

// Unified structure:
// {
//   id,
//   chapter,
//   rubric,
//   path,
//   remedies, // Array of { name, grade }
//   source,
//   miasm,
//   notes,
//   priority_weight
// }

function normalizeRubric(rubricData, sourceFile) {
    let remedies = [];
    const originalRemedies = []; // To store remedies before filtering
    const rejectedTokens = [];   // To store tokens that were not recognized as remedies

    if (rubricData.grading) {
        for (const remedyName in rubricData.grading) {
            originalRemedies.push({ name: remedyName, grade: rubricData.grading[remedyName] });
            const normalizedRemedyKey = normalizeRemedyKey(remedyName);
            const canonicalRemedyKey = remedyAliasToCanonicalMap.get(normalizedRemedyKey);
            if (canonicalRemedyKey) {
                remedies.push({
                    name: remedyName,
                    grade: rubricData.grading[remedyName],
                    normalizedGrade: normalizeRepertoryGrade(rubricData.grading[remedyName], sourceFile),
                    canonical: canonicalRemedyKey
                });
            } else {
                rejectedTokens.push(remedyName);
            }
        }
    } else if (Array.isArray(rubricData.remedies)) {
        rubricData.remedies.forEach(r => {
            originalRemedies.push({ name: r.name, grade: r.grade });
            const normalizedRemedyKey = normalizeRemedyKey(r.name);
            const canonicalRemedyKey = remedyAliasToCanonicalMap.get(normalizedRemedyKey);
            if (r.name && canonicalRemedyKey) {
                remedies.push({
                    name: r.name,
                    grade: r.grade,
                    normalizedGrade: normalizeRepertoryGrade(r.grade, sourceFile),
                    canonical: canonicalRemedyKey
                });
            } else {
                if (r.name) rejectedTokens.push(r.name);
            }
        });
    } else if (rubricData.remedies && typeof rubricData.remedies === 'object') { // NEW: Handle remedies as an object
        for (const remedyName in rubricData.remedies) {
            originalRemedies.push({ name: remedyName, grade: rubricData.remedies[remedyName] });
            const normalizedRemedyKey = normalizeRemedyKey(remedyName);
            const canonicalRemedyKey = remedyAliasToCanonicalMap.get(normalizedRemedyKey);
            if (canonicalRemedyKey) {
                remedies.push({
                    name: remedyName,
                    grade: rubricData.remedies[remedyName],
                    normalizedGrade: normalizeRepertoryGrade(rubricData.remedies[remedyName], sourceFile),
                    canonical: canonicalRemedyKey
                });
            } else {
                rejectedTokens.push(remedyName);
            }
        }
    }

    if (debugMode) {
        console.log(`Rubric: ${rubricData.rubric}`);
        console.log(`Original remedy count: ${originalRemedies.length}`);
        console.log(`Accepted remedy count: ${remedies.length}`);
        console.log(`Accepted remedies: ${JSON.stringify(remedies.map(r => r.name))}`);
        console.log(`Rejected tokens: ${JSON.stringify(rejectedTokens)}`);
    }

    // Attempt to derive chapter from the rubricData.chapter field first.
    // If not present, try to extract it from rubricData.path, or fall back to a default.
    let chapter = rubricData.chapter;
    let rubricPath = rubricData.path || rubricData.rubric || ""; // rubricPath might contain hierarchy

    // If chapter is missing or null, derive it
    if (!chapter) {
        if (rubricPath) {
            const pathParts = rubricPath.split(" > ");
            if (pathParts.length > 0) {
                chapter = pathParts[0];
            } else {
                // Fallback: If no path structure, use the first word of the rubric as a potential chapter
                chapter = rubricPath.split(",")[0].split(" ")[0];
            }
        } else if (rubricData.rubric) {
            // Fallback if no path, use first word of rubric itself
            chapter = rubricData.rubric.split(",")[0].split(" ")[0];
}
    }

    // Ensure chapter is never null/empty; default to "GENERALITIES"
    if (!chapter || chapter.trim() === "") {
        chapter = "GENERALITIES";
    }

    // Clinical correction: If a VOICE rubric from Kent is erroneously assigned to GENITALIA FEMALE, correct it.
    // This logic should ideally be handled by clinicalOntologyService's normalization.
    // Keeping it here for now as a direct correction.
    if (sourceFile === "kent_master_db.json" && rubricData.rubric.includes("VOICE , barking") && chapter.toUpperCase() === "GENITALIA FEMALE") {
        chapter = "THROAT"; // Or an appropriate chapter like VOICE if available. Adjust as needed.
    }
    return {
        id: rubricData.id || `${sourceFile}_${rubricData.rubric.replace(/[^a-zA-Z0-9_]/g, ".").toUpperCase()}`.substring(0,255), // Basic ID generation
        chapter: chapter,
        rubric: rubricData.rubric || "",
        path: rubricPath,
        remedies: remedies,
        source: sourceFile,
        miasm: rubricData.miasm || "unspecified",
        notes: rubricData.notes || (rubricData.metadata && rubricData.metadata.notes) || "",
        metadata: rubricData.metadata && typeof rubricData.metadata === "object" ? { ...rubricData.metadata } : null,
        priority_weight: rubricData.priority_weight || 1,
    };
}

async function loadMasterRepertory() {
    try {
        // Load canonical remedies from remedyRegistry.json.

        const rawRegistryData = fs.readFileSync(
            REMEDY_REGISTRY_PATH,
            'utf8'
        ).replace(/^\uFEFF/, '');

        const remedyRegistry = JSON.parse(rawRegistryData);

        if (
            !remedyRegistry ||
            !Array.isArray(remedyRegistry.remedies)
        ) {
            throw new Error(
                'Invalid remedyRegistry.json: remedies array not found.'
            );
        }

        normalizedKnownRemedyAbbreviations.clear();
        remedyAliasToCanonicalMap.clear();

        for (const remedy of remedyRegistry.remedies) {
            if (
                !remedy ||
                typeof remedy.canonicalName !== 'string'
            ) {
                continue;
            }

            const canonicalName = normalizeRemedyKey(
                remedy.canonicalName
            );

            if (!canonicalName) {
                continue;
            }

            normalizedKnownRemedyAbbreviations.add(
                canonicalName
            );

            remedyAliasToCanonicalMap.set(
                canonicalName,
                canonicalName
            );

            const aliases = [
                ...(Array.isArray(remedy.abbreviations)
                    ? remedy.abbreviations
                    : []),
                ...(Array.isArray(remedy.aliases)
                    ? remedy.aliases
                    : [])
            ];

            for (const alias of aliases) {
                if (typeof alias !== 'string') {
                    continue;
                }

                const normalizedAlias = normalizeRemedyKey(alias);

                if (normalizedAlias) {
                    const existingCanonical =
                        remedyAliasToCanonicalMap.get(normalizedAlias);

                    if (
                        existingCanonical &&
                        existingCanonical !== canonicalName
                    ) {
                        console.warn(
                            `Alias conflict: ${normalizedAlias}`
                        );
                        continue;
                    }

                    remedyAliasToCanonicalMap.set(
                        normalizedAlias,
                        canonicalName
                    );
                }
            }
        }

        const calcCanonical = normalizeRemedyKey(
            'CALCAREA CARBONICA'
        );

        if (
            normalizedKnownRemedyAbbreviations.has(calcCanonical)
        ) {
            for (const alias of [
                'CALCAREA CARB',
                'CALC-C'
            ]) {
                remedyAliasToCanonicalMap.set(
                    normalizeRemedyKey(alias),
                    calcCanonical
                );
            }
        }

        console.log(
            `Loaded ${normalizedKnownRemedyAbbreviations.size} canonical remedies from remedyRegistry.json.`
        );

        console.log(
            `Populated remedy alias map with ${remedyAliasToCanonicalMap.size} entries.`
        );

    } catch (error) {
        console.error(`Error loading remedy data or explanations:`, error.message);
        // Exit or handle error appropriately if remedies cannot be loaded
        return { masterRepertory: [], loadedCounts: {} };
    }


    const repertoryFiles = [
        "kent_master_db.json",
        "bbcr_master_db.json",
        "boger_master_db.json",
        "clarke_master_db.json",
        "clinical_gpt_master_db.json",
        "confirmatory_gpt_master_db.json",
        "confirmatory_rubrics.json.json",
        "clinical_smart_tips_indexed.json" // Added this file from the audit
    ];

    let masterRepertory = [];
    const rubricCounts = {};

    for (const file of repertoryFiles) {
        const filePath = path.join(REPERTORY_DB_PATH, file);
        try {
            const rawData = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(rawData);

            // Store normalized kentMasterDb and perform initial audit if this is kent_master_db.json
            if (file === "kent_master_db.json") {
                global.kentMasterDb = jsonData.map(r => normalizeRubric(r, file));

                const chapterIndex = {};
                global.kentMasterDb.forEach(r => {
                    const chapter = r.chapter ? r.chapter.toUpperCase() : 'UNKNOWN';
                    if (!chapterIndex[chapter]) {
                        chapterIndex[chapter] = [];
                    }
                    chapterIndex[chapter].push(r);
                });

                if (debugMode) {
                    console.log(
                        "[CHAPTER AUDIT]",
                        Object.keys(chapterIndex)
                    );

                    console.log(
                        "[GENERALITIES COUNT]",
                        chapterIndex["GENERALITIES"]?.length
                    );

                    console.log(
                        "[FOOD AND DRINKS COUNT]",
                        chapterIndex["FOOD AND DRINKS"]?.length
                    );

                    console.log(
                        "[SLEEP COUNT]",
                        chapterIndex["SLEEP"]?.length
                    );

                    console.log(
                        "[DREAMS COUNT]",
                        chapterIndex["DREAMS"]?.length
                    );

                    const uniqueChapters = [...new Set(
                        global.kentMasterDb.map(r => r.chapter)
                    )];
                    console.log("[UNIQUE KENT CHAPTERS]", uniqueChapters.sort());
                }
            }

            let count = 0;
            for (const rubric of jsonData) {
                masterRepertory.push(normalizeRubric(rubric, file));
                count++;
            }
            rubricCounts[file] = count;
            console.log(`âœ… ${file.replace('_master_db.json', '').replace('.json.json', '')} Loaded: ${count}`);
        } catch (error) {
            console.error(`Error loading repertory file ${file}:`, error.message);
        }
    }

    global.masterRepertory = masterRepertory; // Set global.masterRepertory here

    // Build rubric hierarchy and indexes after loading all repertories
    try {
        const rubricHierarchyService = require("./rubricHierarchyService.cjs");
        rubricHierarchyService.buildHierarchy();
        console.log("? RUBRIC HIERARCHY BUILT SUCCESSFULLY");
    } catch (hierarchyError) {
        console.error("? RUBRIC HIERARCHY BUILD FAILED:", hierarchyError.message);
    }
    const totalRubrics = masterRepertory.length;

    rubricCounts.TOTAL = totalRubrics;
    console.log(`âœ… TOTAL MASTER RUBRICS: ${totalRubrics}`);
    return { masterRepertory, loadedCounts: rubricCounts };
}

function resolveCanonicalRemedyName(remedyName) {
    const normalizedName = normalizeRemedyKey(remedyName);
    return remedyAliasToCanonicalMap.get(normalizedName) || normalizedName;
}

module.exports = {
    loadMasterRepertory,
    normalizedKnownRemedyAbbreviations,
    resolveCanonicalRemedyName
}; // Export for potential external use








