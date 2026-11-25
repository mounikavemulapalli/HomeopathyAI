import React from 'react';
import PropTypes from 'prop-types';

const RubricSuggestionPanel = ({ suggestedRubrics, selectedRubrics, onToggleRubric }) => {
  const isRubricSelected = (rubric) => {
    return selectedRubrics.some(
      (selected) =>
        selected.target === rubric.target &&
        selected.chapter === rubric.chapter &&
        selected.grade === rubric.grade &&
        selected.confidence === rubric.confidence
    );
  };

  const hasSuggestions = Object.keys(suggestedRubrics).length > 0;

  return (
    <div className="rubric-suggestion-panel" style={panelStyles.container}>
      {!hasSuggestions && (
        <p style={panelStyles.noRubricsMessage}>No suggested rubrics available</p>
      )}

      {hasSuggestions &&
        Object.entries(suggestedRubrics).map(([symptom, rubrics]) => (
          <div key={symptom} style={panelStyles.symptomGroup}>
            <h3 style={panelStyles.symptomHeader}>{symptom}</h3>
            {rubrics.map((rubric, index ) => (
              <div
                key={index}
                style={{
                  ...panelStyles.rubricRow,
                  ...(isRubricSelected(rubric) ? panelStyles.selectedRubric : {}),
                }}
              >
                <input
                  type="checkbox"
                  checked={isRubricSelected(rubric)}
                  onChange={() => onToggleRubric(rubric)}
                  style={panelStyles.checkbox}
                />
                <div style={panelStyles.rubricDetails}>
                  <span style={panelStyles.rubricTarget}>{rubric.target}</span>
                  <span style={panelStyles.rubricChapter}>Chapter: {rubric.chapter}</span>
                  <span style={panelStyles.rubricGrade}>Grade: {rubric.grade}</span>
                  <span style={panelStyles.rubricConfidence}>
                    Confidence: {(rubric.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};

const panelStyles = {
  container: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    maxHeight: '400px', // Example height for scroll
    overflowY: 'auto',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  noRubricsMessage: {
    textAlign: 'center',
    color: '#777',
    fontSize: '1.1em',
    padding: '20px',
  },
  symptomGroup: {
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px dashed #e0e0e0',
  },
  symptomHeader: {
    color: '#0056b3',
    marginBottom: '10px',
    fontSize: '1.3em',
    borderBottom: '2px solid #0056b3',
    paddingBottom: '5px',
  },
  rubricRow: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s ease-in-out',
  },
  selectedRubric: {
    backgroundColor: '#e6f7ff', // Light blue background for selected rubrics
    borderLeft: '4px solid #007bff',
    paddingLeft: '6px',
  },
  checkbox: {
    marginRight: '10px',
    marginTop: '3px', // Align checkbox with text
    cursor: 'pointer',
    transform: 'scale(1.2)',
  },
  rubricDetails: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  rubricTarget: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: '1.05em',
  },
  rubricChapter: {
    fontSize: '0.9em',
    color: '#555',
  },
  rubricGrade: {
    fontSize: '0.9em',
    color: '#555',
  },
  rubricConfidence: {
    fontSize: '0.9em',
    color: '#007bff', // Blue for confidence
    fontWeight: 'bold',
  },
};

RubricSuggestionPanel.propTypes = {
  suggestedRubrics: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        target: PropTypes.string.isRequired,
        chapter: PropTypes.string.isRequired,
        grade: PropTypes.number.isRequired,
        confidence: PropTypes.number.isRequired,
      })
    )
  ).isRequired,
  selectedRubrics: PropTypes.arrayOf(
    PropTypes.shape({
      target: PropTypes.string.isRequired,
      chapter: PropTypes.string.isRequired,
      grade: PropTypes.number.isRequired,
      confidence: PropTypes.number.isRequired,
    })
  ).isRequired,
  onToggleRubric: PropTypes.func.isRequired,
};

export default RubricSuggestionPanel;

