
/**
 * FinalRemedyRankingService.cjs
 * This service is responsible for calculating various scores for remedies based on inputs
 * like TOP-25 RUBRICS, REPERTORY ENGINE OUTPUT, and PATIENT CLINICAL PROFILE.
 * It then ranks remedies to determine the TOP-10, TOP-3, and the FINAL REMEDY.
 *
 * ARCHITECTURE IS COMPLETELY FROZEN. DO NOT CREATE NEW SERVICES OR MODIFY EXISTING FROZEN SERVICES.
 * This implementation adheres to the FINAL FLOW as specified in the task.
 */

// Placeholder for external dependencies. In a real scenario, these would be imported.
// For now, we will assume these are available or their functionality is mocked/simplified.
const RepertoryEngine = require('./RepertoryEngine'); // Assuming this exists based on the flow
const rubricHierarchyService = require('./rubricHierarchyService.cjs'); // Assuming this exists
const clinicalOntologyService = require('./clinicalOntologyService');

const keynoteConfirmationService = require('./keynoteConfirmationService.js');const ThermalInterpreter = require('./interpreters/ThermalInterpreter.js');
const ThirstInterpreter = require('./interpreters/ThirstInterpreter.js');
const CravingsInterpreter = require('./interpreters/CravingsInterpreter.js');
const SleepInterpreter = require('./interpreters/SleepInterpreter.js');
const DreamsInterpreter = require('./interpreters/DreamsInterpreter.js');
const constitutionalPriorityService = require('./constitutionalPriorityService.js'); // Assuming this exists
const miasmaticIntelligenceService = require('./miasmaticIntelligenceService.js');

const FinalRemedyRankingService = {
  _getRemedyGradeForRubric(remedy, rubric, repertoryEngineOutput) {
    const normalizeName = (name) =>
      String(name || "")
        .toUpperCase()
        .replace(/[.\-]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const remedyName = normalizeName(remedy?.canonicalName || remedy?.name);
    const legacyGrades = repertoryEngineOutput?.rubricRemedyGrades || {};
    const rubricId = rubric?.id;

    if (rubricId && legacyGrades[rubricId]) {
      const match = Object.entries(legacyGrades[rubricId])
        .find(([name]) => normalizeName(name) === remedyName);

      if (match) return Number(match[1]) || 0;
    }

    const rubricRemedies = rubric?.remedies;

    if (Array.isArray(rubricRemedies)) {
      const match = rubricRemedies.find(item =>
        normalizeName(item?.name || item) === remedyName
      );

      return Number(match?.normalizedGrade ?? match?.grade ?? 0) || 0;
    }

    if (rubricRemedies && typeof rubricRemedies === "object") {
      const match = Object.entries(rubricRemedies)
        .find(([name]) => normalizeName(name) === remedyName);

      if (match) {
        return Number(match[1]?.normalizedGrade ?? match[1]?.grade ?? match[1]) || 0;
      }
    }

    return 0;
  },


  /**
   * Main function to process inputs and return ranked remedies with their scores.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics identified for the patient.
   * @param {Object} repertoryEngineOutput - The raw output from the Repertory Engine, detailing remedy-rubric associations and initial scores.
   * @param {Object} patientClinicalProfile - Detailed clinical profile of the patient, including symptoms, modalities, mental/physical generals, etc.
   * @returns {Object} An object containing the scored remedies, top-10, top-3, and final remedy.
   */
  async getRankedRemedies(top25Rubrics, repertoryEngineOutput, patientClinicalProfile) {
    // 1. ALL REMEDIES - Extract remedies from Repertory Engine Output
    const allRemedies = this._extractRemediesFromRepertoryOutput(repertoryEngineOutput);

    // Initialize scores for each remedy
    let scoredRemedies = allRemedies.map(remedy => ({
      name: remedy.name, // Display / repertory abbreviation
      canonicalName: remedy.canonicalName || remedy.canonical || remedy.name,
      canonical: remedy.canonical || remedy.canonicalName || remedy.name,
      initialRepertoryScore: remedy.score ?? 0,
      repertoryFinalScore: remedy.finalScore ?? remedy.score ?? 0,
      coverageScore: 0,
      mentalScore: 0,
      constitutionalScore: 0,
      physicalScore: 0,
      characteristicScore: 0,
      chiefComplaintScore: 0,
      pathologicalScore: 0,
      organAffinityScore: 0,
      materiaMedicaScore: 0,
      miasmaticScore: 0,
      miasmaticProfile: null,
      totalRemedyScore: 0,
      physicianBreakdown: {} // To store detailed breakdown for Nat-m example output
    }));

    // 2. REMEDY COVERAGE SCORING
    scoredRemedies = this._applyRemedyCoverageScoring(scoredRemedies, top25Rubrics, repertoryEngineOutput);

    // 3. CLINICAL PRIORITY SCORING
    scoredRemedies = this._applyClinicalPriorityScoring(scoredRemedies, top25Rubrics, patientClinicalProfile, repertoryEngineOutput);

    // 4. MATERIA MEDICA INTELLIGENCE
    scoredRemedies = await this._applyMateriaMedicaIntelligence(scoredRemedies, patientClinicalProfile);

    // 5. 9E-1 MIASMATIC INTELLIGENCE
    // Case-level evidence only.
    // Final ranking weight is NOT changed at this stage.
    scoredRemedies = this._applyMiasmaticIntelligence(
      scoredRemedies,
      patientClinicalProfile
    );

    // 6. TOTAL REMEDY SCORE
    scoredRemedies = this._calculateTotalRemedyScore(scoredRemedies);

    // Sort remedies by total score in descending order
    scoredRemedies.sort((a, b) => b.totalRemedyScore - a.totalRemedyScore);

    // 6. TOP-10 REMEDIES
    const top10Remedies = scoredRemedies.slice(0, 10);

    // 7. REMEDY DIFFERENTIATION (Assuming this is a re-ranking based on existing scores or a simplified logic)
    // Given the constraint "DO NOT CREATE NEW SERVICES" and "ARCHITECTURE IS COMPLETELY FROZEN",
    // we will simulate differentiation as a re-evaluation of scores or a simple pass-through
    // if no specific differentiation logic is provided and no new services can be created.
    // For this implementation, we'll assume a simple re-ordering based on refined scores or just use the current order.
    const differentiatedRemedies = this._applyRemedyDifferentiation(top10Remedies, patientClinicalProfile);

    // 8. TOP-3 REMEDIES
    const top3Remedies = differentiatedRemedies.slice(0, 3);

    // 9. FINAL REMEDY
    const finalRemedy = top3Remedies.length > 0 ? top3Remedies[0] : null;

    // Format output for physician breakdown
    const formatPhysicianBreakdown = (remedy) => ({
      ...remedy,
      physicianBreakdown: {
        Coverage: remedy.coverageScore,
        Mental: remedy.mentalScore,
        Constitution: remedy.constitutionalScore,
        Physical: remedy.physicalScore,
        Characteristic: remedy.characteristicScore,
        "Chief Complaint": remedy.chiefComplaintScore,
        Pathological: remedy.pathologicalScore,
        Organ: remedy.organAffinityScore,
        MM: remedy.materiaMedicaScore,
        TOTAL: remedy.totalRemedyScore,
      },
    });

    const formattedScoredRemedies = scoredRemedies.map(formatPhysicianBreakdown);
    const formattedTop10Remedies = top10Remedies.map(formatPhysicianBreakdown);
    const formattedTop3Remedies = top3Remedies.map(formatPhysicianBreakdown);
    const formattedFinalRemedy = finalRemedy
      ? formatPhysicianBreakdown(finalRemedy)
      : null;

    return {
      allScoredRemedies: formattedScoredRemedies,
      top10Remedies: formattedTop10Remedies,
      top3Remedies: formattedTop3Remedies,
      finalRemedy: formattedFinalRemedy,
    };
  },

  /**
   * Extracts unique remedies from the Repertory Engine Output.
   * @param {Object} repertoryEngineOutput - The raw output from the Repertory Engine.
   * @returns {Array<Object>} An array of unique remedies with their initial scores.
   */
   _extractRemediesFromRepertoryOutput(repertoryEngineOutput) {

  const remediesMap = new Map();

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[.\-']/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const fallbackCanonicalMap = {
    "natm": "Natrum muriaticum",
    "nat mur": "Natrum muriaticum",
    "natrum mur": "Natrum muriaticum",
    "natrum muriaticum": "Natrum muriaticum",

    "sulph": "Sulphur",
    "sulphur": "Sulphur",

    "calc": "Calcarea carbonica",
    "calc carb": "Calcarea carbonica",
    "calcarea carb": "Calcarea carbonica",
    "calcarea carbonica": "Calcarea carbonica"
  };

  const resolveCanonical = (remedy) => {

    const rawName =
      remedy?.canonicalName ||
      remedy?.canonical ||
      remedy?.name ||
      "";

    const key = normalize(rawName);

    try {
      if (typeof resolveCanonicalRemedyName === "function") {
        const resolved = resolveCanonicalRemedyName(rawName);

        if (
          resolved &&
          normalize(resolved) !== normalize(rawName)
        ) {
          return resolved;
        }

        if (resolved) {
          const fallback = fallbackCanonicalMap[normalize(resolved)];
          if (fallback) return fallback;
        }
      }
    } catch (error) {
      console.warn(
        "[9F-83H-FIX-C] canonical resolver warning:",
        error?.message || error
      );
    }

    return fallbackCanonicalMap[key] || rawName;
  };

  const addRemedy = (remedy) => {

    if (!remedy) return;

    const name =
      remedy.name ||
      remedy.canonicalName ||
      remedy.canonical ||
      "";

    if (!name) return;

    const canonicalName = resolveCanonical(remedy);

    const existing = remediesMap.get(name);

    if (!existing) {

      remediesMap.set(name, {
        name,
        score: remedy.score || 0,
        finalScore:
          remedy.finalScore ||
          remedy.score ||
          0,

        canonicalName,
        canonical: canonicalName,

        totalGrade:
          remedy.totalGrade || 0,

        rawTotalityScore:
          remedy.rawTotalityScore || 0,

        rubricsCovered:
          remedy.rubricsCovered || 0
      });

    } else {

      if (
        !existing.canonicalName ||
        existing.canonicalName === existing.name
      ) {
        existing.canonicalName = canonicalName;
        existing.canonical = canonicalName;
      }

    }
  };

  if (
    repertoryEngineOutput &&
    Array.isArray(repertoryEngineOutput.remedies)
  ) {

    repertoryEngineOutput.remedies.forEach(addRemedy);

  }
  else if (
    repertoryEngineOutput &&
    Array.isArray(repertoryEngineOutput.rubrics)
  ) {

    repertoryEngineOutput.rubrics.forEach(rubric => {

      if (Array.isArray(rubric.remedies)) {

        rubric.remedies.forEach(addRemedy);

      }

    });

  }
  else {

    console.warn(
      "RepertoryEngineOutput did not contain expected 'remedies' or 'rubrics' array. Returning empty array."
    );

  }

  console.log(
    "[9F-83H-FIX-C] Canonical extraction:",
    JSON.stringify(
      Array.from(remediesMap.values()).map(r => ({
        name: r.name,
        canonicalName: r.canonicalName,
        canonical: r.canonical
      }))
    )
  );

  return Array.from(remediesMap.values());
},

  /**
   * Helper function to calculate Mental Score for a remedy.
   * @param {Object} remedy - The remedy object.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @param {Object} repertoryEngineOutput - Raw output from the Repertory Engine.
   * @returns {number} The calculated Mental Score.
   */
  _getRubricDetailsForScoring(rubricId, rubric) {
    const hierarchyDetails = rubricHierarchyService.getRubricDetails?.(rubricId);
    if (hierarchyDetails && Object.keys(hierarchyDetails).length > 0) {
      return hierarchyDetails;
    }

    const ontologyDetails = clinicalOntologyService.getRubricDetails?.(rubricId);
    if (ontologyDetails && Object.keys(ontologyDetails).length > 0) {
      return ontologyDetails;
    }

    const source = rubric || {};
    const chapter = String(source.chapter || "").toUpperCase();

    if (chapter === "MIND") {
      return { ...source, rubricType: "Mental" };
    }

    if (chapter === "GENERALITIES" || chapter === "GENERALS") {
      return { ...source, rubricType: "PhysicalGeneral" };
    }

    return { ...source, rubricType: "ParticularSymptom" };
  },
  _calculateMentalScoreForRemedy(remedy, top25Rubrics, patientClinicalProfile, repertoryEngineOutput) {
    let mentalScore = 0;
    const MENTAL_GENERAL_MATCH_WEIGHT = 25; 
    const MENTAL_PQRS_RUBRIC_WEIGHT_FACTOR = 1.8;
    const MENTAL_RUBRIC_PRIORITY_BASE = 0.8; 
    const MAX_GRADE = 1;

    // Assume that clinicalOntologyService.getRemedyMentalAffinities?.(remedy.name) provides key mental traits for a remedy
    const remedyMentalAffinities = clinicalOntologyService.getRemedyMentalAffinities?.(remedy.name) || [];
    const patientMentalSymptoms = patientClinicalProfile.mentalSymptoms || []; // Assuming patientClinicalProfile has mentalSymptoms

    // 1. Score based on matching patient\'s mental symptoms with remedy\'s known mental affinities
    patientMentalSymptoms.forEach(patientSymptom => {
      if (remedyMentalAffinities.some(affinity => affinity.toLowerCase().includes(patientSymptom.toLowerCase()))) {
        mentalScore += MENTAL_GENERAL_MATCH_WEIGHT; 
      }
    });

    // 2. Score based on mental rubrics covered by the remedy from top25Rubrics
    const rubricRemedyGrades = repertoryEngineOutput.rubricRemedyGrades || {};
    for (const rubric of top25Rubrics) {
      const rubricId = rubric.id; 
      const remedyGrade = this._getRemedyGradeForRubric(remedy, rubric, repertoryEngineOutput);

      if (remedyGrade > 0) { 
        const rubricDetails = this._getRubricDetailsForScoring(rubricId, rubric);
        
        // Assuming a rubricType property (e.g., 'Mental', 'Physical', 'General', 'Characteristic')
        if (rubricDetails.rubricType === 'Mental') {
          let rubricContribution = remedyGrade / MAX_GRADE; // Normalize grade

          if (rubricDetails.isPQRS) { 
            rubricContribution *= MENTAL_PQRS_RUBRIC_WEIGHT_FACTOR;
          }
          // Assuming a mentalPriority property (0-1, or 1-10 scale) for mental rubrics
          rubricContribution *= (rubricDetails.mentalPriority || MENTAL_RUBRIC_PRIORITY_BASE);

          mentalScore += rubricContribution * 10; // Scale contribution
        }
      }
    }

    return Math.min(100, Math.max(0, Math.round(mentalScore))); // Cap score between 0-100
  },

  /**
   * Helper function to calculate Constitutional Score for a remedy.
   * @param {Object} remedy - The remedy object.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @returns {number} The calculated Constitutional Score.
   */
  _calculateConstitutionalScoreForRemedy(remedy, patientClinicalProfile) {
    let constitutionalScore = 0;
    const PROFILE_MATCH_WEIGHT = 15; 

    // Assume interpreters exist and provide a compatibility score or matching indicator
    const thermalCompatibility = ThermalInterpreter?.getRemedyCompatibility?.(remedy.name, patientClinicalProfile.thermals) || 0;
    const thirstCompatibility = ThirstInterpreter?.getRemedyCompatibility?.(remedy.name, patientClinicalProfile.thirst) || 0;
    const cravingsCompatibility = CravingsInterpreter?.prototype?.getRemedyCompatibility ? new CravingsInterpreter().getRemedyCompatibility(remedy.name, patientClinicalProfile.cravings) : 0 || 0;
    const sleepCompatibility = SleepInterpreter?.prototype?.getRemedyCompatibility ? new SleepInterpreter().getRemedyCompatibility(remedy.name, patientClinicalProfile.sleep) : 0 || 0;
    const dreamsCompatibility = DreamsInterpreter?.prototype?.getRemedyCompatibility ? new DreamsInterpreter().getRemedyCompatibility(remedy.name, patientClinicalProfile.dreams) : 0 || 0;

    // Sum up compatibility scores from various constitutional aspects
    constitutionalScore += thermalCompatibility * PROFILE_MATCH_WEIGHT;
    constitutionalScore += thirstCompatibility * PROFILE_MATCH_WEIGHT;
    constitutionalScore += cravingsCompatibility * PROFILE_MATCH_WEIGHT;
    constitutionalScore += sleepCompatibility * PROFILE_MATCH_WEIGHT;
    constitutionalScore += dreamsCompatibility * PROFILE_MATCH_WEIGHT;

    // Also consider physical generals from patient profile matched against remedy profile (e.g., using constitutionalPriorityService)
    const physicalGeneralsMatch = constitutionalPriorityService.getRemedyPhysicalGeneralMatch?.(remedy.name, patientClinicalProfile.physicalGenerals) || 0;
    constitutionalScore += physicalGeneralsMatch * PROFILE_MATCH_WEIGHT;

    return Math.min(100, Math.max(0, Math.round(constitutionalScore)));
  },

  /**
   * Helper function to calculate Characteristic Score for a remedy.
   * @param {Object} remedy - The remedy object.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics.
   * @param {Object} repertoryEngineOutput - Raw output from the Repertory Engine.
   * @returns {number} The calculated Characteristic Score.
   */
  _calculateCharacteristicScoreForRemedy(remedy, top25Rubrics, repertoryEngineOutput) {
    let characteristicScore = 0;
    const CHARACTERISTIC_RUBRIC_WEIGHT = 2.5; 
    const MAX_GRADE = 4;

    const rubricRemedyGrades = repertoryEngineOutput.rubricRemedyGrades || {};
    for (const rubric of top25Rubrics) {
      const rubricId = rubric.id; 
      const remedyGrade = this._getRemedyGradeForRubric(remedy, rubric, repertoryEngineOutput);

      if (remedyGrade > 0) {
        const rubricDetails = this._getRubricDetailsForScoring(rubricId, rubric);
        
        // Assuming properties like isCharacteristic, isStrange, isRare, isPeculiar
        if (rubricDetails.isCharacteristic || rubricDetails.isStrange || rubricDetails.isRare || rubricDetails.isPeculiar) {
          let rubricContribution = remedyGrade / MAX_GRADE; 
          rubricContribution *= CHARACTERISTIC_RUBRIC_WEIGHT;
          characteristicScore += rubricContribution * 15; 
        }
      }
    }
    return Math.min(100, Math.max(0, Math.round(characteristicScore)));
  },

  /**
   * Helper function to calculate Physical Score for a remedy.
   * @param {Object} remedy - The remedy object.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @param {Object} repertoryEngineOutput - Raw output from the Repertory Engine.
   * @returns {number} The calculated Physical Score.
   */
  _calculatePhysicalScoreForRemedy(remedy, top25Rubrics, patientClinicalProfile, repertoryEngineOutput) {
    let physicalScore = 0;
    const PHYSICAL_GENERAL_MATCH_WEIGHT = 20; 
    const PARTICULAR_SYMPTOM_WEIGHT = 10;
    const MAX_GRADE = 4;

    // 1. Score based on matching patient\'s physical generals with remedy\'s known physical affinities
    const remedyPhysicalAffinities = clinicalOntologyService.getRemedyPhysicalAffinities?.(remedy.name) || []; // Assume this exists
    const patientPhysicalGenerals = patientClinicalProfile.physicalGenerals || [];
    patientPhysicalGenerals.forEach(patientSymptom => {
      if (remedyPhysicalAffinities.some(affinity => affinity.toLowerCase().includes(patientSymptom.toLowerCase()))) {
        physicalScore += PHYSICAL_GENERAL_MATCH_WEIGHT;
      }
    });

    // 2. Score based on physical and particular rubrics from Top-25 Rubrics
    const rubricRemedyGrades = repertoryEngineOutput.rubricRemedyGrades || {};
    for (const rubric of top25Rubrics) {
      const rubricId = rubric.id; 
      const remedyGrade = this._getRemedyGradeForRubric(remedy, rubric, repertoryEngineOutput);

      if (remedyGrade > 0) {
        const rubricDetails = this._getRubricDetailsForScoring(rubricId, rubric);
        
        // Assuming a rubricType property
        if (rubricDetails.rubricType === 'PhysicalGeneral') {
          physicalScore += (remedyGrade / MAX_GRADE) * PHYSICAL_GENERAL_MATCH_WEIGHT; // Scale by normalized grade
        } else if (rubricDetails.rubricType === 'ParticularSymptom') {
          physicalScore += (remedyGrade / MAX_GRADE) * PARTICULAR_SYMPTOM_WEIGHT;
        }
      }
    }
    // Organ affinities are handled separately in _calculateOrganAffinityScoreForRemedy

    return Math.min(100, Math.max(0, Math.round(physicalScore)));
  },

  /**
   * Helper function to calculate Chief Complaint Score for a remedy.
   * @param {Object} remedy - The remedy object.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @param {Object} repertoryEngineOutput - Raw output from the Repertory Engine.
   * @returns {number} The calculated Chief Complaint Score.
   */
  _calculateChiefComplaintScoreForRemedy(remedy, top25Rubrics, patientClinicalProfile, repertoryEngineOutput) {
    let chiefComplaintScore = 0;
    const CHIEF_COMPLAINT_RUBRIC_WEIGHT = 2.0; 
    const MAX_GRADE = 4;

    const patientChiefComplaint = patientClinicalProfile.chiefComplaint ? patientClinicalProfile.chiefComplaint.toLowerCase() : '';

    const rubricRemedyGrades = repertoryEngineOutput.rubricRemedyGrades || {};
    for (const rubric of top25Rubrics) {
      const rubricId = rubric.id; 
      const remedyGrade = this._getRemedyGradeForRubric(remedy, rubric, repertoryEngineOutput);

      if (remedyGrade > 0) {
        const rubricDetails = this._getRubricDetailsForScoring(rubricId, rubric);
        
        // If the rubric\'s text or associated concepts align with the chief complaint
        if (patientChiefComplaint && (rubricDetails.text && rubricDetails.text.toLowerCase().includes(patientChiefComplaint) || (clinicalOntologyService.isRubricRelatedToChiefComplaint?.(rubricId, patientChiefComplaint) ?? false))) { // Assume this helper exists
          let rubricContribution = remedyGrade / MAX_GRADE; 
          rubricContribution *= CHIEF_COMPLAINT_RUBRIC_WEIGHT;
          chiefComplaintScore += rubricContribution * 20; 
        }
      }
    }

    // Also, direct match of chief complaint with remedy affinities
    const remedyChiefComplaintAffinities = clinicalOntologyService.getRemedyChiefComplaintAffinities?.(remedy.name) || [];
    if (patientChiefComplaint && remedyChiefComplaintAffinities.some(affinity => affinity.toLowerCase().includes(patientChiefComplaint))) {
      chiefComplaintScore += 30; // Significant boost for direct affinity
    }

    return Math.min(100, Math.max(0, Math.round(chiefComplaintScore)));
  },

  /**
   * Helper function to calculate Pathological Score for a remedy.
   * @param {Object} remedy - The remedy object.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics.
   * @param {Object} repertoryEngineOutput - Raw output from the Repertory Engine.
   * @returns {number} The calculated Pathological Score.
   */
  _calculatePathologicalScoreForRemedy(remedy, top25Rubrics, repertoryEngineOutput) {
    let pathologicalScore = 0;
    const PATHOLOGICAL_RUBRIC_WEIGHT = 2.0; 
    const MAX_GRADE = 4;

    const rubricRemedyGrades = repertoryEngineOutput.rubricRemedyGrades || {};
    for (const rubric of top25Rubrics) {
      const rubricId = rubric.id; 
      const remedyGrade = this._getRemedyGradeForRubric(remedy, rubric, repertoryEngineOutput);

      if (remedyGrade > 0) {
        const rubricDetails = this._getRubricDetailsForScoring(rubricId, rubric);
        
        // Assuming a property like isPathological or a pathological stage indicator
        if (rubricDetails.isPathological) {
          let rubricContribution = remedyGrade / MAX_GRADE; 
          rubricContribution *= PATHOLOGICAL_RUBRIC_WEIGHT;
          pathologicalScore += rubricContribution * 15; 
        }
      }
    }
    return Math.min(100, Math.max(0, Math.round(pathologicalScore)));
  },

  /**
   * Helper function to calculate Organ Affinity Score for a remedy.
   * @param {Object} remedy - The remedy object.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @param {Object} repertoryEngineOutput - Raw output from the Repertory Engine.
   * @returns {number} The calculated Organ Affinity Score.
   */
  _calculateOrganAffinityScoreForRemedy(remedy, top25Rubrics, patientClinicalProfile, repertoryEngineOutput) {
    let organAffinityScore = 0;
    const ORGAN_MATCH_WEIGHT = 25; 
    const RUBRIC_ORGAN_AFFINITY_WEIGHT = 1.5;
    const MAX_GRADE = 4;

    // 1. Score based on patient\'s affected organs/systems matching remedy\'s known organ affinities
    const remedyOrganAffinities = clinicalOntologyService.getRemedyOrganAffinities?.(remedy.name) || []; // Assume this exists
    const patientAffectedOrgans = patientClinicalProfile.affectedOrgans || []; // Assuming patientClinicalProfile has affectedOrgans

    patientAffectedOrgans.forEach(patientOrgan => {
      if (remedyOrganAffinities.some(affinity => affinity.toLowerCase().includes(patientOrgan.toLowerCase()))) {
        organAffinityScore += ORGAN_MATCH_WEIGHT; 
      }
    });

    // 2. Score based on rubrics related to specific organs/systems from Top-25 Rubrics
    const rubricRemedyGrades = repertoryEngineOutput.rubricRemedyGrades || {};
    for (const rubric of top25Rubrics) {
      const rubricId = rubric.id; 
      const remedyGrade = this._getRemedyGradeForRubric(remedy, rubric, repertoryEngineOutput);

      if (remedyGrade > 0) {
        const rubricDetails = this._getRubricDetailsForScoring(rubricId, rubric);
        
        // Assuming rubricDetails.organAffinity or similar property
        if (rubricDetails.organAffinity && patientAffectedOrgans.some(organ => rubricDetails.organAffinity.toLowerCase().includes(organ.toLowerCase()))) {
          let rubricContribution = remedyGrade / MAX_GRADE; 
          rubricContribution *= RUBRIC_ORGAN_AFFINITY_WEIGHT;
          organAffinityScore += rubricContribution * 10; 
        }
      }
    }

    return Math.min(100, Math.max(0, Math.round(organAffinityScore)));
  },

  /**
   * Applies clinical priority scoring based on patient clinical profile.
   * This function will determine Mental, Constitutional, Physical, Characteristic, Chief Complaint,
   * Pathological, and Organ Affinity Scores.
   * @param {Array<Object>} scoredRemedies - Remedies with coverage scores.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @returns {Array<Object>} Remedies with updated clinical priority scores.
   */
  _applyRemedyCoverageScoring(scoredRemedies, top25Rubrics, repertoryEngineOutput) {
    const rubrics = Array.isArray(top25Rubrics)
      ? top25Rubrics
      : [];

    const totalRubrics = rubrics.length;

    const normalizeName = (name) =>
      String(name || "")
        .toUpperCase()
        .replace(/\./g, "")
        .trim();

    return scoredRemedies.map(remedy => {
      const remedyName = normalizeName(remedy.name);
      let coveredRubrics = 0;

      for (const rubric of rubrics) {
        if (!rubric) continue;

        const rubricRemedies = rubric.remedies;

        if (Array.isArray(rubricRemedies)) {
          const matched = rubricRemedies.some(item =>
            normalizeName(item?.name || item) === remedyName
          );

          if (matched) coveredRubrics++;
        } else if (rubricRemedies && typeof rubricRemedies === "object") {
          const matched = Object.keys(rubricRemedies).some(name =>
            normalizeName(name) === remedyName
          );

          if (matched) coveredRubrics++;
        }
      }

      remedy.rubricsCovered = coveredRubrics;

      remedy.coverageScore = totalRubrics > 0
        ? Math.min(100, Math.round((coveredRubrics / totalRubrics) * 100))
        : 0;

      return remedy;
    });
  },
  _applyClinicalPriorityScoring(scoredRemedies, top25Rubrics, patientClinicalProfile, repertoryEngineOutput) {
    return scoredRemedies.map(remedy => {
      remedy.mentalScore = this._calculateMentalScoreForRemedy(remedy, top25Rubrics, patientClinicalProfile, repertoryEngineOutput);
      remedy.constitutionalScore = this._calculateConstitutionalScoreForRemedy(remedy, patientClinicalProfile);
      remedy.physicalScore = this._calculatePhysicalScoreForRemedy(remedy, top25Rubrics, patientClinicalProfile, repertoryEngineOutput);
      remedy.characteristicScore = this._calculateCharacteristicScoreForRemedy(remedy, top25Rubrics, repertoryEngineOutput);
      remedy.chiefComplaintScore = this._calculateChiefComplaintScoreForRemedy(remedy, top25Rubrics, patientClinicalProfile, repertoryEngineOutput);
      remedy.pathologicalScore = this._calculatePathologicalScoreForRemedy(remedy, top25Rubrics, repertoryEngineOutput);
      remedy.organAffinityScore = this._calculateOrganAffinityScoreForRemedy(remedy, top25Rubrics, patientClinicalProfile, repertoryEngineOutput);
      return remedy;
    });
  },

  /**
   * Applies clinical priority scoring based on patient clinical profile.
   * This function will determine Mental, Constitutional, Physical, Characteristic, Chief Complaint,
   * Pathological, and Organ Affinity Scores.
   * @param {Array<Object>} scoredRemedies - Remedies with coverage scores.
   * @param {Array<Object>} top25Rubrics - List of top 25 rubrics.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @returns {Array<Object>} Remedies with updated clinical priority scores.
   */

  /**
   * Applies Materia Medica intelligence to score remedies.
   * This involves looking up remedies in a Materia Medica database
   * and scoring them based on patient\`s unique clinical profile and symptoms.
   * @param {Array<Object>} scoredRemedies - Remedies with clinical priority scores.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @returns {Promise<Array<Object>>} Remedies with updated Materia Medica scores.
   */
  async _applyMateriaMedicaIntelligence(scoredRemedies, patientClinicalProfile) {
    // Dynamically import required services which were listed in the environment details.
    const remedyRelationshipService = require('./remedyRelationshipService.js');
    const constitutionalPriorityService = require('./constitutionalPriorityService.js');
    // clinicalOntologyService is already imported at the top.

    return scoredRemedies.map(remedy => {
      let materiaMedicaScore = 0;

      const KEYNOTE_MATCH_WEIGHT = 0.40; // Max 40 points
      const RELATIONSHIP_WEIGHT = 0.20; // Max 20 points
      const CLINICAL_CONFIRM_WEIGHT = 0.25; // Max 25 points
      const CONSTITUTIONAL_CONFIRM_WEIGHT = 0.15; // Max 15 points

      // 1. Score based on Remedy Keynotes matching patient\`s profile
      // Assuming keynoteConfirmationService.getRemedyKeynotesMatch returns a score between 0 and 100
            const keynoteSymptoms = [
        ...(patientClinicalProfile.mentalSymptoms || []),
        ...(patientClinicalProfile.physicalGenerals || []),
        patientClinicalProfile.chiefComplaint || "",
        ...(patientClinicalProfile.cravings || []),
        ...(patientClinicalProfile.sleep || [])
      ].filter(Boolean);

      // 9F-18: Delegate remedy-name / abbreviation resolution to
      // keynoteConfirmationService's existing canonical resolver.
      // Do NOT maintain a duplicate abbreviation map here.
      const keynoteName =
        remedy?.canonicalName ||
        remedy?.canonical ||
        remedy?.name ||
        "";

      const keynoteResult = keynoteConfirmationService.confirmRemedies(
        [keynoteName],
        keynoteSymptoms
      )[0];

      const keynoteMatchScore = keynoteResult?.confirmationScore || 0;
      materiaMedicaScore += (keynoteMatchScore * KEYNOTE_MATCH_WEIGHT);

      // 2. Score based on Remedy Relationships
      // Assuming remedyRelationshipService.getRemedyRelationshipScore returns a score between 0 and 100
      const relatedRemedyScore = remedyRelationshipService.getRemedyRelationshipScore?.(remedy.name, patientClinicalProfile) || 0;
      materiaMedicaScore += (relatedRemedyScore * RELATIONSHIP_WEIGHT);

      // 3. Score based on Clinical Confirmations
      // Assuming clinicalOntologyService.getRemedyClinicalConfirmations returns a score between 0 and 100
      const clinicalConfirmationScore = clinicalOntologyService.getRemedyClinicalConfirmations?.(remedy.name, patientClinicalProfile) || 0;
      materiaMedicaScore += (clinicalConfirmationScore * CLINICAL_CONFIRM_WEIGHT);

      // 4. Score based on Constitutional Confirmations
      // Assuming constitutionalPriorityService.getRemedyConstitutionalConfirmations returns a score between 0 and 100
      const constitutionalConfirmationScore = constitutionalPriorityService.getRemedyConstitutionalConfirmations?.(remedy.name, patientClinicalProfile) || 0;
      materiaMedicaScore += (constitutionalConfirmationScore * CONSTITUTIONAL_CONFIRM_WEIGHT);
      
      // Normalize and cap the score to 0-100
      remedy.materiaMedicaScore = Math.min(100, Math.max(0, Math.round(materiaMedicaScore)));
      return remedy;
    });
  },

  /**
   * Calculates the total remedy score for each remedy.
   * This combines all individual scores into a single weighted total.
   * The weights here are examples and should be clinically determined.
   * @param {Array<Object>} scoredRemedies - Remedies with all individual scores.
   * @returns {Array<Object>} Remedies with calculated total remedy scores.
   */
  // ============================================================
  // 9E-1: MIASMATIC INTELLIGENCE
  // ============================================================
  // Determines the case-level miasmatic profile and attaches it
  // to every remedy for physician/audit visibility.
  //
  // IMPORTANT:
  // This stage does NOT change remedy ranking yet.
  // miasmaticScore remains 0 until validated remedy-miasm
  // compatibility data is available.
  // ============================================================
  // ============================================================
  // 9E-1A: VALIDATED REMEDY ↔ MIASM COMPATIBILITY
  // ============================================================
  // Uses the existing Constitutional & Miasmatic Mapping.json.
  // Case-level miasm scores come from miasmaticIntelligenceService.
  // Returns a transparent 0–100 compatibility score.
  // ============================================================

  _calculateMiasmaticCompatibility(remedy, miasmaticAnalysis) {
    const caseScores = miasmaticAnalysis?.scores || {};

    const totalCaseScore = Object.values(caseScores)
      .reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);

    // No miasmatic evidence → no miasmatic influence.
    if (totalCaseScore <= 0) {
      return 0;
    }

    const remedyMiasms = Array.isArray(remedy?._validatedMiasms)
      ? remedy._validatedMiasms
      : [];

    if (remedyMiasms.length === 0) {
      return 0;
    }

    const normalizeMiasm = (value) => {
      const key = String(value || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

      const aliases = {
        psora: "psora",
        psoric: "psora",
        sycosis: "sycosis",
        sycotic: "sycosis",
        syphilis: "syphilis",
        syphilitic: "syphilis",
        tubercular: "tubercular",
        tuberculosis: "tubercular",
        cancerinic: "cancerinic",
        cancer: "cancerinic"
      };

      return aliases[key] || null;
    };

    const coveredScore = remedyMiasms.reduce((sum, miasm) => {
      const normalized = normalizeMiasm(miasm);
      return sum + (normalized ? Math.max(0, Number(caseScores[normalized]) || 0) : 0);
    }, 0);

    return Math.round(
      Math.min(100, Math.max(0, (coveredScore / totalCaseScore) * 100))
    );
  },
  _applyMiasmaticIntelligence(scoredRemedies, patientClinicalProfile) {

    const profile = patientClinicalProfile || {};

    const evidence = [
      ...(Array.isArray(profile.mentalSymptoms) ? profile.mentalSymptoms : []),
      ...(Array.isArray(profile.physicalGenerals) ? profile.physicalGenerals : []),
      ...(Array.isArray(profile.symptoms) ? profile.symptoms : []),
      ...(Array.isArray(profile.particularSymptoms) ? profile.particularSymptoms : []),
      ...(Array.isArray(profile.chiefComplaints) ? profile.chiefComplaints : []),
      ...(profile.chiefComplaint ? [profile.chiefComplaint] : []),
      ...(Array.isArray(profile.cravings) ? profile.cravings : []),
      ...(Array.isArray(profile.modalities) ? profile.modalities : []),
      ...(Array.isArray(profile.sleep) ? profile.sleep : []),
      ...(Array.isArray(profile.dreams) ? profile.dreams : [])
    ]
      .flat()
      .filter(value =>
        value !== null &&
        value !== undefined &&
        String(value).trim().length > 0
      )
      .map(value => String(value).trim());

    let analysis = {
      dominantMiasm: null,
      secondaryMiasm: null,
      scores: {},
      matchedSymptoms: {}
    };

    if (evidence.length > 0) {
      try {
        analysis = miasmaticIntelligenceService.analyzeMiasm(evidence);
      } catch (error) {
        console.warn(
          "[9E-1 MIASMATIC] Analysis failed:",
          error?.message || error
        );
      }
    }

    const miasmaticProfile = {
      dominantMiasm: analysis?.dominantMiasm || null,
      secondaryMiasm: analysis?.secondaryMiasm || null,
      scores: analysis?.scores || {},
      matchedSymptoms: analysis?.matchedSymptoms || {},
      evidenceCount: evidence.length,
      status:
        evidence.length === 0
          ? "NO_MIASMATIC_EVIDENCE"
          : analysis?.dominantMiasm
            ? "ANALYZED"
            : "NO_MIASMATIC_MATCH"
    };

    console.log(
      "[9E-1 MIASMATIC PROFILE]",
      JSON.stringify(miasmaticProfile)
    );

    // ============================================================
    // 9E-1E: REMEDY MIASM MAPPING BRIDGE
    // ============================================================
    // Connect validated remedy -> miasm data to the existing
    // case-level miasmatic analysis.
    //
    // IMPORTANT:
    // - Does NOT create new miasmatic data.
    // - Does NOT modify the case-level analysis.
    // - Does NOT modify any other remedy score.
    // - miasmaticScore remains 0 when the remedy is not mapped.
    // ============================================================

    let validatedMiasmMapping = [];

    try {
      const fs = require("fs");
      const path = require("path");

      const mappingPath = path.join(
        __dirname,
        "..",
        "utils",
        "brain",
        "remedyMiasmMapping.json"
      );

      if (fs.existsSync(mappingPath)) {
        validatedMiasmMapping = JSON.parse(
          fs.readFileSync(mappingPath, "utf8")
        );

        if (!Array.isArray(validatedMiasmMapping)) {
          validatedMiasmMapping = [];
        }
      }
    } catch (error) {
      console.warn(
        "[9E-1E MIASMATIC] Mapping load failed:",
        error?.message || error
      );
      validatedMiasmMapping = [];
    }

    const normalizeRemedyName = (value) =>
      String(value || "")
        .toLowerCase()
        .replace(/[.\-']/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const validatedMiasmByRemedy = new Map();

    for (const entry of validatedMiasmMapping) {
      const key = normalizeRemedyName(entry?.remedy);

      if (!key) continue;

      const miasms = Array.isArray(entry?.miasms)
        ? entry.miasms
            .map(value => String(value || "").trim())
            .filter(Boolean)
        : [];

      if (miasms.length > 0) {
        validatedMiasmByRemedy.set(key, miasms);
      }
    }

    console.log(
      "[9E-1E MIASMATIC MAPPING]",
      JSON.stringify({
        loadedEntries: validatedMiasmByRemedy.size
      })
    );

    return scoredRemedies.map(remedy => {
      const remedyName =
        remedy?.canonicalName ||
        remedy?.name ||
        "";

      const mappingKey = normalizeRemedyName(remedyName);

      const validatedMiasms =
        validatedMiasmByRemedy.get(mappingKey) || [];

      const remedyWithMiasmData = {
        ...remedy,
        _validatedMiasms: validatedMiasms
      };

      const miasmaticScore =
        this._calculateMiasmaticCompatibility(
          remedyWithMiasmData,
          analysis
        );

      return {
        ...remedyWithMiasmData,
        miasmaticScore,
        miasmaticProfile
      };
    });
  },
  _calculateTotalRemedyScore(scoredRemedies) {
    return scoredRemedies.map(remedy => {
      // Existing 100% architecture redistributed to include 5% miasmatic influence.
      // Existing components retain their relative proportions within the remaining 95%.
      const weights = {
        repertory: 0.2375,
        coverage: 0.07125,
        mental: 0.106875,
        constitutional: 0.106875,
        physical: 0.07125,
        characteristic: 0.1425,
        chiefComplaint: 0.07125,
        pathological: 0.035625,
        organAffinity: 0.035625,
        materiaMedica: 0.07125,
        miasmatic: 0.05,
      };

      const repertoryScore = Math.min(
        100,
        Math.max(0, Number(remedy.repertoryFinalScore) || 0)
      );

      const miasmaticScore = Math.min(
        100,
        Math.max(0, Number(remedy.miasmaticScore) || 0)
      );

      const total =
        repertoryScore * weights.repertory +
        remedy.coverageScore * weights.coverage +
        remedy.mentalScore * weights.mental +
        remedy.constitutionalScore * weights.constitutional +
        remedy.physicalScore * weights.physical +
        remedy.characteristicScore * weights.characteristic +
        remedy.chiefComplaintScore * weights.chiefComplaint +
        remedy.pathologicalScore * weights.pathological +
        remedy.organAffinityScore * weights.organAffinity +
        remedy.materiaMedicaScore * weights.materiaMedica +
        miasmaticScore * weights.miasmatic;

      remedy.totalRemedyScore = Math.round(total);
      return remedy;
    });
  },
  /**
   * Applies remedy differentiation logic.
   * As per the constraints, this cannot introduce new services.
   * This will be a simplified re-ranking based on existing scores or specific rules.
   * @param {Array<Object>} top10Remedies - The top 10 remedies before differentiation.
   * @param {Object} patientClinicalProfile - Detailed clinical profile.
   * @returns {Array<Object>} Differentiated and potentially re-ranked remedies.
   */
  _applyRemedyDifferentiation(top10Remedies, patientClinicalProfile) {
    // Given the "NO NEW SERVICES" and "ARCHITECTURE IS COMPLETELY FROZEN" constraints,
    // this step will primarily involve re-evaluating the existing scores or applying
    // simple rules based on the patient profile to slightly adjust rankings among the top candidates.
    // For instance, if a patient has a very strong keynote symptom, and two remedies have similar total scores,
    // the one with higher characteristic score (indicating stronger keynote match) might be favored.

    // For this implementation, we will apply a minor re-ordering for demonstration purposes
    // based on an arbitrary secondary criteria (e.g., characteristic score if total scores are very close).
    const differentiated = [...top10Remedies];

    differentiated.sort((a, b) => {
      // If total scores are very close, use characteristic score as a tie-breaker
      if (Math.abs(b.totalRemedyScore - a.totalRemedyScore) < 2) {
        return b.characteristicScore - a.characteristicScore;
      }
      return b.totalRemedyScore - a.totalRemedyScore;
    });

    return differentiated;
  }
};

module.exports = FinalRemedyRankingService;






























