const fs = require('fs');
const path = require('path');

const THERMAL_DATA_PATH = path.join(__dirname, 'thermalProfiles_v2.json');
let thermalData = null;

// Load and parse thermal data once
function loadThermalData() {
  if (!thermalData) {
    try {
      const rawData = fs.readFileSync(THERMAL_DATA_PATH, 'utf8');
      thermalData = JSON.parse(rawData);
    } catch (error) {
      console.error(`Error loading thermal data from ${THERMAL_DATA_PATH}:`, error);
      return null;
    }
  }
  return thermalData;
}

// Helper to get unique remedies from a category (HOT, CHILLY, AMBITHERMAL)
function getUniqueRemedies(category) {
  const data = loadThermalData();
  if (!data || !data[category]) {
    return new Set();
  }

  let remedies = new Set();
  ['strongRemedies', 'moderateRemedies', 'possibleRemedies'].forEach(key => {
    if (data[category][key]) {
      data[category][key].forEach(remedy => remedies.add(remedy.toLowerCase().trim()));
    }
  });
  return remedies;
}

// Pre-process remedy sets for quick lookups
const hotRemedySet = getUniqueRemedies('HOT');
const chillyRemedySet = getUniqueRemedies('CHILLY');
const ambithermalRemedySet = getUniqueRemedies('AMBITHERMAL');

/**
 * Performs a thermal lookup for a given remedy name.
 * Normalizes the input for matching purposes (trim whitespace, case-insensitive).
 * @param {string} remedyName - The name of the remedy to look up.
 * @returns {{thermal: 'HOT' | 'CHILLY' | 'AMBITHERMAL' | 'UNKNOWN'}} - The thermal classification.
 */
function getThermalClassification(remedyName, patientThermalState = "UNKNOWN") {
  if (!remedyName) {
    return { thermal: "UNKNOWN", patientAlignment: "UNKNOWN" };
  }
  const normalizedRemedyName = remedyName.toLowerCase().trim();

  const isHot = hotRemedySet.has(normalizedRemedyName);
  const isChilly = chillyRemedySet.has(normalizedRemedyName);
  const isAmbithermal = ambithermalRemedySet.has(normalizedRemedyName);
  const normalizedPatientThermal = String(patientThermalState).toUpperCase();

  let remedyThermal = "UNKNOWN";

  if (normalizedPatientThermal === "CHILLY" && isChilly) {
    remedyThermal = "CHILLY";
  } else if (normalizedPatientThermal === "HOT" && isHot) {
    remedyThermal = "HOT";
  } else if (isAmbithermal) {
    remedyThermal = "AMBITHERMAL";
  } else if (isChilly) {
    remedyThermal = "CHILLY";
  } else if (isHot) {
    remedyThermal = "HOT";
  }

  let patientAlignment = "UNKNOWN";
  if (patientThermalState !== "UNKNOWN") {
    if (remedyThermal === "AMBITHERMAL") {
      patientAlignment = "NEUTRAL";
    } else if (remedyThermal === patientThermalState.toUpperCase()) {
      patientAlignment = "MATCH";
    } else if (remedyThermal !== "UNKNOWN") {
      patientAlignment = "CONTRADICTION";
    }
  }

  return { thermal: remedyThermal, patientAlignment };
}

// For the final report: Gather audit data here as well
const auditReport = {
  thermalDataFile: THERMAL_DATA_PATH,
  hotCount: hotRemedySet.size,
  chillyCount: chillyRemedySet.size,
  ambithermalCount: ambithermalRemedySet.size,
  remediesInBothHotAndChilly: Array.from(hotRemedySet).filter(r => chillyRemedySet.has(r)),
  datasetContainsAmbithermal: ambithermalRemedySet.size > 0,
  // This can't be fully determined programmatically without the repertory data
  casingAndAbbreviationsNote: "Cannot fully determine without repertory data. Assuming the casing in thermalProfiles_v2.json is the intended 'original' for display."
};

module.exports = {
  getThermalClassification,
  auditReport // Export audit report for verification
};




