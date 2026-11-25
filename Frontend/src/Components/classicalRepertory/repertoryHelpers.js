/**
 * @format
 * @fileoverview Helper functions for classical repertory analysis.
 */

// Configurable constant for thermal bonus points.
const THERMAL_BONUS = 5;

/**
 * Extracts all unique symptom strings from various fields within the case data.
 *
 * @param {object} caseData - The complete case data object.
 * @returns {string} A single string of concatenated symptoms.
 */
export function addSymptoms(caseData) {
  let symptoms = [];

  if (!caseData) {
    return [];
  }

  // Helper function to add symptom values with appropriate splitting
  // Helper function to add symptom values with appropriate splitting
  function addSymptomValue(
    fieldName,
    sourceValue,
    symptomsArray,
    parentComplaintContext = "",
  ) {
    if (!sourceValue) return;

    let values = [];
    if (Array.isArray(sourceValue)) {
      values = sourceValue.filter((s) => s.trim().length > 0);
    } else if (typeof sourceValue === "string") {
      if (
        fieldName === "Chief Complaint Modalities" ||
        fieldName === "General Remarks" ||
        fieldName === "History of Present Illness" ||
        fieldName === "Mental Symptoms" ||
        fieldName === "Doctor Observations" ||
        fieldName === "Family History" ||
        fieldName === "Past History" ||
        fieldName === "Habits" ||
        fieldName === "Menstrual History"
      ) {
        values = sourceValue
          .split(/\n|;/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      } else {
        values = [sourceValue.trim()];
      }
    }

    values.forEach((value) => {
      if (value) {
        const entry = { field: fieldName, value: value };
        if (parentComplaintContext) {
          entry.parentComplaintContext = parentComplaintContext.trim();
        }
        symptomsArray.push(entry);
      }
    });
  }

  // 1. Chief Complaint fields
  if (Array.isArray(caseData.chiefComplaints)) {
    caseData.chiefComplaints.forEach((complaintObj) => {
      const parentComplaintContext =
        typeof complaintObj?.complaint === "string"
          ? complaintObj.complaint.trim()
          : "";

      addSymptomValue("Chief Complaint", complaintObj.complaint, symptoms);
      addSymptomValue(
        "Chief Complaint Description",
        complaintObj.description,
        symptoms,
        parentComplaintContext,
      );
      // Modalities can be string or array
      if (complaintObj.modalities) {
        addSymptomValue(
          "Chief Complaint Modalities",
          complaintObj.modalities,
          symptoms,
          parentComplaintContext,
        );
      }
    });
  }

  // 2. History of Present Illness
  addSymptomValue(
    "History of Present Illness",
    caseData.historyPresentIllness,
    symptoms,
  );

  // 3. Mental Symptoms
  addSymptomValue("Mental Symptoms", caseData.mentalSymptoms, symptoms);

  // 4. Doctor Observations
  addSymptomValue(
    "Doctor Observations",
    caseData.observationsByDoctor,
    symptoms,
  );

  // 5. Family History
  addSymptomValue("Family History", caseData.familyHistory, symptoms);

  // 6. Past History
  addSymptomValue("Past History", caseData.pastHistory, symptoms);

  // 7. personalHistory fields (generals and physical generals)
  if (caseData.personalHistory) {
    const personalHistoryFields = {
      appetite: "Appetite",
      cravings: "Cravings",
      Aversions: "Aversions", // Corrected casing
      thirst: "Thirst",
      bowel: "Bowel",
      urine: "Urine",
      sleep: "Sleep",
      dreams: "Dreams",
      sweat: "Sweat",
      habits: "Habits", // Added
      menstrual: "Menstrual History", // Added
    };

    for (const key in personalHistoryFields) {
      if (caseData.personalHistory[key]) {
        addSymptomValue(
          personalHistoryFields[key],
          caseData.personalHistory[key],
          symptoms,
        );
      }
    }
  }

  // 8. General Remarks
  addSymptomValue("General Remarks", caseData.generalRemarks, symptoms);

  // Filter out any symptoms with empty values that might have slipped through
  const cleanedSymptoms = symptoms.filter(
    (s) => s.value && s.value.trim().length > 0,
  );

  console.log(
    "FRONTEND COLLECTED STRUCTURED SYMPTOMS:",
    JSON.stringify(cleanedSymptoms, null, 2),
  );

  return cleanedSymptoms;
}

// The splitMultiSymptoms function is no longer needed if we are returning structured arrays
// and handling splitting within addSymptomValue.
// Keep extractThermal as is.

/**
 * Extracts the patient's thermal preference from the case data.
 *
 * @param {object} caseData - The complete case data object.
 * @returns {"Hot" | "Chilly" | "Unknown"} The thermal preference.
 */
export function extractThermal(caseData) {
  if (
    caseData &&
    caseData.personalHistory &&
    typeof caseData.personalHistory.thermal === "string"
  ) {
    const thermalPreference = caseData.personalHistory.thermal.toLowerCase();
    if (thermalPreference.includes("hot")) {
      return "Hot";
    }
    if (
      thermalPreference.includes("chilly") ||
      thermalPreference.includes("cold")
    ) {
      return "Chilly";
    }
  }
  return "Unknown";
}

/**
 * Normalizes a rubric object to a standard format.
 * Assumes the input rubric object already contains 'name', 'chapter', 'grade', and 'source'.
 *
 * @param {object} rubric - The rubric object to normalize.
 * @param {string} rubric.name - The name of the rubric.
 * @param {string} rubric.chapter - The chapter the rubric belongs to.
 * @param {number} rubric.grade - The grade/intensity of the rubric.
 * @param {string} rubric.source - The source of the rubric.
 * @returns {{name: string, chapter: string, grade: number, source: string}} The standardized rubric object.
 */
export function normalizeRubric(rubric) {
  // Ensure the returned object only contains the specified properties.
  return {
    name: rubric.name || "",
    chapter: rubric.chapter || "",
    grade: rubric.grade || 0,
    source: rubric.source || "",
  };
}

/**
 * Sorts an array of remedies based on their finalScore in descending order.
 *
 * @param {object[]} remedies - An array of remedy objects, each with a 'finalScore' property.
 * @returns {object[]} The sorted array of remedies.
 */
export function sortRemedies(remedies) {
  // Create a shallow copy to avoid modifying the original array
  return [...remedies].sort(
    (a, b) => (b.finalScore || 0) - (a.finalScore || 0),
  );
}

/**
 * Calculates bonus points for a remedy based on its thermal affinity and the patient's thermal preference.
 *
 * @param {object} remedy - The remedy object, expected to have a 'thermal' property (e.g., "Hot", "Chilly").
 * @param {"Hot" | "Chilly" | "Unknown"} patientThermal - The patient's thermal preference.
 * @returns {number} The bonus points (THERMAL_BONUS or 0).
 */
export function calculateThermalBonus(remedy, patientThermal) {
  if (!remedy || typeof remedy.thermal !== "string") {
    return 0; // Remedy thermal information is missing or invalid
  }

  const remedyThermal = remedy.thermal.toLowerCase();
  const patientThermalLower = patientThermal.toLowerCase();

  if (patientThermalLower === "hot" && remedyThermal.includes("hot")) {
    return THERMAL_BONUS;
  }
  if (
    patientThermalLower === "chilly" &&
    (remedyThermal.includes("chilly") || remedyThermal.includes("cold"))
  ) {
    return THERMAL_BONUS;
  }
  return 0;
}
