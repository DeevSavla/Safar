import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchItineraryById, updateItinerary } from '../store/slices/itinerarySlice';
import { toast } from 'react-toastify';
import api from '../services/api';
import aiService from '../services/ai';

const AiEditItinerary = ({ itineraryId }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dispatch = useDispatch();
  
  // Get the current itinerary to get day information
  const { currentItinerary } = useSelector(state => state.itinerary);
  const dayCount = currentItinerary?.days?.length || 0;

  // Define some common activity types for suggestions
  const activitySuggestions = [
    "outdoor activity",
    "museum visit",
    "local restaurant",
    "coffee break",
    "sightseeing tour",
    "shopping trip"
  ];

  // Get a random activity suggestion
  const getRandomActivitySuggestion = () => {
    const randomIndex = Math.floor(Math.random() * activitySuggestions.length);
    return activitySuggestions[randomIndex];
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  // Add handlers for preset messages
  const handlePresetMessage = (preset) => {
    // If the preset contains placeholder, replace it with a random activity
    if (preset.includes('__')) {
      preset = preset.replace('__', getRandomActivitySuggestion());
    }
    
    setMessage(preset);
    // Focus on the textarea after setting the message
    document.getElementById('ai-message').focus();
  };

  const handleSpecialCases = async (message) => {
    // Check for free day request with improved regex
    const freeDayMatch = message.toLowerCase().match(/(?:give me |make |create |set up |set |add |)(?:a |)free day (?:on |for |)(?:day |)(\d+)/);
    const genericFreeDayRequest = /(?:give me |make |create |set up |set |add |)(?:a |)free day/.test(message.toLowerCase()) && !freeDayMatch;

    if (freeDayMatch || message.toLowerCase().match(/free day (\d+)/) || genericFreeDayRequest) {
      // If it's a generic "free day" request without specifying which day,
      // default to the last day in the itinerary
      let dayNumber;
      
      if (genericFreeDayRequest) {
        if (!currentItinerary?.days || currentItinerary.days.length === 0) {
          toast.error('No days found in this itinerary');
          return false;
        }
        dayNumber = currentItinerary.days.length; // Use the last day
        toast.info(`Using day ${dayNumber} as no specific day was mentioned`);
      } else {
        dayNumber = parseInt(freeDayMatch ? freeDayMatch[1] : message.toLowerCase().match(/free day (\d+)/)[1]);
      }
      
      try {
        // Get sorted days to find the correct day by chronological index
        if (!currentItinerary?.days || currentItinerary.days.length === 0) {
          toast.error('No days found in this itinerary');
          return false;
        }
        
        // Get days sorted by date
        const sortedDays = [...currentItinerary.days].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Find the day with the requested number (1-based index in the chronological order)
        const dayIndex = dayNumber - 1; // Convert to 0-based index
        
        if (dayIndex < 0 || dayIndex >= sortedDays.length) {
          toast.error(`Day ${dayNumber} not found. This itinerary has ${sortedDays.length} days.`);
          return false;
        }
        
        const targetDay = sortedDays[dayIndex];
        // Get the day ID, handling different possible formats
        const dayId = targetDay._id || targetDay.id;
        
        if (!dayId) {
          console.error('No valid ID found for day:', targetDay);
          toast.error(`Could not identify day ${dayNumber}`);
          return false;
        }
        
        // Clear all activities for this day
        const response = await api.delete(`/itineraries/${itineraryId}/days/${dayId}/activities`);
        
        toast.success(`All activities cleared for day ${dayNumber}`);
        setAiResponse(`I've cleared all activities for day ${dayNumber}, giving you a free day to relax or explore on your own.`);
        
        // Refresh itinerary data
        await dispatch(fetchItineraryById(itineraryId)).unwrap();
        return true;
      } catch (error) {
        console.error(`Error processing free day request for day ${dayNumber}:`, error);
        
        if (error.response?.status === 404) {
          toast.error(`Day ${dayNumber} not found on the server`);
        } else {
          toast.error(`Failed to clear activities for day ${dayNumber}: ${error.message || 'Unknown error'}`);
        }
        
        return false;
      }
    }
    
    // Check for "Decrease the budget" pattern - moved to global handler
    const decreaseBudgetMatch = message.toLowerCase().match(/(?:decrease|reduce|lower|cut)(?:\s+the)?\s+budget(?:\s+for this itinerary)?/i);
    if (decreaseBudgetMatch) {
      // Budget reduction handled in global code - don't duplicate here
      return true;
    }
    
    // Check for "Add X to day Y" pattern
    const addToDayMatch = message.toLowerCase().match(/(?:add|include|insert|put|place|create)(?:\s+an?|\s+a|\s+some|\s+)?\s+([^\.]*?)(?:\s+to|\s+in|\s+on|\s+for|\s+at)?\s+(?:the\s+)?(?:day\s+)?(\d+)(?:$|[\s\.,])/i);
    
    if (addToDayMatch) {
      const activityDescription = addToDayMatch[1].trim();
      const dayNumber = parseInt(addToDayMatch[2]);
      
      // Log the extracted information for debugging
      console.log("Detected add activity request:", { 
        activityDescription, 
        dayNumber,
        fullMatch: addToDayMatch[0]
      });
      
      return false; // Let the global handler take care of this
    }
    
    return false; // Not a special case
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    setIsLoading(true);
    setAiResponse('');
    
    console.log("Processing request:", message);
    
    try {
      // Check for "Decrease the budget" pattern
      const decreaseBudgetMatch = message.toLowerCase().match(/(?:decrease|reduce|lower|cut)(?:\s+the)?\s+budget(?:\s+for this itinerary)?/i);
      
      // Handle budget reduction request
      if (decreaseBudgetMatch) {
        try {
          if (!currentItinerary || !currentItinerary.budget) {
            toast.error('No budget information found for this itinerary');
            setIsLoading(false);
            return;
          }
          
          // Get current budget
          const currentBudget = currentItinerary.budget;
          const currentBudgetTotal = currentBudget.total || 0;
          
          if (!currentBudgetTotal || currentBudgetTotal <= 0) {
            toast.error('Current budget is zero or not set');
            setIsLoading(false);
            return;
          }
          
          // Generate random number between 0 and 1 (exclusive of 0)
          // We add 0.2 to ensure the budget isn't reduced too dramatically (so range is 0.2 to 0.8)
          const randomFactor = (Math.random() * 0.6) + 0.2;
          
          // Calculate new budget
          const newBudgetTotal = Math.round(currentBudgetTotal * randomFactor);
          const reduction = currentBudgetTotal - newBudgetTotal;
          const reductionPercentage = Math.round((1 - randomFactor) * 100);
          
          console.log('Budget reduction:', {
            currentBudget: currentBudgetTotal,
            randomFactor,
            newBudget: newBudgetTotal,
            reduction,
            reductionPercentage: `${reductionPercentage}%`
          });
          
          // Update the budget in the database
          const response = await api.put(
            `/budget/itineraries/${itineraryId}`,
            { 
              total: newBudgetTotal, 
              currency: currentBudget.currency || 'USD' 
            }
          );
          
          // Success message
          toast.success(`Budget decreased by ${reductionPercentage}%`);
          setAiResponse(`I've decreased the budget from ${currentBudgetTotal} to ${newBudgetTotal} ${currentBudget.currency || 'USD'} (a ${reductionPercentage}% reduction).`);
          
          // Refresh itinerary data
          await dispatch(fetchItineraryById(itineraryId)).unwrap();
          setIsLoading(false);
          setMessage('');
          return;
        } catch (error) {
          console.error('Error decreasing budget:', error);
          toast.error('Failed to decrease the budget');
          setIsLoading(false);
          return;
        }
      }
      
      // Check for "Add X to day Y" pattern
      const addToDayMatch = message.toLowerCase().match(/(?:add|include|insert|put|place|create)(?:\s+an?|\s+a|\s+some|\s+)?\s+([^\.]*?)(?:\s+to|\s+in|\s+on|\s+for|\s+at)?\s+(?:the\s+)?(?:day\s+)?(\d+)(?:$|[\s\.,])/i);
      
      if (addToDayMatch) {
        const activityDescription = addToDayMatch[1].trim();
        const dayNumber = parseInt(addToDayMatch[2]);
        
        // Log the extracted information for debugging
        console.log("Detected add activity request:", { 
          activityDescription, 
          dayNumber,
          fullMatch: addToDayMatch[0]
        });
        
        try {
          // Get sorted days to find the correct day by chronological index
          if (!currentItinerary?.days || currentItinerary.days.length === 0) {
            toast.error('No days found in this itinerary');
            setIsLoading(false);
            return;
          }
          
          // Sort days by date first
          const sortedDays = [...currentItinerary.days].sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // Day number is 1-based index in the sorted order
          const dayIndex = dayNumber - 1; // Convert to 0-based index
          
          if (dayIndex < 0 || dayIndex >= sortedDays.length) {
            toast.error(`Day ${dayNumber} not found. This itinerary has ${sortedDays.length} days.`);
            setIsLoading(false);
            return;
          }
          
          const targetDay = sortedDays[dayIndex];
          
          // Get the day ID, handling different possible formats
          const dayId = targetDay._id || targetDay.id;
          
          if (!dayId) {
            console.error('No valid ID found for day:', targetDay);
            toast.error(`Could not identify day ${dayNumber}`);
            setIsLoading(false);
            return;
          }
          
          // Create a default time for the activity (noon)
          const activityTime = {
            start: "12:00",
            end: "13:00"
          };
          
          // Create a new activity
          const activityData = {
            title: activityDescription.charAt(0).toUpperCase() + activityDescription.slice(1),
            description: `${activityDescription} added through AI assistant`,
            timeRange: activityTime,
            type: "other"
          };
          
          // Add the activity to the day
          console.log(`Adding activity to itinerary ${itineraryId}, day ${dayId}:`, activityData);
          const response = await api.post(`/itineraries/${itineraryId}/days/${dayId}/activities`, activityData);
          
          toast.success(`Added "${activityData.title}" to day ${dayNumber}`);
          setAiResponse(`I've added "${activityData.title}" to day ${dayNumber} at ${activityTime.start}.`);
          
          // Refresh itinerary data
          await dispatch(fetchItineraryById(itineraryId)).unwrap();
          setIsLoading(false);
          setMessage('');
          return;
        } catch (error) {
          console.error(`Error adding activity to day ${dayNumber}:`, error);
          
          if (error.response?.status === 404) {
            toast.error(`Day ${dayNumber} not found on the server`);
          } else {
            toast.error(`Failed to add activity to day ${dayNumber}: ${error.message || 'Unknown error'}`);
          }
          
          setIsLoading(false);
          return;
        }
      }
      
      // First, check if this is a special case we can handle directly
      console.log("Checking for special cases...");
      const isSpecialCase = await handleSpecialCases(message);
      
      // If it's a special case that was handled successfully, we're done
      if (isSpecialCase) {
        console.log("Special case handled successfully");
        setIsLoading(false);
        // Clear the message input
        setMessage('');
        return;
      }
      
      // Otherwise, proceed with the AI service call
      console.log("No special case matched, proceeding with AI service call");
      const response = await aiService.editItineraryWithAI(itineraryId, message);
      
      setAiResponse(response.ai_message || 'Itinerary updated successfully');
      toast.success('Itinerary updated successfully');
      
      // Refresh the itinerary data
      await dispatch(fetchItineraryById(itineraryId)).unwrap();
      
      // Clear the message input
      setMessage('');
    } catch (error) {
      console.error('Error with AI service:', error);
      toast.error('AI service error: ' + (error.message || 'Unknown error'));
      setAiResponse('Error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate day-specific buttons
  const renderDaySpecificButtons = () => {
    if (dayCount === 0) return null;
    
    // Get days sorted by date
    const sortedDays = [...currentItinerary.days].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const buttons = [];
    
    // Add "Add activity" buttons for each day
    for (let i = 1; i <= Math.min(dayCount, 3); i++) {
      // Get the date for this day to display
      const dayDate = sortedDays[i-1]?.date ? 
        new Date(sortedDays[i-1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
        `Day ${i}`;
      
      buttons.push(
        <button
          key={`add-day-${i}`}
          type="button"
          className="text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-full transition-colors"
          onClick={() => handlePresetMessage(`Add outdoor activity to day ${i}`)}
          disabled={isLoading}
        >
          Add to {dayDate}
        </button>
      );
    }
    
    // Add "Free day" buttons for each day
    for (let i = 1; i <= Math.min(dayCount, 3); i++) {
      // Get the date for this day to display
      const dayDate = sortedDays[i-1]?.date ? 
        new Date(sortedDays[i-1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
        `Day ${i}`;
      
      buttons.push(
        <button
          key={`free-day-${i}`}
          type="button"
          className="text-sm bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-full transition-colors"
          onClick={() => handlePresetMessage(`Give me a free day on day ${i}`)}
          disabled={isLoading}
        >
          Free {dayDate}
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">AI Itinerary Editor</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="ai-message" className="block text-sm font-medium text-gray-700 mb-1">
            What would you like to change about your itinerary?
          </label>
          <textarea
            id="ai-message"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Add more outdoor activities on day 2, Move the museum visit to the morning, Change the restaurant for dinner on day 3..."
            value={message}
            onChange={handleMessageChange}
            disabled={isLoading}
          ></textarea>
        </div>
        
        {/* Quick prompt buttons */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Quick Prompts:</p>
            <button 
              type="button"
              className="text-xs text-purple-600 hover:text-purple-800"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? 'Hide' : 'Show more'}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              type="button"
              onClick={() => handlePresetMessage("Add __ to day 1")}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100"
              disabled={isLoading}
            >
              Add activity
            </button>
            
            <button 
              type="button"
              onClick={() => handlePresetMessage("Give me a free day on day 1")}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100"
              disabled={isLoading}
            >
              Create free day
            </button>
            
            <button 
              type="button"
              onClick={() => handlePresetMessage("Decrease the budget for this itinerary")}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100"
              disabled={isLoading}
            >
              Reduce budget
            </button>
            
            {Array.from({ length: Math.min(3, dayCount) }, (_, i) => (
              <button
                key={`day-${i+1}`} 
                type="button"
                onClick={() => handlePresetMessage(`Add __ to day ${i+1}`)}
                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100"
                disabled={isLoading}
              >
                Add to Day {i+1}
              </button>
            ))}
          </div>
          
          {/* Day-specific buttons */}
          {dayCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {renderDaySpecificButtons()}
            </div>
          )}
          
          {/* Additional suggestions */}
          {showSuggestions && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded-full transition-colors"
                onClick={() => handlePresetMessage("Make the itinerary more budget-friendly")}
                disabled={isLoading}
              >
                Budget-friendly
              </button>
              <button
                type="button"
                className="text-sm bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-full transition-colors"
                onClick={() => handlePresetMessage("Add more family-friendly activities")}
                disabled={isLoading}
              >
                Family-friendly
              </button>
              <button
                type="button"
                className="text-sm bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-3 py-1 rounded-full transition-colors"
                onClick={() => handlePresetMessage("Replace indoor activities with outdoor ones")}
                disabled={isLoading}
              >
                More outdoors
              </button>
              <button
                type="button"
                className="text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-full transition-colors"
                onClick={() => handlePresetMessage(`Add a museum visit to day 1`)}
                disabled={isLoading}
              >
                Add museum
              </button>
              <button
                type="button"
                className="text-sm bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-full transition-colors"
                onClick={() => handlePresetMessage(`Add a local restaurant to day 2`)}
                disabled={isLoading}
              >
                Add restaurant
              </button>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? 'Updating...' : 'Update Itinerary'}
        </button>
      </form>
      
      {aiResponse && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium text-gray-700 mb-1">AI Response:</p>
          <p className="text-sm text-gray-600">{aiResponse}</p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Examples:</p>
        <ul className="list-disc list-inside">
          <li>"Add a coffee break between breakfast and lunch on day 2"</li>
          <li>"Replace the museum visit with an outdoor activity"</li>
          <li>"Rearrange day 3 to have more free time in the evening"</li>
        </ul>
      </div>
    </div>
  );
};

export default AiEditItinerary; 