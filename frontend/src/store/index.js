import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import itineraryReducer from './slices/itinerarySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    itinerary: itineraryReducer,
    // Add other reducers here as needed
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
