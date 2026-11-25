/** @format */

import React, { useState } from "react";

import RubricSuggestionPanel from "./RubricSuggestionPanel";
import SelectedRubricsPanel from "./SelectedRubricsPanel";
import RepertoryMatrixPanel from "./RepertoryMatrixPanel";
import TopRemediesPanel from "./TopRemediesPanel";
// import AdvancedRubricSearch from "./AdvancedRubricSearch";

import {
  generateSuggestedRubrics,
  generateRepertoryMatrix,
} from "./repertoryApi";

import { addSymptoms, extractThermal } from "./repertoryHelpers";

const ClassicalRepertorySection = ({ caseData, token }) => {
  const [suggestedRubrics, setSuggestedRubrics] = useState({});
  const [selectedRubrics, setSelectedRubrics] = useState([]);
  const [collectedSymptoms, setCollectedSymptoms] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [safetyAnalysis, setSafetyAnalysis] = useState(null);
  const [topRemedies, setTopRemedies] = useState([]); // This will be the top 5 for the panel
  const [matrixRemedies, setMatrixRemedies] = useState([]); // This will be the classical ranked remedies for the matrix display

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults] = useState([]);

  const [loadingRubrics, setLoadingRubrics] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // STEP 1 Generate Suggested Rubrics
  const handleGenerateRubrics = async () => {
    try {
      setLoadingRubrics(true);

      const structuredSymptoms = addSymptoms(caseData);
      setCollectedSymptoms(structuredSymptoms);

      console.log("Collected Structured Symptoms:", structuredSymptoms);

      if (!structuredSymptoms || structuredSymptoms.length === 0) {
        alert("No symptoms found in Case Sheet");
        return;
      }

      console.log("REPERTORY TOKEN:", token);
      const response = await generateSuggestedRubrics(
        structuredSymptoms, // Pass the array of structured symptom objects
        token,
      );

      console.log("Rubric Response:", response);
      const rawData =
        response?.groupedRubrics ||
        response?.data?.groupedRubrics ||
        response?.data ||
        response;
      const groupedRubricsData =
        rawData && typeof rawData === "object" && !Array.isArray(rawData)
          ? rawData
          : {};
      console.log(
        "GROUPED RUBRICS:",
        JSON.stringify(groupedRubricsData, null, 2),
      );

      setSuggestedRubrics(groupedRubricsData);
      setSelectedRubrics([]);
      setMatrixData([]);
      setSafetyAnalysis(null);
      setTopRemedies([]);
    } catch (error) {
      console.error(error);
      alert("Failed to generate rubrics");
    } finally {
      setLoadingRubrics(false);
    }
  };

  // Select / Unselect Rubrics
  const handleToggleRubric = (rubric) => {
    const exists = selectedRubrics.some(
      (r) => r.target === rubric.target && r.chapter === rubric.chapter,
    );

    if (exists) {
      setSelectedRubrics((prev) =>
        prev.filter(
          (r) => !(r.target === rubric.target && r.chapter === rubric.chapter),
        ),
      );
    } else {
      setSelectedRubrics((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          name: rubric.target,
          target: rubric.target,
          chapter: rubric.chapter,
          grade: rubric.grade,
          confidence: rubric.confidence,
        },
      ]);
    }
  };

  const handleRemoveRubric = (rubric) => {
    setSelectedRubrics((prev) => prev.filter((r) => r.id !== rubric.id));
  };

  // STEP 2 Generate Matrix
  const handleGenerateMatrix = async () => {
    try {
      setLoadingMatrix(true);

      const thermal = extractThermal(caseData);

      console.log("Selected Rubrics:", selectedRubrics);
      console.log("Thermal:", thermal);

      console.log("REPERTORY TOKEN:", token);
      const response = await generateRepertoryMatrix(
        selectedRubrics,
        thermal,
        token,
        caseData,
        collectedSymptoms,
      );

      console.log("FULL MATRIX RESPONSE:", JSON.stringify(response, null, 2));

      const matrixResponse = response.matrixData || {};
      setSafetyAnalysis(response.safety || null);
      // const remedies = matrixResponse.remedies || []; // This now contains full AI-ranked remedies
      const top5Classical = matrixResponse.top5ClassicalRemedies || []; // Our new classical ranking
      const rubrics = matrixResponse.rubrics || [];

      console.log(
        "FINAL MATRIX DATA (Rubrics):",
        JSON.stringify(rubrics, null, 2),
      );
      console.log(
        "FINAL TOP 5 CLASSICAL REMEDIES DATA:",
        JSON.stringify(top5Classical, null, 2),
      );

      setMatrixData(rubrics);
      setTopRemedies(matrixResponse.top5ClassicalRemediesForPanel); // Use the new classical top 5 for the TopRemediesPanel
      setMatrixRemedies(matrixResponse.classicalRankedRemedies); // Use the full list for the matrix
    } catch (error) {
      console.error(error);
      alert("Failed to generate repertory matrix");
    } finally {
      setLoadingMatrix(false);
    }
  };

  const thermalState = extractThermal(caseData);

  return (
    <div className='classical-repertory-section'>
      {/* <div className="repertory-header">
        <div>
          <h1 className="repertory-title">Repertory Matrix (Case Analysis)</h1>
        </div>
        <div className="header-buttons">
          <button className="case-button">Modify Rubrics</button>
          <button className="case-button">New Analysis</button>
          <button className="case-button">Download</button>
        </div>
      </div> */}

      {/* Analysis Summary Panel */}
      {/* <div className='analysis-summary-panel'>
        <div className='summary-item'>
          <span className='summary-label'>Total Rubrics:</span>
          <span className='summary-value'>{selectedRubrics.length}</span>
          setTopRemedies(matrixResponse.classicalRankedRemedies.slice(0, 5)); //
          Apply correction: Top 5 remedies for the panel
        </div>
        setTopRemedies(matrixResponse.classicalRankedRemedies.slice(0, 5)); //
        Apply correction: Top 5 remedies for the panel
        <div className='summary-item'>
          <span className='summary-label'>Thermal State:</span>
          <span className='summary-value thermal-state'>
            {thermalState || "N/A"}
          </span>
        </div>
        <div className='summary-item'>
          <span className='summary-label'>Remedies Found:</span>
          <span className='summary-value'>{topRemedies.length}</span>
        </div>
        <div className='summary-item'>
          <span className='summary-label'>Highest Score:</span>
          <span className='summary-value'>
            {topRemedies.length > 0 ? topRemedies[0].totalGrade : "N/A"}
          </span>
        </div>
      </div> */}

      <div className='workflow-section'>
        <h2>Classical AI Repertory Workflow</h2>
        <p>
          Convert Case Sheet symptoms into repertory rubrics and generate
          constitutional remedies.
        </p>

        <button
          className='case-button'
          onClick={handleGenerateRubrics}
          disabled={loadingRubrics}
        >
          {loadingRubrics
            ? "Generating Rubrics..."
            : "Generate AI Suggested Rubrics"}
        </button>
      </div>

      {Object.keys(suggestedRubrics).length > 0 && (
        <div className='suggested-rubrics-section'>
          <h3>AI Suggested Rubrics</h3>
          <RubricSuggestionPanel
            suggestedRubrics={Object.keys(suggestedRubrics).reduce(
              (acc, symptomKey) => {
                if (
                  !symptomKey
                    .toLowerCase()
                    .match(/skin|eruption|ulcer|herpes|itch|rash/)
                ) {
                  acc[symptomKey] = suggestedRubrics[symptomKey].filter(
                    (r) =>
                      !String(r.target || r.chapter || "")
                        .toUpperCase()
                        .includes("SKIN"),
                  );
                } else {
                  acc[symptomKey] = suggestedRubrics[symptomKey];
                }
                return acc;
              },
              {},
            )}
            selectedRubrics={selectedRubrics}
            onToggleRubric={handleToggleRubric}
          />
        </div>
      )}

      {selectedRubrics.length > 0 && (
        <div className='selected-rubrics-section'>
          <h3>Selected Rubrics</h3>
          <SelectedRubricsPanel
            selectedRubrics={selectedRubrics}
            onRemoveRubric={handleRemoveRubric}
          />
          <div className='generate-matrix-button-container'>
            <button
              className='case-button'
              onClick={handleGenerateMatrix}
              disabled={loadingMatrix}
            >
              {loadingMatrix
                ? "Generating Matrix..."
                : "Generate Repertory Matrix"}
            </button>
          </div>
        </div>
      )}

      {safetyAnalysis?.emergency && (
        <div
          className='safety-analysis-panel'
          role='alert'
          style={{
            border: "2px solid #b91c1c",
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "16px",
            background: "#fef2f2",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", color: "#b91c1c" }}>
            ?? CLINICAL SAFETY ALERT
          </h3>

          <div>
            <strong>Severity:</strong> {safetyAnalysis.severity || "Unknown"}
          </div>

          <div>
            <strong>Category:</strong> {safetyAnalysis.category || "Red Flag"}
          </div>

          {Array.isArray(safetyAnalysis.matchedRedFlags) &&
            safetyAnalysis.matchedRedFlags.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <strong>Matched Red Flags:</strong>
                <ul style={{ marginTop: "4px" }}>
                  {safetyAnalysis.matchedRedFlags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

          {safetyAnalysis.recommendation && (
            <div style={{ marginTop: "8px" }}>
              <strong>Recommendation:</strong> {safetyAnalysis.recommendation}
            </div>
          )}

          {safetyAnalysis.physicianComment && (
            <div style={{ marginTop: "8px" }}>
              <strong>Physician Comment:</strong>{" "}
              {safetyAnalysis.physicianComment}
            </div>
          )}
        </div>
      )}
      {matrixData.length > 0 && (
        <div className='repertory-results-grid'>
          <div className='matrix-panel-container'>
            <h3 className='section-title'>REPERTORY MATRIX</h3>
            {/* Pass matrixRemedies for the matrix header, and topRemedies for the actual panel */}
            <RepertoryMatrixPanel
              matrixData={matrixData}
              selectedRubrics={selectedRubrics}
              matrixRemedies={matrixRemedies}
            />
          </div>

          <div className='side-panel-container'>
            <div className='grade-legend-panel'>
              <h3 className='section-title'>Grade Guide</h3>
              <ul>
                <li>
                  <span className='grade-box grade-4'></span> Grade 4 = Dark
                  Green
                </li>
                <li>
                  <span className='grade-box grade-3'></span> Grade 3 = Green
                </li>
                <li>
                  <span className='grade-box grade-2'></span> Grade 2 = Yellow
                </li>
                <li>
                  <span className='grade-box grade-1'></span> Grade 1 = Orange
                </li>
                <li>
                  <span className='grade-box grade-0'></span> No Match = Grey
                </li>
              </ul>
            </div>
            {/* Additional UI elements can go here */}
          </div>
        </div>
      )}

      {topRemedies.length > 0 && (
        <div className='top-remedies-section'>
          <h3 className='section-title'>TOP 5 REMEDIES (FULL WIDTH)</h3>
          <TopRemediesPanel topRemedies={topRemedies} />
        </div>
      )}
    </div>
  );
};

export default ClassicalRepertorySection;
