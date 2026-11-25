const fs = require("fs");

function cleanRubricName(rubricName) {
    let cleaned = rubricName.replace(/\s*\([^)]*?\)/g, ""); // Non-greedy match for parentheses content
    return cleaned.trim().toUpperCase(); // Convert to uppercase for consistent matching
}

async function loadRubricData(kentRubricPath, clinicalSmartTipsPath) {
    const kentRubricsRaw = fs.readFileSync(kentRubricPath, "utf8");
    const kentRubrics = JSON.parse(kentRubricsRaw);

    const clinicalSmartTipsRaw = fs.readFileSync(clinicalSmartTipsPath, "utf8");
    const clinicalSmartTips = JSON.parse(clinicalSmartTipsRaw);

    const rubricMap = new Map(); // Maps fullPath to rubricNode
    const rubricToChapterMap = new Map(); // Maps cleaned rubric names from smart tips to their chapters (prioritizing Kent source)
    let allRubrics = []; // To store all rubric nodes in a flat array

    // Step 1: Process clinicalSmartTips to build a direct rubric to chapter mapping
    // Prioritize Kent source for more accurate chapter assignments
    clinicalSmartTips.forEach(item => {
        const chapterName = item.path.split(" > ")[0].trim(); // e.g., "Mind", "Physical", "Skin"
        const cleanedRubricFromTips = cleanRubricName(item.rubric);
        
        // Only map if source is "Kent", or if no mapping exists yet
        // If a generic rubric like "during" has multiple mappings, the first one encountered will be used.
        // We assume specific Kent tips are most accurate for chapter assignment.
        if (item.source === "Kent" || !rubricToChapterMap.has(cleanedRubricFromTips)) {
            rubricToChapterMap.set(cleanedRubricFromTips, chapterName);
        }
    });

    // Step 2: Build the full rubric hierarchy from kentRubrics and assign chapters
    function buildHierarchy(currentRubricData, parentPath = "", parentChapter = null) { 
        let localRubricNodes = {}; // To hold rubric nodes at the current level

        for (const rubricName in currentRubricData) {
            if (["HIGH", "MEDIUM", "LOW", "sub_rubrics"].includes(rubricName)) { // Check for uppercase "HIGH", "MEDIUM", "LOW" too
                continue;
            }

            const rubricEntry = currentRubricData[rubricName];
            const currentFullPath = parentPath ? `${parentPath}/${rubricName}` : rubricName;
            const cleanedRubricName = cleanRubricName(rubricName);

            let assignedChapter = parentChapter; // Inherit from parent by default

            // Attempt to assign chapter based on direct match from rubricToChapterMap
            if (rubricToChapterMap.has(cleanedRubricName)) {
                assignedChapter = rubricToChapterMap.get(cleanedRubricName);
            } else { 
                // If no direct match, try partial matching. If a more specific rubric in smart tips contains the current rubric.
                // Simplified partial matching: if smart tip rubric contains the Kent rubric.
                for (const [smartTipRubricCleaned, chapter] of rubricToChapterMap.entries()) {
                    if (smartTipRubricCleaned.includes(cleanedRubricName)) { 
                        if (!assignedChapter) { // Only assign if no chapter is assigned yet
                            assignedChapter = chapter; 
                            break; 
                        }
                    }
                }
            }
            
            const rubricNode = {
                name: rubricName,
                cleanedName: cleanedRubricName,
                fullPath: currentFullPath,
                parentPath: parentPath,
                chapter: assignedChapter, 
                children: [],
                remedies: {
                    high: rubricEntry.high || [],
                    medium: rubricEntry.medium || [],
                    low: rubricEntry.low || []
                },
                rawSubRubrics: rubricEntry.sub_rubrics || {} // Store for recursive processing
            };
            
            rubricMap.set(currentFullPath, rubricNode);
            allRubrics.push(rubricNode);

            if (rubricEntry.sub_rubrics && Object.keys(rubricEntry.sub_rubrics).length > 0) {
                // Pass the *assignedChapter* to children so they can inherit if no specific chapter found
                const childNodes = buildHierarchy(rubricEntry.sub_rubrics, currentFullPath, rubricNode.chapter);
                rubricNode.children = Object.values(childNodes).map(child => child.fullPath);

                // After children are processed, if parent still has no chapter, and a child has one, try to infer parent chapter
                if (rubricNode.chapter === null) {
                    for (const childPath of rubricNode.children) {
                        const childNode = rubricMap.get(childPath);
                        if (childNode && childNode.chapter) {
                            rubricNode.chapter = childNode.chapter;
                            break;
                        }
                    }
                }
            }

            localRubricNodes[rubricName] = rubricNode;
        }
        return localRubricNodes;
    }

    // Initiate hierarchy building from the top-level kentRubrics
    buildHierarchy(kentRubrics);

    // Final propagation pass: Ensure all rubrics have a chapter by propagating from nearest assigned ancestor
    allRubrics.forEach(node => {
        if (node.chapter === null) {
            let currentSearchPath = node.parentPath;
            while (currentSearchPath) {
                const parentNode = rubricMap.get(currentSearchPath);
                if (parentNode && parentNode.chapter) {
                    node.chapter = parentNode.chapter;
                    break;
                }
                currentSearchPath = parentNode ? parentNode.parentPath : null;
            }
        }
    });

    return { rubricMap, allRubrics, rubricToChapterMap };
}
