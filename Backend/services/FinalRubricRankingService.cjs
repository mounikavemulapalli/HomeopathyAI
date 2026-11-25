// Backend/services/FinalRubricRankingService.cjs

const finalRubricRankingService = {};

// Default weights for score components
const DEFAULT_SCORE_WEIGHTS = {
    flexSearch: 1.0,
    hierarchy: 1.0,
    clinical: 1.0,
    confidence: 1.0, 
};

/**
 * Normalizes a score to a 0-100 scale relative to the highest score found in its category among the candidates.
 * @param {number} score - The raw score.
 * @param {number} maxScoreInCandidates - The highest score for this component among all candidates.
 * @returns {number} - The normalized score (0-100).
 */
function dynamicNormalizeScore(score, maxScoreInCandidates) {
    if (maxScoreInCandidates <= 0) return 0; // Avoid division by zero, or if all scores are zero
    return (score / maxScoreInCandidates) * 100;
}

/**
 * Combines scores from various stages, deduplicates, sorts, and returns top N rubrics.
 * @param {Array<Object>} candidateRubrics - Array of rubric objects with scores from previous stages.
 *   Expected structure for each rubric: { id: string, fullPath: string, score: number, hierarchyScore: number, clinicalScore: number, confidenceScore?: number }
 * @param {Object} options - Options for ranking.
 * @param {number} [options.topN=25] - Number of top rubrics to return (e.g., 10, 25, 50, 100). Default is 25.
 * @param {Object} [options.scoreWeights=DEFAULT_SCORE_WEIGHTS] - Weights to apply to each score component after normalization.
 * @returns {Array<Object>} - A sorted array of top N rubric objects with combined scores.
 */
finalRubricRankingService.rankCandidates = (candidateRubrics, options = {}) => {
    if (!candidateRubrics || candidateRubrics.length === 0) {
        return [];
    }

    // TASK-3: Default topN to 25. Allow dynamic topN.
    const { topN = 25, scoreWeights = DEFAULT_SCORE_WEIGHTS } = options;

    // 1. Deduplicate rubrics using MAX() approach for each score component (TASK-2)
    // This ensures that if a rubric appears multiple times from different FlexSearch hits,
    // its individual component scores (FlexSearch, Hierarchy, Clinical, Confidence) reflect the best (max) score achieved for that component.
    const uniqueRubricsMap = new Map(); // Map: rubric.id -> rubricWithMaxScores

    for (const rubric of candidateRubrics) {
        const existingRubric = uniqueRubricsMap.get(rubric.id);

        const flexScore = rubric.score || 0;
        const hierarchyScore = rubric.hierarchyScore || 0;
        const clinicalScore = rubric.clinicalScore || 0; // TASK-4: Use confidenceScore if available, else 0
        const confidenceScore = rubric.confidenceScore || 0; 

        if (existingRubric) {
            existingRubric.score = Math.max(existingRubric.score, flexScore);
            uniqueRubricsMap.set(rubric.id, existingRubric); // Update map with new max scores
        } else {
            uniqueRubricsMap.set(rubric.id, {
                ...rubric, // Keep original rubric data
                score: flexScore,
                hierarchyScore: hierarchyScore,
                clinicalScore: clinicalScore,
                confidenceScore: confidenceScore,
            });
        }
    }

    let dedupedRubrics = Array.from(uniqueRubricsMap.values());

    // TASK-1: Implement Dynamic Score Normalization
    // Find dynamic max scores for each component across all deduped rubrics
    let maxFlexSearchScore = 0;
    let maxHierarchyScore = 0;
    let maxClinicalScore = 0;
    let maxConfidenceScore = 0;

    for (const rubric of dedupedRubrics) {
        maxFlexSearchScore = Math.max(maxFlexSearchScore, rubric.score || 0);
        maxHierarchyScore = Math.max(maxHierarchyScore, rubric.hierarchyScore || 0);
        maxClinicalScore = Math.max(maxClinicalScore, rubric.clinicalScore || 0);
        maxConfidenceScore = Math.max(maxConfidenceScore, rubric.confidenceScore || 0);
    }

    const normalizedAndCombinedRubrics = dedupedRubrics.map(rubric => {
        // Normalize each score component dynamically to a 0-100 scale
        const normalizedFlexScore = dynamicNormalizeScore(rubric.score || 0, maxFlexSearchScore);
        const normalizedHierarchyScore = dynamicNormalizeScore(rubric.hierarchyScore || 0, maxHierarchyScore);
        const normalizedClinicalScore = dynamicNormalizeScore(rubric.clinicalScore || 0, maxClinicalScore);
        const normalizedConfidenceScore = dynamicNormalizeScore(rubric.confidenceScore || 0, maxConfidenceScore);

        // Combine normalized scores using weights
        const totalCombinedScore = 
            (normalizedFlexScore * scoreWeights.flexSearch) +
            (normalizedHierarchyScore * scoreWeights.hierarchy) +
            (normalizedClinicalScore * scoreWeights.clinical) +
            (normalizedConfidenceScore * scoreWeights.confidence);
        
        return {
            ...rubric,
            totalCombinedScore: totalCombinedScore,
            _normalizedFlexScore: normalizedFlexScore, // For debugging/transparency
            _normalizedHierarchyScore: normalizedHierarchyScore,
            _normalizedClinicalScore: normalizedClinicalScore,
            _normalizedConfidenceScore: normalizedConfidenceScore,
        };
    });

    // Sort candidate rubrics by combined score in descending order
    normalizedAndCombinedRubrics.sort((a, b) => b.totalCombinedScore - a.totalCombinedScore);

    // Return Top-N rubrics
    return normalizedAndCombinedRubrics.slice(0, topN);
};

module.exports = finalRubricRankingService;

