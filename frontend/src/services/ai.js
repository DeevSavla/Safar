import api from './api';

/**
 * Services for AI features
 */

// Define the AI service URL
const AI_SERVICE_URL = 'http://localhost:8000/api/ai';

/**
 * Edit an itinerary using AI
 * @param {String} itineraryId - The ID of the itinerary to edit
 * @param {String} message - The user's edit request message
 * @returns {Promise} The response from the API
 */
export const editItineraryWithAI = async (itineraryId, message) => {
  try {
    const response = await api.post(`/itineraries/${itineraryId}/edit-with-ai`, {
      message
    });
    return response.data;
  } catch (error) {
    console.error('Error editing itinerary with AI:', error);
    throw error;
  }
};

/**
 * Direct access to the AI edit endpoint (for testing or advanced use)
 * @param {String} sessionId - Session ID for the AI conversation
 * @param {Object} currentItinerary - The current itinerary data
 * @param {String} message - The user's edit request message
 * @returns {Promise} The response from the AI service
 */
export const callAIEditEndpoint = async (sessionId, currentItinerary, message) => {
  try {
    const response = await api.post(`${AI_SERVICE_URL}/edit-itinerary`, {
      session_id: sessionId,
      current_itinerary: currentItinerary,
      message
    });
    return response.data;
  } catch (error) {
    console.error('Error calling AI edit endpoint:', error);
    throw error;
  }
};

const aiService = {
  editItineraryWithAI,
  callAIEditEndpoint
};

export default aiService; 