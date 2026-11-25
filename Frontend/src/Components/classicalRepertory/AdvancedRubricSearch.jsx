/** @format */

// import React, { useState } from 'react';
// import PropTypes from 'prop-types';

// const AdvancedRubricSearch = ({
//   searchResults,
//   searchQuery,
//   onSearchChange,
//   onAddRubric,
// }) => {
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   const toggleCollapse = () => {
//     setIsCollapsed(!isCollapsed);
//   };

//   return (
//     <div style={{ border: '1px solid #ccc', borderRadius: '5px', marginBottom: '10px' }}>
//       <div
//         onClick={toggleCollapse}
//         style={{
//           padding: '10px',
//           backgroundColor: '#f0f0f0',
//           cursor: 'pointer',
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//         }}
//       >
//         <h3>Advanced Rubric Search</h3>
//         <span>{isCollapsed ? '+' : '-'}</span>
//       </div>

//       {!isCollapsed && (
//         <div style={{ padding: '10px' }}>
//           <input
//             type="text"
//             placeholder="Search Kent / BBCR / Boericke / Clarke rubrics..."
//             value={searchQuery}
//             onChange={(e) => onSearchChange(e.target.value)}
//             style={{
//               width: '100%',
//               padding: '8px',
//               marginBottom: '10px',
//               borderRadius: '3px',
//               border: '1px solid #ddd',
//             }}
//           />

//           <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '3px' }}>
//             {searchResults && searchResults.length > 0 ? (
//               searchResults.map((rubric, index) => (
//                 <div
//                   key={index}
//                   style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     padding: '8px',
//                     borderBottom: '1px solid #eee',
//                     backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
//                   }}
//                 >
//                   <button
//                     onClick={() => onAddRubric(rubric)}
//                     style={{
//                       marginRight: '10px',
//                       padding: '5px 10px',
//                       backgroundColor: '#28a745',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '3px',
//                       cursor: 'pointer',
//                     }}
//                   >
//                     +
//                   </button>
//                   <div>
//                     <div style={{ fontWeight: 'bold' }}>{rubric.name}</div>
//                     <div style={{ fontSize: '0.9em', color: '#555' }}>
//                       {rubric.chapter}
//                       {rubric.grade && `, Grade ${rubric.grade}`}
//                       {rubric.sourceBook && `, ${rubric.sourceBook}`}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div style={{ padding: '10px', textAlign: 'center', color: '#777' }}>
//                 No search results
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// AdvancedRubricSearch.propTypes = {
//   searchResults: PropTypes.arrayOf(
//     PropTypes.shape({
//       name: PropTypes.string.isRequired,
//       chapter: PropTypes.string.isRequired,
//       grade: PropTypes.number,
//       sourceBook: PropTypes.string,
//     })
//   ).isRequired,
//   searchQuery: PropTypes.string.isRequired,
//   onSearchChange: PropTypes.func.isRequired,
//   onAddRubric: PropTypes.func.isRequired,
// };

// export default AdvancedRubricSearch;

