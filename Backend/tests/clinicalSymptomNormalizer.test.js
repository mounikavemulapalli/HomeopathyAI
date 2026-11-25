const {
  splitMultiSymptoms,
  splitComplaintDescription,
} = require("../services/clinicalSymptomNormalizer");

describe("clinicalSymptomNormalizer - existing behavior baseline", () => {
  test("splits comma-separated symptoms", () => {
    expect(splitMultiSymptoms("vertigo, anxiety")).toEqual([
      "vertigo",
      "anxiety",
    ]);
  });

  test("preserves repertory hierarchy expressions", () => {
    expect(
      splitMultiSymptoms("ABSENT-MINDED (See Forgetful) > reading, while")
    ).toEqual(["absent-minded (see forgetful) > reading, while"]);
  });

  test("returns an empty array for empty input", () => {
    expect(splitMultiSymptoms("")).toEqual([]);
  });
});

describe("splitComplaintDescription", () => {
  test("separates independent symptoms while preserving radiating pain as one concept", () => {
    expect(
      splitComplaintDescription(
        "vertigo, pain in chest radiating left hand, heaviness"
      )
    ).toEqual([
      "vertigo",
      "pain in chest radiating left hand",
      "heaviness",
    ]);
  });

  test("returns an empty array for empty descriptions", () => {
    expect(splitComplaintDescription("")).toEqual([]);
  });

  test("preserves hierarchy expressions", () => {
    expect(
      splitComplaintDescription("ABSENT-MINDED (See Forgetful) > reading, while")
    ).toEqual(["absent-minded (see forgetful) > reading, while"]);
  });
});

describe("splitStructuredComplaint", () => {
  const { splitStructuredComplaint } = require("../services/clinicalSymptomNormalizer");

  test("splits Complaint Description and preserves parent context", () => {
    const input = {
      field: "Complaint Description",
      value: "vertigo, pain in chest radiating left hand, heaviness",
      parentComplaintContext: "Chest",
    };

    expect(splitStructuredComplaint(input)).toEqual([
      {
        field: "Complaint Description",
        value: "vertigo",
        parentComplaintContext: "Chest",
      },
      {
        field: "Complaint Description",
        value: "pain in chest radiating left hand",
        parentComplaintContext: "Chest",
      },
      {
        field: "Complaint Description",
        value: "heaviness",
        parentComplaintContext: "Chest",
      },
    ]);
  });

  test("leaves other structured fields unchanged", () => {
    const input = {
      field: "Chief Complaint",
      value: "Chest",
    };

    expect(splitStructuredComplaint(input)).toEqual([input]);
  });

  test("preserves additional metadata on split objects", () => {
    const input = {
      field: "Complaint Description",
      value: "vertigo, nausea",
      parentComplaintContext: "Head",
      source: "case-sheet",
    };

    expect(splitStructuredComplaint(input)).toEqual([
      {
        field: "Complaint Description",
        value: "vertigo",
        parentComplaintContext: "Head",
        source: "case-sheet",
      },
      {
        field: "Complaint Description",
        value: "nausea",
        parentComplaintContext: "Head",
        source: "case-sheet",
      },
    ]);
  });
});

describe("splitStructuredSymptoms", () => {
  const { splitStructuredSymptoms } = require("../services/clinicalSymptomNormalizer");

  test("splits comma-separated structured symptoms and preserves their field", () => {
    expect(
      splitStructuredSymptoms({
        field: "Chief Complaint Description",
        value: "lumbar back ache, radiating to right leg, throbbing type of pain",
      })
    ).toEqual([
      { field: "Chief Complaint Description", value: "lumbar back ache" },
      { field: "Chief Complaint Description", value: "radiating to right leg" },
      { field: "Chief Complaint Description", value: "throbbing type of pain" },
    ]);
  });

  test("preserves metadata and repertory hierarchy expressions", () => {
    const symptom = {
      field: "Mental Symptoms",
      value: "Absent-minded > reading, while",
      parentComplaintContext: "Mind",
    };

    expect(splitStructuredSymptoms(symptom)).toEqual([symptom]);
  });
});
