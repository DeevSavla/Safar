import api, { checkApiConnection } from './api'

// Mock data for development environment
const MOCK_ITINERARIES = [
  {
    id: 'mock-1',
    title: 'Trip to Paris',
    destination: 'Paris, France',
    startDate: '2023-06-10',
    endDate: '2023-06-17',
    description: 'Exploring the City of Lights',
    isPrivate: false,
    days: [
      {
        id: 'day-1',
        dayNumber: 1,
        date: '2023-06-10',
        activities: [
          {
            id: 'act-1',
            title: 'Eiffel Tower Visit',
            startTime: '10:00',
            endTime: '12:00',
            placeName: 'Eiffel Tower',
            placeId: 'place-1',
            notes: 'Buy tickets in advance',
            cost: 25
          }
        ]
      }
    ]
  },
  {
    id: 'mock-2',
    title: 'Weekend in Rome',
    destination: 'Rome, Italy',
    startDate: '2023-07-15',
    endDate: '2023-07-17',
    description: 'Exploring ancient history',
    isPrivate: true,
    days: []
  }
];

// Check if we should use mock data in development
let useMockData = false;

// Function to check API connection and update mock data flag
const checkConnection = async () => {
  if (import.meta.env.DEV) {
    useMockData = !(await checkApiConnection());
    if (useMockData) {
      console.info('Using mock data for itineraries (backend not available)');
    }
  }
};

// Initialize connection check
checkConnection();

function getItineraries() {
  // If in development and backend is unavailable, return mock data
  if (useMockData) {
    console.log('Returning mock itineraries data');
    return Promise.resolve(MOCK_ITINERARIES);
  }

  return api.get('/itineraries')
    .then(response => {
      console.log('Itineraries response:', response);
      const data = response.data;
      
      // Handle different possible API response formats
      if (data && data.status === 'success' && data.data) {
        // API format: { status: 'success', message: '...', data: {...}, timestamp: '...' }
        console.log('Standard API response format detected');
        return data.data.itineraries || data.data;
      } else if (data && typeof data === 'object' && data.itineraries) {
        // API format: { itineraries: [...] }
        console.log('Direct itineraries object detected');
        return data.itineraries;
      } else if (Array.isArray(data)) {
        // API format: direct array of itineraries
        console.log('Direct array of itineraries detected');
        return data;
      } else if (data && typeof data === 'object') {
        // Handle other object format
        console.log('Other object format detected, looking for data');
        return data.items || data.data || data.results || [];
      }
      
      console.log('No recognizable format, returning empty array');
      return [];
    })
    .catch(err => {
      console.error('Error fetching itineraries:', err);
      // If we get a network error in development, switch to mock data for future requests
      if (import.meta.env.DEV && err.code === 'ERR_NETWORK') {
        useMockData = true;
        console.info('Switching to mock data after network error');
        return MOCK_ITINERARIES;
      }
      throw err;
    });
}

function getItineraryById(id) {
  // If in development and backend is unavailable, return mock data
  if (useMockData) {
    const mockItinerary = MOCK_ITINERARIES.find(item => item.id === id);
    return Promise.resolve(mockItinerary || null);
  }

  console.log(`Fetching itinerary with ID: ${id}`);
  
  return api.get(`/itineraries/${id}`)
    .then(response => {
      console.log('Itinerary details response:', response);
      
      // The backend response format is:
      // { status: 'success', message: '...', data: { itinerary: {...} }, timestamp: '...' }
      const responseData = response.data;
      
      if (responseData && responseData.data && responseData.data.itinerary) {
        console.log('Found standard API response format with itinerary in data');
        return responseData.data.itinerary;
      } 
      else if (responseData && responseData.itinerary) {
        console.log('Found itinerary directly in response data');
        return responseData.itinerary;
      }
      else if (responseData && (responseData._id || responseData.id)) {
        console.log('Found ID directly in response data');
        return responseData;
      }
      
      console.log('Returning default response data');
      return responseData;
    })
    .catch(err => {
      console.error(`Error fetching itinerary ${id}:`, err);
      if (import.meta.env.DEV && err.code === 'ERR_NETWORK') {
        const mockItinerary = MOCK_ITINERARIES.find(item => item.id === id);
        return mockItinerary || null;
      }
      throw err;
    });
}

function createItinerary(formData) {
  // If in development and backend is unavailable, create mock data
  if (useMockData) {
    const newItinerary = {
      ...formData,
      id: `mock-${Date.now()}`,
      days: []
    };
    MOCK_ITINERARIES.push(newItinerary);
    return Promise.resolve(newItinerary);
  }

  // Transform the data to match the backend schema
  const itineraryData = {
    title: formData.title,
    description: formData.description || '',
    destination: {
      name: formData.destination
    },
    dateRange: {
      start: formData.startDate,
      end: formData.endDate
    },
    generateDays: true,
    source: formData.source || '',
    sourceLocation: formData.sourceLocation || 'Borivali',
    numberOfPeople: parseInt(formData.numberOfPeople) || 1,
    budget: {
      currency: formData.currency || 'USD',
      total: parseFloat(formData.budget) || 0
    }
  };

  // Add locations data if available
  if (formData.locations && formData.locations.length > 0) {
    // If there's at least one location, use it to set the main destination's location
    if (formData.locations.length > 0) {
      const mainLocation = formData.locations[0];
      itineraryData.destination.location = {
        type: 'Point',
        coordinates: [mainLocation.lng, mainLocation.lat]  // MongoDB uses [lng, lat] format
      };
    }
    
    // Add the full array of locations
    itineraryData.routeLocations = formData.locations.map(loc => ({
      name: loc.name,
      description: loc.description,
      placeId: loc.placeId,
      location: {
        type: 'Point',
        coordinates: [loc.lng, loc.lat]
      }
    }));
  }

  console.log('Sending itinerary data to backend:', itineraryData);

  return api.post('/itineraries', itineraryData)
    .then(response => {
      // Log the complete response to understand the structure
      console.log('Full API response:', response);
      
      // The backend response format is:
      // { status: 'success', message: '...', data: { itinerary: {...} }, timestamp: '...' }
      const responseData = response.data;
      
      if (responseData && responseData.data && responseData.data.itinerary) {
        console.log('Found standard API response format with itinerary in data');
        return responseData.data.itinerary;
      } 
      else if (responseData && responseData.itinerary) {
        console.log('Found itinerary directly in response data');
        return responseData.itinerary;
      }
      else if (responseData && (responseData._id || responseData.id)) {
        console.log('Found ID directly in response data');
        return responseData;
      }
      
      console.log('Returning default response data');
      return responseData;
    })
    .catch(err => {
      console.error('Error creating itinerary:', err);
      if (import.meta.env.DEV && err.code === 'ERR_NETWORK') {
        const newItinerary = {
          ...formData,
          id: `mock-${Date.now()}`,
          days: []
        };
        MOCK_ITINERARIES.push(newItinerary);
        useMockData = true;
        return newItinerary;
      }
      throw err;
    });
}

function updateItinerary(id, formData) {
  // If in development and backend is unavailable, update mock data
  if (useMockData) {
    const index = MOCK_ITINERARIES.findIndex(item => item.id === id);
    if (index !== -1) {
      MOCK_ITINERARIES[index] = { ...MOCK_ITINERARIES[index], ...formData };
      return Promise.resolve(MOCK_ITINERARIES[index]);
    }
    return Promise.reject(new Error('Itinerary not found'));
  }

  // Transform the data to match the backend schema
  let itineraryData = {};
  
  if (formData.title) itineraryData.title = formData.title;
  if (formData.description !== undefined) itineraryData.description = formData.description;
  
  if (formData.destination) {
    itineraryData.destination = { 
      name: formData.destination 
    };
  }
  
  if (formData.startDate && formData.endDate) {
    itineraryData.dateRange = {
      start: formData.startDate,
      end: formData.endDate
    };
  }

  // Add locations data if available
  if (formData.locations && formData.locations.length > 0) {
    // If there's at least one location, use it to set the main destination's location
    if (formData.locations.length > 0) {
      const mainLocation = formData.locations[0];
      if (!itineraryData.destination) {
        itineraryData.destination = {};
      }
      itineraryData.destination.location = {
        type: 'Point',
        coordinates: [mainLocation.lng, mainLocation.lat]  // MongoDB uses [lng, lat] format
      };
    }
    
    // Add the full array of locations
    itineraryData.routeLocations = formData.locations.map(loc => ({
      name: loc.name,
      description: loc.description,
      placeId: loc.placeId,
      location: {
        type: 'Point',
        coordinates: [loc.lng, loc.lat]
      }
    }));
  }

  return api.put(`/itineraries/${id}`, itineraryData)
    .then(response => {
      // The backend might return { itinerary: {...} } or just the itinerary object
      const data = response.data;
      return data.itinerary || data;
    });
}

function deleteItinerary(id) {
  // If in development and backend is unavailable, delete from mock data
  if (useMockData) {
    const index = MOCK_ITINERARIES.findIndex(item => item.id === id);
    if (index !== -1) {
      MOCK_ITINERARIES.splice(index, 1);
      return Promise.resolve({ success: true });
    }
    return Promise.reject(new Error('Itinerary not found'));
  }

  return api.delete(`/itineraries/${id}`)
    .then(response => response.data);
}

function addDayToItinerary(itineraryId, dayData) {
  // If in development and backend is unavailable, add day to mock data
  if (useMockData) {
    const itinerary = MOCK_ITINERARIES.find(item => item.id === itineraryId);
    if (itinerary) {
      const newDay = { ...dayData, id: `day-${Date.now()}`, activities: [] };
      if (!itinerary.days) {
        itinerary.days = [];
      }
      itinerary.days.push(newDay);
      return Promise.resolve(itinerary);
    }
    return Promise.reject(new Error('Itinerary not found'));
  }

  return api.post(`/itineraries/${itineraryId}/days`, dayData)
    .then(response => response.data);
}

function addCollaboratorToItinerary(itineraryId, email, role) {
  // If in development and backend is unavailable, use mock data
  if (useMockData) {
    const mockItinerary = MOCK_ITINERARIES.find(item => item.id === itineraryId);
    if (mockItinerary) {
      if (!mockItinerary.collaborators) {
        mockItinerary.collaborators = [];
      }
      mockItinerary.collaborators.push({
        user: {
          id: `mock-user-${Date.now()}`,
          email,
          name: email.split('@')[0]
        },
        role
      });
      return Promise.resolve(mockItinerary);
    }
    return Promise.reject(new Error('Itinerary not found'));
  }

  return api.post(`/itineraries/${itineraryId}/collaborators`, { email, role })
    .then(response => {
      console.log('Add collaborator response:', response);
      const data = response.data;
      return data.itinerary || data;
    })
    .catch(err => {
      console.error(`Error adding collaborator to itinerary ${itineraryId}:`, err);
      throw err;
    });
}

function removeCollaboratorFromItinerary(itineraryId, collaboratorId) {
  // If in development and backend is unavailable, use mock data
  if (useMockData) {
    const mockItinerary = MOCK_ITINERARIES.find(item => item.id === itineraryId);
    if (mockItinerary && mockItinerary.collaborators) {
      mockItinerary.collaborators = mockItinerary.collaborators.filter(
        c => c.user.id !== collaboratorId
      );
      return Promise.resolve(mockItinerary);
    }
    return Promise.reject(new Error('Itinerary or collaborator not found'));
  }

  return api.delete(`/itineraries/${itineraryId}/collaborators/${collaboratorId}`)
    .then(response => {
      console.log('Remove collaborator response:', response);
      const data = response.data;
      return data.itinerary || data;
    })
    .catch(err => {
      console.error(`Error removing collaborator from itinerary ${itineraryId}:`, err);
      throw err;
    });
}

/**
 * Renumber days in chronological order
 * @param {String} itineraryId - Itinerary ID
 * @returns {Promise} - Promise with the result
 */
export const renumberDays = async (itineraryId) => {
  try {
    const response = await api.post(`/itineraries/${itineraryId}/renumber-days`);
    return response.data;
  } catch (error) {
    console.error('Error renumbering days:', error);
    throw error;
  }
};

export {
  getItineraries,
  getItineraryById,
  createItinerary,
  updateItinerary,
  deleteItinerary,
  addDayToItinerary,
  addCollaboratorToItinerary,
  removeCollaboratorFromItinerary,
} 