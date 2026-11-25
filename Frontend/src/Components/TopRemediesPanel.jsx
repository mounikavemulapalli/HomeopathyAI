import React, { useState } from 'react';
import './TopRemediesPanel.css';

const RemedyCard = ({ remedy, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <li key={index} className={`remedy-card ${remedy.rank === 1 ? 'rank-1' : remedy.rank === 2 ? 'rank-2' : remedy.rank === 3 ? 'rank-3' : ''}`}>
      <h3>Rank: {remedy.rank} - {remedy.name}</h3>
      <p>Final Score: {remedy.finalScore}</p>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${remedy.finalScore}%` }}></div>
      </div>
      <p>Repertory Score: {remedy.repertoryScore}</p>
      <p>Thermal Bonus: {remedy.thermalBonus}</p>
      <p>Matched %: {remedy.matchedPercentage}</p>
      <p>Miasm: {remedy.miasm}</p>
      <p>Thermal Match: {remedy.thermalMatch} {remedy.thermalMatch && <span className={`thermal-badge ${remedy.thermalMatch.toLowerCase().replace(/ /g, '-')}`}>{remedy.thermalMatch}</span>}</p>
      <p>Keynotes: {remedy.keynotes}</p>

      <button onClick={toggleExpanded}>
        {isExpanded ? "Hide details" : "Why this remedy?"}
      </button>

      {isExpanded && (
        <div className="collapsible-content">
          <p><strong>Explanation:</strong> {remedy.explanation}</p>
          {remedy.matchedRubrics && remedy.matchedRubrics.length > 0 && (
            <div>
              <p><strong>Matched Rubrics:</strong></p>
              <ul>
                {remedy.matchedRubrics.map((rubric, i) => (
                  <li key={i}>{rubric}</li>
                ))}
              </ul>
            </div>
          )}
          {remedy.thermalInfluenceDetails && (
            <p><strong>Thermal Influence Details:</strong> {remedy.thermalInfluenceDetails}</p>
          )}
        </div>
      )}
    </li>
  );
};

const TopRemediesPanel = ({ topRemedies }) => {
  return (
    <div>
      <h2>Top Remedies</h2>
      {topRemedies && topRemedies.length > 0 ? (
        <ul className="remedy-list">
          {topRemedies.map((remedy, index) => (
            <RemedyCard key={index} remedy={remedy} index={index} />
          ))}
        </ul>
      ) : (
        <p>No top remedies to display.</p>
      )}
    </div>
  );
};

export default TopRemediesPanel;
