import React from 'react';
import PropTypes from 'prop-types';

const SelectedRubricsPanel = ({ selectedRubrics, onRemoveRubric }) => {
  const rubricCount = selectedRubrics.length;

  return (
    <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f9f9f9', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '16px', color: '#3f51b5' }}>
        Selected Rubrics for Repertorization ({rubricCount})
      </h3>

      {rubricCount === 0 ? (
        <p style={{ color: '#757575', fontStyle: 'italic' }}>No rubrics selected</p>
      ) : (
        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
          {selectedRubrics.map((rubric, index) => (
            <div
              key={rubric.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 15px',
                margin: '8px 0',
                backgroundColor: '#ffffff',
                border: '1px solid #c5cae9',
                borderRadius: '5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <p style={{ margin: '0', fontWeight: 'bold', color: '#303f9f' }}>{rubric.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.9em', color: '#5c6bc0' }}>
                  Chapter: {rubric.chapter} | Grade: {rubric.grade}
                </p>
              </div>
              <button
                onClick={() => onRemoveRubric(rubric)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2em',
                  color: '#e57373',
                  marginLeft: '10px',
                }}
                aria-label="Remove rubric"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

SelectedRubricsPanel.propTypes = {
  selectedRubrics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      chapter: PropTypes.string.isRequired,
      grade: PropTypes.number.isRequired,
    })
  ).isRequired,
  onRemoveRubric: PropTypes.func.isRequired,
};

export default SelectedRubricsPanel;

