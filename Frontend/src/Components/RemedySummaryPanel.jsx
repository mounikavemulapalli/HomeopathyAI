import React from 'react';

/**
 * Remedy Summary Panel
 * Shows detailed clinical metrics for a specific remedy.
 */
function RemedySummaryPanel({ remedy }) {
  if (!remedy) return null;

  const mentalsCount = remedy.matchedRubrics.filter(r => r.type === 'MENTALS').length;
  const modalitiesCount = remedy.matchedRubrics.filter(r => r.type === 'MODALITIES').length;
  const srpCount = remedy.matchedRubrics.filter(r => r.type === 'SRP').length;

  return (
    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #dee2e6", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#1a73e8" }}>{remedy.name}</h3>
        <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>Score: {remedy.score}</span>
            <div style={{ fontSize: "11px", color: "#666" }}>Coverage: {(remedy.coverage * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "15px" }}>
        <div style={{ textAlign: "center", padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#6f42c1" }}>{mentalsCount}</div>
            <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase" }}>Mentals</div>
        </div>
        <div style={{ textAlign: "center", padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#fd7e14" }}>{modalitiesCount}</div>
            <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase" }}>Modalities</div>
        </div>
        <div style={{ textAlign: "center", padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#d63384" }}>{srpCount}</div>
            <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase" }}>SRP</div>
        </div>
      </div>

      <div style={{ fontSize: "13px", color: "#444", fontStyle: "italic", marginBottom: "15px" }}>
        {remedy.explanation}
      </div>

      <div style={{ fontSize: "12px", borderTop: "1px solid #f8f9fa", paddingTop: "10px" }}>
        <strong>Clinical Insight:</strong> {remedy.clinicalSummary}
      </div>
    </div>
  );
}

export default RemedySummaryPanel;
