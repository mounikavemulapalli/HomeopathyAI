/** @format */

// import React from 'react';
// import PropTypes from 'prop-types';
// import './repertoryMatrixStyles.css'; // Import the specific styles for this component

// const RepertoryMatrixPanel = ({ matrixData, selectedRubrics, matrixRemedies }) => {
//   console.log("RepertoryMatrixPanel - FULL MATRIX DATA PROP:", JSON.stringify(matrixData, null, 2));
//   matrixData.forEach(r => {
//     console.log(`Rubric: ${r.rubric}, Remedies:`, r.remedies);
//   });
//   console.log("RepertoryMatrixPanel - FULL MATRIX REMEDIES PROP:", JSON.stringify(matrixRemedies, null, 2));

//   const safeMatrixData = Array.isArray(matrixData) ? matrixData : []; // This is now an array of rubrics
//   const safeMatrixRemedies = Array.isArray(matrixRemedies) ? matrixRemedies : []; // This is an array of ranked remedies for the matrix header

//   // TEMPORARY DEBUG EXTRACTION FOR PULS TRACE
//   console.log("========== PULS TRACE ==========");
//   let pulsTotalGrade = 0;
//   let pulsRubricsCovered = 0;

//   if (safeMatrixData.length > 0) { // Add check for empty safeMatrixData
//     safeMatrixData.forEach(rubricEntry => {
//       const pulsRemedy = rubricEntry.remedies?.find(r => r.name.toLowerCase() === 'puls' || r.name.toLowerCase() === 'pulsatilla');
//       if (pulsRemedy) {
//         console.log(`Rubric: ${rubricEntry.rubric}`);
//         console.log(`Puls name: ${pulsRemedy.name}`);
//         console.log(`Puls grade: ${pulsRemedy.grade}`);
//         pulsTotalGrade += pulsRemedy.grade;
//         pulsRubricsCovered++;
//       }
//     });
//   } else {
//     console.log("safeMatrixData is empty, no puls rubrics to check.");
//   }

//   console.log(`TOTAL PULS GRADE: ${pulsTotalGrade}`);
//   console.log(`PULS RUBRICS COVERED: ${pulsRubricsCovered}`);
//   // END TEMPORARY DEBUG EXTRACTION (part 1)

//   // Helper function to determine cell grade class based on score
//   const getGradeClass = (score) => {
//     if (score === 4) return 'grade-4-zomeo';
//     if (score === 3) return 'grade-3-zomeo';
//     if (score === 2) return 'grade-2-zomeo';
//     if (score === 1) return 'grade-1-zomeo';
//     return 'grade-0-zomeo'; // No Match / 0 score (white)
//   };

//   if (safeMatrixData.length === 0 || safeMatrixRemedies.length === 0) {
//     return (
//       <div className="no-data-message">
//         No repertory matrix available. Select rubrics and generate the matrix.
//       </div>
//     );
//   }

//   // Use matrixRemedies directly, as they are already sorted and formatted from the backend
//   const remediesForHeader = safeMatrixRemedies;

//   // TEMPORARY DEBUG EXTRACTION FOR PULS TRACE (part 2 - after remediesForHeader is available)
//   const pulsInHeader = remediesForHeader.find(r => r.name.toLowerCase() === 'puls' || r.name.toLowerCase() === 'pulsatilla');
//   if (pulsInHeader) {
//     console.log(`EXPECTED HEADER: ${pulsInHeader.totalGrade} / ${pulsInHeader.rubricsCovered}`);
//   } else {
//     console.log(`EXPECTED HEADER: Pulsatilla not found in remediesForHeader`);
//   }
//   // END TEMPORARY DEBUG EXTRACTION (part 2)

//   // Calculate statistics (now using classical scores from remediesForHeader)
//   const selectedRubricsCount = safeMatrixData.length; // Total rubrics in the matrix
//   const selectedRemediesCount = remediesForHeader.length; // Number of remedies displayed in the header

//   const highestClassicalTotalGrade = remediesForHeader.length > 0
//     ? Math.max(...remediesForHeader.map(r => r.totalGrade))
//     : 0;

//   const topRemedy = remediesForHeader[0]; // After sorting, the first one is the highest
//   const coveragePercentage = selectedRubricsCount > 0 && topRemedy?.rubricsCovered > 0
//     ? ((topRemedy.rubricsCovered / selectedRubricsCount) * 100).toFixed(0)
//     : 0;

//   return (
//     <div className="repertory-matrix-panel">
//       <div className="matrix-statistics">
//         <div><div>Selected Rubrics</div><span>{selectedRubricsCount}</span></div>
//         <div><div>Selected Remedies</div><span>{selectedRemediesCount}</span></div>
//         <div><div>Highest Total</div><span>{highestClassicalTotalGrade}</span></div>
//         <div><div>Coverage %</div><span>{coveragePercentage}%</span></div>
//       </div>
//       <div className="matrix-table-container">
//         <table className="matrix-table">
//           <thead>
//             <tr>
//               <th className="sticky-column header-cell top-left-corner"><div>Rubrics</div></th>
//               {remediesForHeader.map((remedyEntry) => (
//                 <th key={remedyEntry.name} className="remedy-header-cell">
//                   <div>{remedyEntry.name}</div>
//                   <div className="remedy-score-coverage">
//                     {remedyEntry.totalGrade} / {remedyEntry.rubricsCovered}
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {safeMatrixData.map((rubricEntry, rowIndex) => (
//               <tr key={rubricEntry.id} className={rowIndex % 2 === 0 ? 'even-row' : 'odd-row'}>
//                 <td className="sticky-column rubric-cell">{rubricEntry.rubric}</td>
//                 {remediesForHeader.map(remedyForHeader => {
//                   const matchedRemedy = rubricEntry.remedies?.find(r => r.name.toLowerCase() === remedyForHeader.name.toLowerCase());
//                   const score = matchedRemedy ? matchedRemedy.grade : 0;
//                   return (
//                     <td
//                       key={`${rubricEntry.id}-${remedyForHeader.name}`}
//                       style={{
//                         backgroundColor: score === 4 ? "darkgreen" :
//                                          score === 3 ? "green" :
//                                          score === 2 ? "gold" :
//                                          score === 1 ? "pink" : "white",
//                         color: score >= 3 ? "white" : "black"
//                       }}
//                     >
//                       {score > 0 ? score : ''}
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// RepertoryMatrixPanel.propTypes = {
//       matrixData: PropTypes.arrayOf(
//         PropTypes.shape({
//           id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
//           rubric: PropTypes.string.isRequired,
//           chapter: PropTypes.string.isRequired,
//           priority_weight: PropTypes.number, // Added priority_weight
//           remedies: PropTypes.arrayOf(
//             PropTypes.shape({
//               name: PropTypes.string.isRequired,
//               grade: PropTypes.number.isRequired,
//             })
//           ).isRequired,
//         })
//       ).isRequired,
//   selectedRubrics: PropTypes.arrayOf(
//     PropTypes.shape({
//       id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
//       name: PropTypes.string.isRequired,
//       target: PropTypes.string.isRequired,
//       chapter: PropTypes.string.isRequired,
//       grade: PropTypes.number.isRequired,
//       confidence: PropTypes.number.isRequired,
//       symptomSource: PropTypes.string, // Added for formatted display
//     })
//   ).isRequired,
//   matrixRemedies: PropTypes.arrayOf(
//     PropTypes.shape({
//       rank: PropTypes.number.isRequired,
//       name: PropTypes.string.isRequired,
//       totalGrade: PropTypes.number.isRequired,
//       rubricsCovered: PropTypes.number.isRequired,
//       coveragePercentage: PropTypes.number,
//     })
//   ).isRequired,
// };

// export default RepertoryMatrixPanel;
/** @format */

import React from "react";
import PropTypes from "prop-types";
import "./repertoryMatrixStyles.css";

const normalizeKey = (val) =>
  String(val || "")
    .trim()
    .toLowerCase();

const RepertoryMatrixPanel = ({
  matrixData,
  selectedRubrics,
  matrixRemedies,
}) => {
  const rawMatrix = Array.isArray(matrixData) ? matrixData : [];
  const safeMatrixData = rawMatrix.flatMap((entry) =>
    entry && Array.isArray(entry.rubrics)
      ? entry.rubrics
      : entry
        ? [entry]
        : [],
  );

  const safeMatrixRemedies = Array.isArray(matrixRemedies)
    ? matrixRemedies
    : [];

  if (safeMatrixData.length === 0 || safeMatrixRemedies.length === 0) {
    return (
      <div className='no-data-message'>
        No repertory matrix available. Select rubrics and generate the matrix.
      </div>
    );
  }

  const remediesForHeader = safeMatrixRemedies;

  const selectedRubricsCount = safeMatrixData.length;
  const selectedRemediesCount = remediesForHeader.length;

  const highestClassicalTotalGrade =
    remediesForHeader.length > 0
      ? Math.max(...remediesForHeader.map((r) => Number(r.totalGrade) || 0))
      : 0;

  const topRemedy = remediesForHeader[0];
  const topCovered = Number(topRemedy?.rubricsCovered) || 0;
  const coveragePercentage =
    selectedRubricsCount > 0 && topCovered > 0
      ? ((topCovered / selectedRubricsCount) * 100).toFixed(0)
      : 0;

  const findGradeForRemedy = (rubricEntry, remedyForHeader) => {
    const targetNames = new Set(
      [
        normalizeKey(remedyForHeader?.name),
        normalizeKey(remedyForHeader?.canonicalName),
      ].filter(Boolean),
    );

    const remediesList = Array.isArray(rubricEntry?.remedies)
      ? rubricEntry.remedies
      : [];

    const matchedRemedy = remediesList.find((r) => {
      const rName = normalizeKey(r?.name);
      const rCanon = normalizeKey(r?.canonicalName);
      return (
        (rName && targetNames.has(rName)) || (rCanon && targetNames.has(rCanon))
      );
    });

    return matchedRemedy ? Number(matchedRemedy.grade) || 0 : 0;
  };

  return (
    <div className='repertory-matrix-panel'>
      <div className='matrix-statistics'>
        <div>
          <div>Selected Rubrics</div>
          <span>{selectedRubricsCount}</span>
        </div>
        <div>
          <div>Selected Remedies</div>
          <span>{selectedRemediesCount}</span>
        </div>
        <div>
          <div>Highest Total</div>
          <span>{highestClassicalTotalGrade}</span>
        </div>
        <div>
          <div>Coverage %</div>
          <span>{coveragePercentage}%</span>
        </div>
      </div>

      <div className='matrix-table-container'>
        <table className='matrix-table'>
          <thead>
            <tr>
              <th className='sticky-column header-cell top-left-corner'>
                <div>Rubrics</div>
              </th>
              {remediesForHeader.map((remedyEntry, colIndex) => (
                <th
                  key={`${normalizeKey(remedyEntry.canonicalName || remedyEntry.name)}-${colIndex}`}
                  className='remedy-header-cell'
                >
                  <div>{remedyEntry.name}</div>
                  <div className='remedy-score-coverage'>
                    {Number(remedyEntry.totalGrade) || 0} /{" "}
                    {Number(remedyEntry.rubricsCovered) || 0}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeMatrixData.map((rubricEntry, rowIndex) => {
              const rowKey =
                rubricEntry.id ||
                `${rubricEntry.source || ""}::${rubricEntry.chapter || ""}::${rubricEntry.rubric || ""}::${rowIndex}`;
              const srcLabel = String(rubricEntry.source || "")
                .replace(/(\.json)+$/gi, "")
                .replace(/_master_db$/i, "");
              const displayLabel = rubricEntry.chapter
                ? `[${srcLabel ? `${srcLabel} ` : ""}${rubricEntry.chapter}] ${rubricEntry.rubric || ""}`
                : rubricEntry.rubric || "";

              return (
                <tr
                  key={rowKey}
                  className={rowIndex % 2 === 0 ? "even-row" : "odd-row"}
                >
                  <td className='sticky-column rubric-cell'>{displayLabel}</td>
                  {remediesForHeader.map((remedyForHeader, colIndex) => {
                    const score = findGradeForRemedy(
                      rubricEntry,
                      remedyForHeader,
                    );
                    return (
                      <td
                        key={`${rowKey}-${normalizeKey(remedyForHeader.canonicalName || remedyForHeader.name)}-${colIndex}`}
                        style={{
                          backgroundColor:
                            score === 4
                              ? "darkgreen"
                              : score === 3
                                ? "green"
                                : score === 2
                                  ? "gold"
                                  : score === 1
                                    ? "pink"
                                    : "white",
                          color: score >= 3 ? "white" : "black",
                        }}
                      >
                        {score > 0 ? score : ""}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

RepertoryMatrixPanel.propTypes = {
  matrixData: PropTypes.array.isRequired,
  selectedRubrics: PropTypes.array,
  matrixRemedies: PropTypes.array,
};

export default RepertoryMatrixPanel;
