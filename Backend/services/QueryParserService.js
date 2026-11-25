/**
 * Query Parser Service
 * Extracts homeopathic components from natural language queries.
 * Converted to ES Modules and optimized for MongoDB architecture alignment.
 *
 * @format
 */

// Importing using standard ES Modules syntax
let mentalConceptService = {
  isMental: () => false,
  detectIntent: () => [],
};
let mentalOntologyService = {
  isEmotional: () => false,
  detect: () => [],
  getPriorities: () => ({ dominant: [], modifiers: [] }),
};
let diseaseExpansionService = {
  isDisease: () => false,
  getSupportedDiseases: () => [],
};

try {
  const mc = require("./mentalConceptService");
  mentalConceptService = mc.default || mc;
} catch (e) {
  console.warn("⚠️ mentalConceptService loading bypassed.");
}

try {
  const mo = require("./mentalOntologyService");
  mentalOntologyService = mo.default || mo;
} catch (e) {
  console.warn("⚠️ mentalOntologyService loading bypassed.");
}

try {
  const de = require("./diseaseExpansionService");
  diseaseExpansionService = de.default || de;
} catch (e) {
  console.warn("⚠️ diseaseExpansionService loading bypassed.");
}

class QueryParserService {
  constructor() {
    this.modalities = {
      agg: ["worse", "agg", "aggravation", "after", "during", "from", "in"],
      amel: ["better", "amel", "amelioration", "relieved", "improved"],
    };

    this.timeContexts = [
      "morning",
      "afternoon",
      "evening",
      "night",
      "midnight",
      "day",
      "periodic",
    ];
    this.weatherContexts = [
      "cold",
      "warm",
      "summer",
      "winter",
      "rain",
      "damp",
      "dry",
      "wind",
      "snow",
      "heat",
      "sun",
    ];
    this.sensations = [
      "pain",
      "throbbing",
      "burning",
      "stitching",
      "constriction",
      "heaviness",
      "itching",
      "numbness",
      "ache",
      "aching",
      "soreness",
      "scanty",
      "profuse",
      "painful",
      "suppressed",
      "delayed",
      "irregular",
    ];
    this.locations = [
      "head",
      "chest",
      "stomach",
      "back",
      "limbs",
      "skin",
      "throat",
      "eyes",
      "ears",
      "menses",
      "menstruation",
      "leucorrhoea",
      "stool",
      "urine",
    ];

    this.contextSynonyms = {
      summer: ["summer", "heat", "warm", "hot"],
      winter: ["winter", "cold", "snow"],
      rain: ["rain", "damp", "wet"],
      morning: ["morning", "waking"],
    };

    this.relationalKeywords = [
      "during",
      "before",
      "after",
      "while",
      "from",
      "with",
      "when",
    ];
  }

  parse(query) {
    if (!query) return null;

    const lowerQuery = query.toLowerCase().replace(/[\W_]+/g, " "); // Clean punctuation
    const words = lowerQuery.split(/\s+/).filter(Boolean);

    const parts = {
      disease: null,
      modalities: [],
      locations: [],
      sensations: [],
      context: [],
      mentalIntent: [],
      detectedMentalSymptoms: [],
      tokenPriorities: { dominant: [], modifiers: [] },
      relations: [],
      isMental: false,
      isPathological: false,
      primaryPathology: null,
      original: query,
    };

    // Safe check execution for external sub-services
    try {
      parts.isMental =
        mentalOntologyService.isEmotional(query) ||
        mentalConceptService.isMental(query);
      parts.mentalIntent = mentalConceptService.detectIntent(query) || [];
      parts.detectedMentalSymptoms = mentalOntologyService.detect(query) || [];
      parts.tokenPriorities = mentalOntologyService.getPriorities(query) || {
        dominant: [],
        modifiers: [],
      };
    } catch (e) {
      console.warn(
        "⚠️ Mental Concept parsing dependencies missing or bypassed:",
        e.message,
      );
    }

    try {
      parts.isPathological = diseaseExpansionService.isDisease(query);
      const matchedDiseases =
        diseaseExpansionService.getSupportedDiseases() || [];
      for (const d of matchedDiseases) {
        if (lowerQuery.includes(d)) {
          parts.primaryPathology = d;
          break;
        }
      }
    } catch (e) {
      console.warn(
        "⚠️ Disease Expansion parsing dependencies missing or bypassed:",
        e.message,
      );
    }

    // Detect Relational Clinical Structures
    this._detectRelations(query, parts);

    const aggKeywords = this.modalities.agg;
    const amelKeywords = this.modalities.amel;

    words.forEach((word, index) => {
      // Sensation Detection
      if (this.sensations.includes(word)) parts.sensations.push(word);

      // Location Detection
      if (this.locations.includes(word)) parts.locations.push(word);

      // Context Detection
      if (
        this.weatherContexts.includes(word) ||
        this.timeContexts.includes(word)
      ) {
        parts.context.push(word);
        if (this.contextSynonyms[word])
          parts.context.push(...this.contextSynonyms[word]);
      }

      // Modality Detection (Look-ahead logic)
      if (aggKeywords.includes(word)) {
        const nextWords = words.slice(index + 1, index + 4);
        nextWords.forEach((nw) => {
          if (
            this.weatherContexts.includes(nw) ||
            this.timeContexts.includes(nw)
          ) {
            parts.modalities.push({
              type: "AGG",
              value: nw,
              phrase: `${word} ${nw}`,
            });
          }
        });
      }
      if (amelKeywords.includes(word)) {
        const nextWords = words.slice(index + 1, index + 4);
        nextWords.forEach((nw) => {
          if (
            this.weatherContexts.includes(nw) ||
            this.timeContexts.includes(nw)
          ) {
            parts.modalities.push({
              type: "AMEL",
              value: nw,
              phrase: `${word} ${nw}`,
            });
          }
        });
      }
    });

    // Deduplicate arrays
    parts.sensations = [...new Set(parts.sensations)];
    parts.locations = [...new Set(parts.locations)];
    parts.context = [...new Set(parts.context)];

    // Handle composite variations cleanly
    if (lowerQuery.includes("head ache") || lowerQuery.includes("headache")) {
      if (!parts.locations.includes("head")) parts.locations.push("head");
      if (!parts.sensations.includes("pain")) parts.sensations.push("pain");
    }

    console.log("🔍 MongoDB Aligned Parsed Query Components:", parts);
    return parts;
  }

  /**
   * Detects relational structures like [Symptom] during [Condition]
   */
  _detectRelations(query, parts) {
    const lowerQuery = query.toLowerCase();
    const relationalPatterns = [
      { regex: /(\w+)\s+(during|while|from|with)\s+(\w+)/, type: "DURING" },
      { regex: /(\w+)\s+(before)\s+(\w+)/, type: "BEFORE" },
      { regex: /(\w+)\s+(after)\s+(\w+)/, type: "AFTER" },
    ];

    relationalPatterns.forEach((pattern) => {
      const match = lowerQuery.match(pattern.regex);
      if (match) {
        const symptom = match[1];
        const relation = match[2];
        const condition = match[3];

        const stopWords = ["is", "the", "was", "it", "of", "and"];
        if (!stopWords.includes(symptom) && !stopWords.includes(condition)) {
          parts.relations.push({
            primarySymptom: symptom,
            contextCondition: condition,
            relation: relation,
            type: pattern.type,
          });
        }
      }
    });
  }

  /**
   * Generates boost keywords for search weighting.
   */
  getBoostKeywords(parsed) {
    if (!parsed) return [];
    const keywords = [];
    parsed.modalities.forEach((m) => {
      keywords.push(m.phrase);
      keywords.push(`${m.value} ${m.type === "AGG" ? "agg" : "amel"}`);
    });
    parsed.context.forEach((c) => keywords.push(c));
    return keywords;
  }
}

// Clean Export instantiation matching ES Module standard
module.exports = new QueryParserService();
