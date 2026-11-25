
// Backend/services/constitutionalPriorityService.js

const SYMPTOM_CATEGORIES = {
    MENTAL_GENERALS: {
        category: "Mental Generals",
        weight: 10,
        keywords: [
            "fear", "anger", "jealousy", "grief", "anxiety", "weeping", "sadness",
            "irritability", "despair", "suicidal thoughts", "mind", "mental",
            "delusion", "memory", "intelligence", "concentration", "mood"
        ]
    },
    PHYSICAL_GENERALS: {
        category: "Physical Generals",
        weight: 7,
        keywords: [
            "thirst", "chilly", "hot patient", "food desires", "food aversions",
            "sleep", "sweat", "thermal state", "appetite", "general", "body"
        ]
    },
    PARTICULAR_SYMPTOMS: {
        category: "Particular Symptoms",
        weight: 4,
        keywords: [
            "headache", "constipation", "menses", "joint pain", "skin eruptions",
            "stomach", "pain", "eye", "ear", "nose", "throat", "chest", "abdomen",
            "extremity", "urination", "stool", "respiration"
        ]
    },
    COMMON_SYMPTOMS: {
        category: "Common Symptoms",
        weight: 2,
        keywords: [
            "fever", "cough", "cold", "body pain", "weakness", "nausea", "vomiting",
            "diarrhea", "dizziness", "fatigue"
        ]
    }
};

function categorizeSymptom(symptom) {
    const lowerCaseSymptom = symptom.toLowerCase();

    // Check Mental Generals
    for (const keyword of SYMPTOM_CATEGORIES.MENTAL_GENERALS.keywords) {
        if (lowerCaseSymptom.includes(keyword)) {
            return {
                category: SYMPTOM_CATEGORIES.MENTAL_GENERALS.category,
                weight: SYMPTOM_CATEGORIES.MENTAL_GENERALS.weight,
                reason: `Contains mental general keyword: \'${keyword}\'`
            };
        }
    }

    // Check Physical Generals
    for (const keyword of SYMPTOM_CATEGORIES.PHYSICAL_GENERALS.keywords) {
        if (lowerCaseSymptom.includes(keyword)) {
            return {
                category: SYMPTOM_CATEGORIES.PHYSICAL_GENERALS.category,
                weight: SYMPTOM_CATEGORIES.PHYSICAL_GENERALS.weight,
                reason: `Contains physical general keyword: \'${keyword}\'`
            };
        }
    }

    // Check Particular Symptoms
    for (const keyword of SYMPTOM_CATEGORIES.PARTICULAR_SYMPTOMS.keywords) {
        if (lowerCaseSymptom.includes(keyword)) {
            return {
                category: SYMPTOM_CATEGORIES.PARTICULAR_SYMPTOMS.category,
                weight: SYMPTOM_CATEGORIES.PARTICULAR_SYMPTOMS.weight,
                reason: `Contains particular symptom keyword: \'${keyword}\'`
            };
        }
    }

    // Default to Common Symptoms if no specific category is found
    return {
        category: SYMPTOM_CATEGORIES.COMMON_SYMPTOMS.category,
        weight: SYMPTOM_CATEGORIES.COMMON_SYMPTOMS.weight,
        reason: "Default to common symptom"
    };
}

module.exports = {
    categorizeSymptom
};
