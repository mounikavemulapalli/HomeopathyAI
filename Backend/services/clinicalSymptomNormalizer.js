function splitMultiSymptoms(text) {
  if (!text) return [];

  // Preserve repertory hierarchy expressions.
  if (String(text).includes(">")) {
    return [String(text).trim().toLowerCase()];
  }

  return text
    .split(/[\n,;]+|\band\b/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function splitComplaintDescription(text) {
  const input = String(text || "").trim();

  if (!input) return [];

  // Preserve repertory hierarchy expressions.
  if (input.includes(">")) {
    return [input.toLowerCase().trim()];
  }

  return input
    .split(/[\n,;]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function splitStructuredComplaint(symptom) {
  if (!symptom || typeof symptom !== "object" || Array.isArray(symptom)) {
    return [symptom];
  }

  if (
    typeof symptom.field !== "string" ||
    !["complaint description", "chief complaint description"].includes(symptom.field.trim().toLowerCase()) ||
    typeof symptom.value !== "string"
  ) {
    return [symptom];
  }

  const parts = splitComplaintDescription(symptom.value);

  if (parts.length === 0) {
    return [symptom];
  }

  return parts.map((value) => ({
    ...symptom,
    value,
  }));
}

function splitStructuredSymptoms(symptom) {
  if (
    !symptom ||
    typeof symptom !== "object" ||
    Array.isArray(symptom) ||
    typeof symptom.value !== "string"
  ) {
    return [symptom];
  }

  const input = symptom.value.trim();
  if (!input || input.includes(">")) {
    return [symptom];
  }

  const parts = input
    .split(/[,\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 1
    ? parts.map((value) => ({ ...symptom, value }))
    : [symptom];
}

function normalizeSymptom(symptomText) {
  return symptomText.toLowerCase().trim();
}

module.exports = {
  splitMultiSymptoms,
  splitComplaintDescription,
  splitStructuredComplaint,
  splitStructuredSymptoms,
  normalizeSymptom,
};
