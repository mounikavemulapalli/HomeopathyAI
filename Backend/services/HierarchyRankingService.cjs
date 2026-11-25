// Backend/services/HierarchyRankingService.cjs

const hierarchyRankingService = {};

// Assume global.masterRepertory and global.rubricHierarchy, global.nodeIndex, global.parentIndex, global.childIndex, global.pathIndex are already populated by rubricHierarchyService.cjs

const SCORES = {
    EXACT_MATCH_BOOST: 1000,
    PARENT_BOOST_LEVEL_1: 700, // Direct parent
    PARENT_BOOST_LEVEL_2: 300, // Grandparent
    PARENT_BOOST_LEVEL_3: 100, // Great-grandparent
    // Dynamic descendant scores
    CHILD_BOOST_LEVEL_1: 500,  // Level 1 child
    CHILD_BOOST_LEVEL_2: 300,  // Level 2 child (grandchild)
    CHILD_BOOST_LEVEL_3: 150,  // Level 3 child
    CHILD_BOOST_LEVEL_4: 75,   // Level 4 child
    SIBLING_PENALTY: -500,
    WRONG_CHAPTER_PENALTY: -1000, // Applies if candidate chapter != patient symptom chapter AND not in same hierarchy tree
};

/**
 * Finds all parent node IDs for a given nodeId, up to a specified depth.
 * @param {string} nodeId - The ID of the node to find parents for.
 * @param {number} maxDepth - Maximum number of parent levels to retrieve.
 * @returns {Array<string>} - An array of parent node IDs, from immediate parent upwards.
 */
function getParentChain(nodeId, maxDepth = 3) {
    const parents = [];
    let currentId = nodeId;
    let depth = 0;
    while (global.parentIndex[currentId] && depth < maxDepth) {
        currentId = global.parentIndex[currentId];
        parents.push(currentId);
        depth++;
    }
    return parents;
}

/**
 * Finds all descendant node IDs for a given nodeId, up to a specified maxDepth,
 * along with their depth relative to the starting nodeId.
 * @param {string} nodeId - The ID of the node to find descendants for.
 * @param {number} maxDepth - Maximum depth level of descendants to retrieve.
 * @returns {Map<string, number>} - A Map where keys are descendant nodeId and values are their depth relative to the starting nodeId.
 */
function getDescendantsWithDepth(nodeId, maxDepth = 4) {
    const descendants = new Map(); // Stores nodeId -> depth
    const queue = [];

    // Add direct children to queue for initial processing
    const initialChildren = global.childIndex[nodeId] || [];
    for (const childId of initialChildren) {
        queue.push({ id: childId, depth: 1 });
    }

    while (queue.length > 0) {
        const { id, depth } = queue.shift();

        if (depth > maxDepth) continue;

        descendants.set(id, depth);
        const children = global.childIndex[id] || [];
        for (const childId of children) {
            queue.push({ id: childId, depth: depth + 1 });
        }
    }
    return descendants;
}

/**
 * Calculates a hierarchy-aware score for a list of candidate rubrics based on a primary patient symptom.
 * @param {string} patientSymptomPath - The fullPath of the primary patient symptom to base hierarchy ranking on.
 * @param {Array<Object>} candidateRubrics - An array of rubric objects from FlexSearch, each with at least { id, fullPath, chapter, score }.
 * @returns {Array<Object>} - The same array of rubric objects, with an added \'hierarchyScore\' property. If patient symptom not found, returns candidates with hierarchyScore: 0 (preserving original scores).
 */
hierarchyRankingService.scoreCandidates = (patientSymptomPath, candidateRubrics) => {
    // Improvement 2: If patient symptom not found or inputs invalid, skip hierarchy ranking and preserve FlexSearch scores.
    if (!patientSymptomPath || !candidateRubrics || candidateRubrics.length === 0) {
        // Ensure hierarchyScore is initialized to 0 if not calculated.
        return candidateRubrics.map(candidate => ({ ...candidate, hierarchyScore: 0 }));
    }

    const patientNodeId = global.pathIndex[patientSymptomPath];
    if (!patientNodeId || !global.nodeIndex[patientNodeId]) {
        // If patient symptom not found in hierarchy, return candidates with hierarchyScore: 0.
        return candidateRubrics.map(candidate => ({ ...candidate, hierarchyScore: 0 }));
    }

    const patientNode = global.nodeIndex[patientNodeId];
    const patientChapter = patientNode.chapter;

    // Pre-calculate hierarchy map for the patient symptom once.
    const patientParents = getParentChain(patientNodeId, 3); // Up to 3 levels: P1, P2, P3
    const patientChildren = global.childIndex[patientNodeId] || []; // Direct children
    const patientDescendantsWithDepth = getDescendantsWithDepth(patientNodeId, 4); // Up to 4 levels: C1, C2, C3, C4
    const patientSiblings = (patientNode.parentId && global.childIndex[patientNode.parentId]) ?
                            global.childIndex[patientNode.parentId].filter(id => id !== patientNodeId) : [];

    const scoredCandidates = candidateRubrics.map(candidate => {
        let hierarchyScore = 0; // Initialize hierarchy score for this candidate
        const candidatePath = candidate.fullPath;
        const candidateNodeId = global.pathIndex[candidatePath];

        if (!candidateNodeId || !global.nodeIndex[candidateNodeId]) {
            return { ...candidate, hierarchyScore }; // Node not found in hierarchy, no hierarchy score
        }

        const candidateChapter = global.nodeIndex[candidateNodeId].chapter;
        let isInSameHierarchyTree = false;

        // 1. Exact Match Boost (if the candidate IS the patient symptom)
        if (candidateNodeId === patientNodeId) {
            hierarchyScore += SCORES.EXACT_MATCH_BOOST;
            isInSameHierarchyTree = true;
        }
        
        // 2. Parent Boost (candidate is a parent of the patient symptom)
        const levelInPatientParents = patientParents.indexOf(candidateNodeId);
        if (levelInPatientParents === 0) { // Direct parent of patient symptom
            hierarchyScore += SCORES.PARENT_BOOST_LEVEL_1;
            isInSameHierarchyTree = true;
        } else if (levelInPatientParents === 1) { // Grandparent of patient symptom
            hierarchyScore += SCORES.PARENT_BOOST_LEVEL_2;
            isInSameHierarchyTree = true;
        } else if (levelInPatientParents === 2) { // Great-grandparent of patient symptom
            hierarchyScore += SCORES.PARENT_BOOST_LEVEL_3;
            isInSameHierarchyTree = true;
        }

        // 3. Child/Descendant Boost (candidate is a child/descendant of the patient symptom)
        const descendantDepth = patientDescendantsWithDepth.get(candidateNodeId);
        if (descendantDepth) {
            isInSameHierarchyTree = true;
            if (descendantDepth === 1) {
                hierarchyScore += SCORES.CHILD_BOOST_LEVEL_1;
            } else if (descendantDepth === 2) {
                hierarchyScore += SCORES.CHILD_BOOST_LEVEL_2;
            } else if (descendantDepth === 3) {
                hierarchyScore += SCORES.CHILD_BOOST_LEVEL_3;
            } else if (descendantDepth === 4) {
                hierarchyScore += SCORES.CHILD_BOOST_LEVEL_4;
            }
        }

        // 4. Sibling Penalty (candidate is a sibling of the patient symptom)
        if (patientSiblings.includes(candidateNodeId)) {
            hierarchyScore += SCORES.SIBLING_PENALTY;
            isInSameHierarchyTree = true;
        }

        // Improvement 1: Wrong Chapter Penalty Logic
        // Apply penalty only if not in the same hierarchy tree AND chapters differ.
        if (!isInSameHierarchyTree && candidateChapter !== patientChapter) {
            hierarchyScore += SCORES.WRONG_CHAPTER_PENALTY;
        }

        return { ...candidate, hierarchyScore };
    });

    return scoredCandidates;
};

module.exports = hierarchyRankingService;
