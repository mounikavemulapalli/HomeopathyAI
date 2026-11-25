import React from 'react';
import PropTypes from 'prop-types';

const TopRemediesPanel = ({ topRemedies }) => {
  if (!topRemedies || topRemedies.length === 0) {
    return <p>No remedies available</p>;
  }

  return (
    <div className="top-remedies-panel">
      <h2 className="top-remedies-title">TOP 5 REMEDIES (Classical Grades)</h2>
      <div className="remedy-cards-container">
        {topRemedies.map((remedyData) => (
          <div key={remedyData.rank} className={`remedy-card ${remedyData.rank === 1 ? 'remedy-card-rank1' : ''}`}>
            <span className={`rank-badge ${remedyData.rank === 1 ? 'rank-badge-rank1' : ''}`}>
              {remedyData.rank} {remedyData.rank === 1 && '🏆'}
            </span>
            <h3 className="remedy-name">{remedyData.name || 'Unknown Remedy'}</h3>
            {remedyData.thermal && <p className="remedy-info thermal-display">Thermal: {remedyData.thermal}</p>}
            <p className="remedy-info">Total Grade: {remedyData.totalGrade || 0}</p>
            <p className="remedy-info">Rubrics Covered: {remedyData.rubricsCovered || 0}</p>
            <p className="remedy-info">Coverage %: {remedyData.coveragePercentage !== undefined && remedyData.coveragePercentage !== null ? remedyData.coveragePercentage : 0}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

TopRemediesPanel.propTypes = {
  topRemedies: PropTypes.arrayOf(PropTypes.shape({
    rank: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    thermal: PropTypes.string, // Add thermal property
    totalGrade: PropTypes.number.isRequired,
    rubricsCovered: PropTypes.number.isRequired,
    coveragePercentage: PropTypes.number,
  })).isRequired,
};

export default TopRemediesPanel;
