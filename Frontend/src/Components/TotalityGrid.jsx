import React from "react";

/**
 * TotalityGrid: A colorful Zomeo-style repertorial sheet.
 * Shows Remedies (Top) vs Rubrics (Left).
 */
export default function TotalityGrid({ remedies = [], rubrics = [] }) {
  if (!remedies.length || !rubrics.length) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
        No rubrics selected. Please add rubrics to see the analysis grid.
      </div>
    );
  }

  // Limit to top 25 remedies for better visibility
  const topRemedies = remedies.slice(0, 25);

  const getGradeColor = (grade) => {
    switch (grade) {
      case 3: return "bg-red-600 text-white font-bold";
      case 2: return "bg-blue-600 text-white font-bold";
      case 1: return "bg-green-600 text-white";
      default: return "bg-gray-100 text-gray-400";
    }
  };

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-gray-200 shadow-xl bg-white">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="bg-white text-blue-700 px-2 py-0.5 rounded text-sm">ZOMEO VIEW</span>
          Repertorial Totality Grid
        </h2>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-100">
              <th className="p-3 text-left bg-gray-100 border-b border-r min-w-[300px] sticky left-0 z-30">
                <div className="flex justify-between items-end h-full">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Symptoms / Rubrics</span>
                  <span className="text-xs text-blue-600 font-bold">REMEDIES →</span>
                </div>
              </th>
              {topRemedies.map((r) => (
                <th key={r.remedy} className="p-0 border-b border-r min-w-[40px] align-bottom">
                  <div className="flex flex-col items-center">
                    <div className="py-2 px-1 text-[10px] font-bold text-gray-700 writing-vertical-lr transform rotate-180 h-32 flex items-center">
                      {r.remedy}
                    </div>
                    <div className="w-full bg-blue-50 py-1 text-[10px] font-bold text-blue-700 border-t flex flex-col items-center">
                      <span>{r.score} / {r.rubricCount}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubrics.map((rubric, idx) => {
              if (rubric.isTotalCoverageRow) {
                return (
                  <tr key="total-coverage" className="bg-blue-50 font-bold sticky bottom-0 z-10 shadow-[0_-2px_5px_-2px_rgba(0,0,0,0.1)]">
                    <td className="p-3 text-sm border-t border-r sticky left-0 z-20 bg-blue-50">
                      TOTAL COVERAGE (RUBRICS)
                    </td>
                    {topRemedies.map((r) => {
                      const stats = rubric.remedyStats[r.remedy];
                      return (
                        <td key={r.remedy} className="p-3 text-center border-t border-r text-blue-800 text-xs font-bold">
                          {stats ? stats.totalRubrics : "0"}
                        </td>
                      );
                    })}
                  </tr>
                );
              }
              const isThermalRow = rubric.isThermalRow;
              return (
                <tr key={rubric.id} className={`${isThermalRow ? "bg-indigo-50/30" : (idx % 2 === 0 ? "bg-white" : "bg-gray-50")}`}>
                  <td className={`p-3 text-sm border-b border-r sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${isThermalRow ? "font-bold text-indigo-700" : ""}`}>
                    <div className="flex flex-col">
                      <span className="font-medium leading-tight">{rubric.title}</span>
                      <span className="text-[10px] text-gray-400 uppercase mt-1">{rubric.book || "GENERAL"}</span>
                    </div>
                  </td>
                  {topRemedies.map((rem) => {
                    const grade = rem.rubricMatches[rubric.id];
                    return (
                      <td 
                        key={`${rubric.id}-${rem.remedy}`} 
                        className="p-1 border-b border-r text-center"
                      >
                        {grade ? (
                          <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-md text-sm shadow-sm transition-transform hover:scale-110 ${getGradeColor(grade)}`}>
                            {grade}
                          </div>
                        ) : (
                          <span className="text-gray-200">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-gray-50 border-t flex gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded"></div> <span>Grade 3 (Strong)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded"></div> <span>Grade 2 (Moderate)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded"></div> <span>Grade 1 (Mentioned)</span>
        </div>
      </div>
    </div>
  );
}
