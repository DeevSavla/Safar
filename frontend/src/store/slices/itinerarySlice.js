import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as itineraryService from '../../services/itinerary';
import axios from 'axios';
import api from '../../services/api';
import { renumberDays as renumberDaysService } from '../../services/itinerary';

// Initial state
const initialState = {
  itineraries: [],
  currentItinerary: null,
  currentDay: null,
  publicItineraries: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchItineraries = createAsyncThunk(
  'itinerary/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await itineraryService.getItineraries();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch itineraries');
    }
  }
);

export const fetchItineraryById = createAsyncThunk(
  'itinerary/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await itineraryService.getItineraryById(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch itinerary');
    }
  }
);

export const createItinerary = createAsyncThunk(
  'itinerary/create',
  async (formData, { rejectWithValue }) => {
    try {
      return await itineraryService.createItinerary(formData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create itinerary');
    }
  }
);

export const updateItinerary = createAsyncThunk(
  'itinerary/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await itineraryService.updateItinerary(id, data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update itinerary');
    }
  }
);

export const removeItinerary = createAsyncThunk(
  'itinerary/delete',
  async (id, { rejectWithValue }) => {
    try {
      await itineraryService.deleteItinerary(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete itinerary');
    }
  }
);

export const addDayToItinerary = createAsyncThunk(
  'itinerary/addDay',
  async ({ itineraryId, dayData }, { rejectWithValue }) => {
    try {
      return await itineraryService.addDayToItinerary(itineraryId, dayData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add day to itinerary');
    }
  }
);

export const addCollaborator = createAsyncThunk(
  'itinerary/addCollaborator',
  async ({ itineraryId, email, role }, { rejectWithValue }) => {
    try {
      return await itineraryService.addCollaboratorToItinerary(itineraryId, email, role);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add collaborator to itinerary');
    }
  }
);

export const removeCollaborator = createAsyncThunk(
  'itinerary/removeCollaborator',
  async ({ itineraryId, collaboratorId }, { rejectWithValue }) => {
    try {
      return await itineraryService.removeCollaboratorFromItinerary(itineraryId, collaboratorId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove collaborator from itinerary');
    }
  }
);

export const fetchPublicItineraries = createAsyncThunk(
  'itinerary/fetchPublic',
  async ({ page = 1, limit = 10, search = '' }, { rejectWithValue, getState }) => {
    try {
      // Get auth state
      const { auth } = getState();
      if (!auth || !auth.isAuthenticated) {
        return rejectWithValue('Authentication required');
      }
      
      // Use the configured API instance which already handles auth headers
      const response = await api.get('/itineraries/public', {
        params: { page, limit, search }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching public itineraries:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public itineraries');
    }
  }
);

/**
 * Renumber days in chronological order
 */
export const renumberDays = createAsyncThunk(
  'itinerary/renumberDays',
  async (itineraryId, { rejectWithValue }) => {
    try {
      const response = await renumberDaysService(itineraryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to renumber days');
    }
  }
);

// Itinerary slice
const itinerarySlice = createSlice({
  name: 'itinerary',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentItinerary: (state) => {
      state.currentItinerary = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all itineraries
      .addCase(fetchItineraries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchItineraries.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Handle different response formats
        const payload = action.payload;
        
        if (payload && payload.itineraries) {
          // Format: { itineraries: [...] }
          state.itineraries = payload.itineraries;
        } else if (payload && payload.data && payload.data.itineraries) {
          // Format: { status, message, data: { itineraries: [...] } }
          state.itineraries = payload.data.itineraries;
        } else if (Array.isArray(payload)) {
          // Format: direct array of itineraries
          state.itineraries = payload;
        } else {
          // Default case
          state.itineraries = payload;
        }
      })
      .addCase(fetchItineraries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch itinerary by ID
      .addCase(fetchItineraryById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchItineraryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentItinerary = action.payload;
        
        // Sort days by date if they exist
        if (state.currentItinerary && state.currentItinerary.days && state.currentItinerary.days.length > 0) {
          state.currentItinerary.days.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        
        state.error = null;
      })
      .addCase(fetchItineraryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create itinerary
      .addCase(createItinerary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createItinerary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.itineraries.push(action.payload);
      })
      .addCase(createItinerary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update itinerary
      .addCase(updateItinerary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateItinerary.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.itineraries.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.itineraries[index] = action.payload;
        }
        if (state.currentItinerary && state.currentItinerary.id === action.payload.id) {
          state.currentItinerary = action.payload;
        }
      })
      .addCase(updateItinerary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete itinerary
      .addCase(removeItinerary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeItinerary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.itineraries = state.itineraries.filter(item => item.id !== action.payload);
        if (state.currentItinerary && state.currentItinerary.id === action.payload) {
          state.currentItinerary = null;
        }
      })
      .addCase(removeItinerary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add day to itinerary
      .addCase(addDayToItinerary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addDayToItinerary.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentItinerary) {
          // Add the new day
          if (!state.currentItinerary.days) {
            state.currentItinerary.days = [];
          }
          state.currentItinerary.days.push(action.payload.day);
          
          // Sort days by date
          state.currentItinerary.days.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        state.error = null;
      })
      .addCase(addDayToItinerary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add collaborator to itinerary
      .addCase(addCollaborator.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCollaborator.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentItinerary = action.payload;
        // Update the itinerary in the list if it exists
        const index = state.itineraries.findIndex(item => 
          item.id === action.payload.id || item._id === action.payload._id
        );
        if (index !== -1) {
          state.itineraries[index] = action.payload;
        }
      })
      .addCase(addCollaborator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Remove collaborator from itinerary
      .addCase(removeCollaborator.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeCollaborator.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentItinerary = action.payload;
        // Update the itinerary in the list if it exists
        const index = state.itineraries.findIndex(item => 
          item.id === action.payload.id || item._id === action.payload._id
        );
        if (index !== -1) {
          state.itineraries[index] = action.payload;
        }
      })
      .addCase(removeCollaborator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch public itineraries
      .addCase(fetchPublicItineraries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicItineraries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicItineraries = action.payload;
      })
      .addCase(fetchPublicItineraries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch public itineraries';
      })
      
      // Renumber days
      .addCase(renumberDays.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(renumberDays.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // If the days array exists in the response and the current itinerary
        if (action.payload && action.payload.days && state.currentItinerary) {
          // Sort the days by date (just to be extra sure)
          const sortedDays = action.payload.days.sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // Update the days array with the sorted days
          state.currentItinerary.days = sortedDays;
        }
      })
      .addCase(renumberDays.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to renumber days';
      })
  }
});

export const { clearError, clearCurrentItinerary } = itinerarySlice.actions;
export default itinerarySlice.reducer; 