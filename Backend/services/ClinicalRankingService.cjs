// Backend/services/ClinicalRankingService.cjs

const clinicalRankingService = {};

// Assume global.masterRepertory and global.nodeIndex are available for rubric details.
// Assume global.parentIndex and global.childIndex are available for hierarchy traversal
// (from rubricHierarchyService.cjs)

// Default clinical scores - these are illustrative and should be tuned clinically
const CLINICAL_SCORES = {
    // Priority scores for exact matches of clinical context rubrics
    MENTAL_GENERAL_PRIORITY: 1500, // Highest priority
    CONSTITUTIONAL_PRIORITY: 1300,
    PHYSICAL_GENERAL_PRIORITY: 1100,
    CHARACTERISTIC_SYMPTOM_PRIORITY: 900,
    CHIEF_COMPLAINT_PRIORITY: 700,
    PATHOLOGICAL_GENERAL_PRIORITY: 500,
    ORGAN_AFFINITY_PRIORITY: 300, // Lowest priority

    // Hierarchy boost scores for candidates related to clinical context rubrics
    // These ensure related rubrics get a boost but are always less than exact matches of priority types
    PARENT_BOOST_LEVEL_1_DEFAULT: 200, 
    PARENT_BOOST_LEVEL_2_DEFAULT: 100, 
    PARENT_BOOST_LEVEL_3_DEFAULT: 50,  
    CHILD_BOOST_LEVEL_1_DEFAULT: 150,  
    CHILD_BOOST_LEVEL_2_DEFAULT: 75,   

    // Maximum possible clinical score for a single rubric, used for balancing.
    // This should ideally be based on the highest possible priority score.
    MAX_CLINICAL_SCORE_PER_CATEGORY: 1500, // Max of MENTAL_GENERAL_PRIORITY
    MAX_TOTAL_CLINICAL_BOOSTS: 500, // Maximum total boost from parent/child connections within clinical context
};

/**
 * Helper function to retrieve the node ID for a given fullPath.
 * @param {string} fullPath - The full path of the rubric.
 * @returns {string|null} - The node ID or null if not found.
 */
function getNodeIdFromPath(fullPath) {
    return global.pathIndex[fullPath] || null;
}

/**
 * Helper function to get parent node IDs.
 * @param {string} nodeId - The node ID.
 * @param {number} maxLevels - Max levels to traverse up.
 * @returns {Array<string>} - Array of parent node IDs.
 */
function getParentChain(nodeId, maxLevels = 3) {
    const parents = [];
    let currentId = nodeId;
    for (let level = 1; level <= maxLevels; level++) {
        const parentId = global.parentIndex[currentId];
        if (!parentId) break;
        parents.push(parentId);
        currentId = parentId;
    }
    return parents;
}

/**
 * Helper function to get descendant node IDs with their depth.
 * @param {string} nodeId - The node ID.
 * @param {number} maxLevels - Max levels to traverse down.
 * @returns {Map<string, number>} - Map of descendant nodeId to depth.
 */
function getDescendantsWithDepth(nodeId, maxLevels = 2) {
    const descendants = new Map();
    const queue = [];
    const initialChildren = global.childIndex[nodeId] || [];
    for (const childId of initialChildren) {
        queue.push({ id: childId, depth: 1 });
    }

    while (queue.length > 0) {
        const { id, depth } = queue.shift();
        if (depth > maxLevels) continue;
        descendants.set(id, depth);
        const children = global.childIndex[id] || [];
        for (const childId of children) {
            queue.push({ id: childId, depth: depth + 1 });
        }
    }
    return descendants;
}

/**
 * Applies clinical priority scoring to candidate rubrics.
 * @param {Array<Object>} candidateRubrics - Rubrics from HierarchyRankingService ({ id, fullPath, chapter, score, hierarchyScore }).
 * @param {Object} patientClinicalData - Patient clinical context. Can be old or new format.
 *   Old format (array of nodeIds):
 *   - chiefComplaints: Array<string>
 *   - mentalGenerals: Array<string>
 *   - physicalGenerals: Array<string>
 *   - characteristicSymptoms: Array<string>
 *   - constitutionalProfile: Array<string>
 *   - pathologicalGenerals: Array<string>
 *   - organAffinities: Array<string>
 *   New format (object with priority and rubrics):
 *   - mentalGenerals: { priority: number, rubrics: Array<string> }
 *   - constitutional: { priority: number, rubrics: Array<string> }
 *   - physicalGenerals: { priority: number, rubrics: Array<string> }
 *   - characteristicSymptoms: { priority: number, rubrics: Array<string> }
 *   - chiefComplaints: { priority: number, rubrics: Array<string> }
 *   - pathologicalGenerals: { priority: number, rubrics: Array<string> }
 *   - organAffinities: { priority: number, rubrics: Array<string> }
 * @returns {Array<Object>} - Candidates with added 'clinicalScore' and 'totalScore'.
 */
clinicalRankingService.scoreCandidates = (candidateRubrics, patientClinicalData) => {
    if (!candidateRubrics || candidateRubrics.length === 0 || !patientClinicalData) {
        return candidateRubrics.map(candidate => ({ ...candidate, clinicalScore: 0, totalScore: (candidate.score || 0) + (candidate.hierarchyScore || 0) }));
    }

    const scoredCandidates = candidateRubrics.map(candidate => {
        let clinicalScore = 0;
        const candidateNodeId = getNodeIdFromPath(candidate.fullPath);
        if (!candidateNodeId || !global.nodeIndex[candidateNodeId]) {
            return { ...candidate, clinicalScore: 0, totalScore: (candidate.score || 0) + (candidate.hierarchyScore || 0) };
        }

        // Helper to process a clinical category
        const processClinicalCategory = (categoryData, basePriorityScore) => {
            let categoryBoost = 0;
            let rubricsToProcess = [];
            let categoryPriority = 0;

            // Determine if old or new format
            if (Array.isArray(categoryData)) { // Old format
                rubricsToProcess = categoryData;
                categoryPriority = 0; // Not applicable for old format in dynamic priority
            } else if (categoryData && Array.isArray(categoryData.rubrics)) { // New format
                rubricsToProcess = categoryData.rubrics;
                categoryPriority = categoryData.priority; // Use provided priority
            }
            
            for (const clinicalRubricPath of rubricsToProcess) {
                const clinicalNodeId = getNodeIdFromPath(clinicalRubricPath);
                if (!clinicalNodeId) continue;

                if (candidateNodeId === clinicalNodeId) {
                    // Exact match with a clinical context rubric
                    categoryBoost += basePriorityScore; 
                } else {
                    // Check for hierarchical relationships
                    let boostFromHierarchy = 0;
                    boostFromHierarchy += getParentBoostFromClinicalContext(candidateNodeId, clinicalNodeId);
                    boostFromHierarchy += getChildBoostFromClinicalContext(candidateNodeId, clinicalNodeId);
                    
                    // Apply hierarchy boost, capped to prevent over-inflation
                    categoryBoost += Math.min(boostFromHierarchy, CLINICAL_SCORES.MAX_TOTAL_CLINICAL_BOOSTS / rubricsToProcess.length);
                }
            }
            return categoryBoost;
        };

        // Define categories with their processing order (TASK-2)
        const clinicalCategories = [
            { key: 'mentalGenerals', score: CLINICAL_SCORES.MENTAL_GENERAL_PRIORITY },
            { key: 'constitutional', score: CLINICAL_SCORES.CONSTITUTIONAL_PRIORITY },
            { key: 'physicalGenerals', score: CLINICAL_SCORES.PHYSICAL_GENERAL_PRIORITY },
            { key: 'characteristicSymptoms', score: CLINICAL_SCORES.CHARACTERISTIC_SYMPTOM_PRIORITY },
            { key: 'chiefComplaints', score: CLINICAL_SCORES.CHIEF_COMPLAINT_PRIORITY },
            { key: 'pathologicalGenerals', score: CLINICAL_SCORES.PATHOLOGICAL_GENERAL_PRIORITY },
            { key: 'organAffinities', score: CLINICAL_SCORES.ORGAN_AFFINITY_PRIORITY },
        ];

        // Dynamically sort categories if new format priorities are provided (TASK-5)
        const categoriesWithPriorities = clinicalCategories.map(cat => {
            const categoryData = patientClinicalData[cat.key];
            if (categoryData && typeof categoryData === 'object' && categoryData.priority !== undefined) {
                return { ...cat, priority: categoryData.priority };
            } else {
                return { ...cat, priority: 99 }; // Default low priority for old format or missing priority
            }
        }).sort((a, b) => a.priority - b.priority);

        for (const category of categoriesWithPriorities) {
            const categoryData = patientClinicalData[category.key];
            clinicalScore += processClinicalCategory(categoryData, category.score);
        }

        // TASK-3: Score Balancing
        // Cap the total score (FlexSearch + Hierarchy + Clinical) to ensure it doesn't exceed a reasonable max.
        // This prevents overly enthusiastic boosts from making minor rubrics disproportionately high.
        const currentTotalScore = (candidate.score || 0) + (candidate.hierarchyScore || 0) + clinicalScore;
        const balancedClinicalScore = Math.min(clinicalScore, CLINICAL_SCORES.MAX_CLINICAL_SCORE_PER_CATEGORY); 

        // Final score for this candidate
        const finalCandidateTotalScore = (candidate.score || 0) + (candidate.hierarchyScore || 0) + balancedClinicalScore;

        return { 
            ...candidate, 
            clinicalScore: balancedClinicalScore, 
            totalScore: finalCandidateTotalScore // Add a totalScore for convenience in subsequent ranking
        };
    });

    // TASK-4: Verify Chief Complaint Parent Score vs Constitutional Exact Match
    // This verification is done during design/tuning, not dynamically in code.
    // If CLINICAL_SCORES.CHIEF_COMPLAINT_PRIORITY (700) + PARENT_BOOST_LEVEL_1_DEFAULT (200) = 900
    // is less than CLINICAL_SCORES.CONSTITUTIONAL_PRIORITY (1300) for an exact match, then it's fine.
    // Based on current default scores: 900 < 1300, so it does not exceed.

    return scoredCandidates;
};

module.exports = clinicalRankingService;
