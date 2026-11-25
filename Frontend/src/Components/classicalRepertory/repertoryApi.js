
const BASE_URL = 'http://localhost:5000'; // Assume base URL will be provided or is relative to the current host

/**
 * Handles HTTP responses, checking for errors and parsing JSON.
 * @param {Response} response - The fetch API response object.
 * @returns {Promise<Object>} - The parsed JSON response.
 * @throws {Error} - If the response indicates an error.
 */
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error', status: response.status }));
  throw new Error(
  errorData.error ||
  errorData.message ||
  `HTTP error! status: ${response.status}`
);
  }
  return response.json();
}

/**
 * Generates suggested rubrics based on symptoms.
   * @param {Array<Object>} structuredSymptoms - An array of structured symptom objects {field: "Field Name", value: "Symptom Value"}.
 * @param {string} token - The authorization token.
 * @returns {Promise<Object>} - The backend JSON response.
 */
export async function generateSuggestedRubrics(structuredSymptoms, token) {
  try {
    console.log("REPERTORY TOKEN:", token);
    const response = await fetch(`${BASE_URL}/api/ai-rubrics/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ structuredSymptoms: structuredSymptoms }),
    });
    const result = await handleResponse(response);
    console.log('🔥 [FRONTEND API RESPONSE RECEIVED - generateSuggestedRubrics]:', result);
    return result;
  } catch (error) {
    console.error('Error generating suggested rubrics:', error);
    throw error;
  }
}

/**
 * Generates a repertory matrix based on selected rubrics and thermal modality.
 * @param {Array<Object>} selectedRubrics - An array of selected rubric objects.
 * @param {string} thermal - The thermal modality (e.g., "Hot", "Chilly").
 * @param {string} token - The authorization token.
 * @returns {Promise<Object>} - The backend JSON response.
 */
export async function generateRepertoryMatrix(selectedRubrics, thermal, token, caseData, structuredSymptoms) {
  try {
    const payload = {
      selectedRubrics,
      thermal,
      caseData,
      structuredSymptoms
    };
    console.log("Matrix API payload:", payload);
    console.log("REPERTORY TOKEN:", token);
    const response = await fetch(`${BASE_URL}/api/repertory/matrix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await handleResponse(response);
    console.log('🔥 [FRONTEND API RESPONSE RECEIVED - generateRepertoryMatrix]:', result);
    return result;
  } catch (error) {
    console.error('Error generating repertory matrix:', error);
    throw error;
  }
}

/**
 * Searches for advanced rubrics based on a query string.
 * @param {string} query - The search query string.
 * @param {string} token - The authorization token.
 * @returns {Promise<Object>} - The backend JSON response.
 */
export async function searchAdvancedRubrics(query, token) {
  try {
    console.log("REPERTORY TOKEN:", token);
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`${BASE_URL}/api/analyze-case/search?q=${encodedQuery}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error searching advanced rubrics:', error);
    throw error;
  }
}


