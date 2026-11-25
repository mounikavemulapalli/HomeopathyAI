/** @format */

import React, { useState } from "react";

/**
 * Professional Repertory Matrix Table
 * Displays rubrics as rows and remedies as columns with grade visualization.
 */
function MatrixTable({ matrix, remedies, acceptedRubrics }) {
  const [filterMinGrade, setFilterMinGrade] = useState(0);
  const [sortRemedy, setSortRemedy] = useState(null);

  if (!matrix || Object.keys(matrix).length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          border: "1px dashed #ccc",
        }}
      >
        <p>
          No matrix data available. Please ensure rubrics are accepted and
          analyzed.
        </p>
      </div>
    );
  }

  // Get top 20-30 remedies for display
  const displayRemedies = remedies.slice(0, 25);
  const rubricIds = Object.keys(matrix);

  // Find the highest scoring remedy
  const maxScore = Math.max(...displayRemedies.map((r) => r.score), 0);
  const highestScoringRemedyName = displayRemedies.find(
    (r) => r.score === maxScore,
  )?.name;

  const getGradeStyle = (grade) => {
    switch (grade) {
      case 4:
        return {
          backgroundColor: "#E53935",
          color: "#FFFFFF",
          fontWeight: "bold",
          borderRadius: "3px",
          padding: "4px",
        }; // Bold Red
      case 3:
        return {
          backgroundColor: "#1E88E5",
          color: "#FFFFFF",
          fontWeight: "bold",
          borderRadius: "3px",
          padding: "4px",
        }; // Bold Blue
      case 2:
        return {
          backgroundColor: "#43A047",
          color: "#FFFFFF",
          fontWeight: "bold",
          borderRadius: "3px",
          padding: "4px",
        }; // Bold Green
      case 1:
        return {
          backgroundColor: "#FFB300",
          color: "#000000",
          fontWeight: "bold",
          borderRadius: "3px",
          padding: "4px",
        }; // Bold Orange/Yellow
      default:
        return {};
    }
  };

  // Prepare data for the new table structure (Remedies as rows, Rubrics as columns)
  const allRubrics = acceptedRubrics
    .map((rubricTarget) => {
      // Find the rubric data from the matrix using the rubricTarget
      const rubricId = Object.keys(matrix).find(
        (id) => matrix[id].rubricText === rubricTarget,
      );
      return rubricId ? matrix[rubricId] : null;
    })
    .filter(Boolean); // Filter out any nulls if rubricTarget not found in matrix

  const remediesWithRubricGrades = remedies
    .slice(0, 25) // Display top 25 remedies
    .sort((a, b) => b.score - a.score) // Sort by score for ranking
    .map((remedy, index) => {
      const rubricGrades = {};
      allRubrics.forEach((rubricData) => {
        rubricGrades[rubricData.rubricText] =
          rubricData.remedies[remedy.name] || 0; // 0 if remedy not in rubric
      });
      return {
        ...remedy,
        rank: index + 1,
        rubricGrades: rubricGrades,
      };
    });

  const allRubricTexts = allRubrics.map((r) => r.rubricText);
  const highestScoringRemedy =
    remediesWithRubricGrades.length > 0 ? remediesWithRubricGrades[0] : null;

  return (
    <div
      className='professional-matrix'
      style={{
        marginTop: "30px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 25px rgba(0,0,0,0.12)",
        overflow: "hidden",
        border: "1px solid #ddd",
      }}
    >
      <div
        style={{
          padding: "18px 24px",
          backgroundColor: "#1e293b",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", letterSpacing: "0.5px" }}>
          📊 Zomeo Repertorization Matrix
        </h3>
        <div
          style={{
            display: "flex",
            gap: "12px",
            fontSize: "11px",
            fontWeight: "600",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#E53935",
                borderRadius: "2px",
              }}
            ></span>{" "}
            Grade 4
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#1E88E5",
                borderRadius: "2px",
              }}
            ></span>{" "}
            Grade 3
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#43A047",
                borderRadius: "2px",
              }}
            ></span>{" "}
            Grade 2
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#FFB300",
                color: "#000000",
                borderRadius: "2px",
              }}
            ></span>{" "}
            Grade 1
          </span>
        </div>
      </div>

      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: "12px",
                  fontWeight: "600",
                  borderBottom: "3px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                }}
              >
                Rank
              </th>
              <th
                style={{
                  padding: "12px",
                  fontWeight: "600",
                  borderBottom: "3px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  minWidth: "150px",
                  textAlign: "left",
                }}
              >
                Remedy Name
              </th>
              {allRubricTexts.map((rubricText) => (
                <th
                  key={rubricText}
                  style={{
                    padding: "14px 8px",
                    borderBottom: "3px solid #cbd5e1",
                    backgroundColor: "#f8fafc",
                    minWidth: "80px",
                    textAlign: "center",
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  {rubricText}
                </th>
              ))}
              <th
                style={{
                  padding: "12px",
                  fontWeight: "600",
                  borderBottom: "3px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  minWidth: "100px",
                  textAlign: "center",
                }}
              >
                Total Score
              </th>
            </tr>
          </thead>
          <tbody>
            {remediesWithRubricGrades.map((remedy) => {
              const isTopRanked =
                highestScoringRemedy &&
                remedy.name === highestScoringRemedy.name;
              return (
                <tr
                  key={remedy.name}
                  style={{
                    backgroundColor: isTopRanked ? "#e6f2ff" : "transparent",
                    fontWeight: isTopRanked ? "bold" : "normal",
                  }}
                >
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      textAlign: "center",
                      color: isTopRanked ? "#0056b3" : "#333",
                    }}
                  >
                    {remedy.rank}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      textAlign: "left",
                      color: isTopRanked ? "#0056b3" : "#333",
                    }}
                  >
                    {isTopRanked && (
                      <span style={{ marginRight: "5px", color: "gold" }}>
                        🏆
                      </span>
                    )}
                    {remedy.name}
                  </td>
                  {allRubricTexts.map((rubricText) => {
                    const grade = remedy.rubricGrades[rubricText];
                    return (
                      <td
                        key={`${remedy.name}-${rubricText}`}
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        {grade > 0 ? (
                          <span
                            style={{
                              display: "inline-block",
                              minWidth: "20px",
                              height: "20px",
                              lineHeight: "20px",
                              textAlign: "center",
                              fontSize: "12px",
                              ...getGradeStyle(grade),
                            }}
                          >
                            {grade}
                          </span>
                        ) : (
                          "•"
                        )}
                      </td>
                    );
                  })}
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      textAlign: "center",
                      color: isTopRanked ? "#0056b3" : "#333",
                    }}
                  >
                    {remedy.score.toFixed(0)}
                  </td>
                </tr>
              );
            })}
            {remediesWithRubricGrades.length === 0 && (
              <tr>
                <td
                  colSpan={allRubricTexts.length + 3}
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#999",
                    fontSize: "14px",
                  }}
                >
                  No remedies calculated yet. Select rubrics to generate the
                  matrix.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MatrixTable;
