/**
 * Utilities for handling AI responses
 */

/**
 * Clean and parse the itinerary JSON from AI response
 * @param {Object} aiResponse - The AI response object
 * @returns {Object} The cleaned and parsed itinerary
 */
export function cleanAndParseItineraryResponse(aiResponse) {
  try {
    // If the response is already a valid itinerary object, return it
    if (aiResponse.itinerary && typeof aiResponse.itinerary !== 'string') {
      return {
        message: aiResponse.message || 'Itinerary updated successfully',
        itinerary: aiResponse.itinerary
      };
    }
    
    // Otherwise, try to parse the response text
    let itineraryJson = aiResponse.itinerary || '{}';
    
    // If the response is a string, try to extract JSON from it
    if (typeof itineraryJson === 'string') {
      // Try to find JSON in the response text
      const jsonRegex = /{[\s\S]*}/gm;
      const match = itineraryJson.match(jsonRegex);
      
      if (match && match.length > 0) {
        itineraryJson = match[0];
      }
      
      // Remove any markdown code block syntax
      itineraryJson = itineraryJson.replace(/```json|```/g, '').trim();
    }
    
    // Parse the JSON
    const itinerary = JSON.parse(itineraryJson);
    
    return {
      message: aiResponse.message || 'Itinerary updated successfully',
      itinerary
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI response');
  }
} 