import express from 'express';
import itineraryController from '../controllers/itinerary.controller.js';
import costController from '../controllers/cost.controller.js';
import {authenticate} from '../middleware/auth.js';

const router = express.Router();

// Create a new itinerary
router.post(
  '/',
  authenticate,
  itineraryController.createItinerary
);

// Get all itineraries for a user
router.get(
  '/',
  authenticate,
  itineraryController.getItineraries
);

// Process AI generated itinerary
router.post(
  '/:id/process-ai-itinerary',
  authenticate,
  itineraryController.processAiItinerary
);

// Get a day by ID
router.get(
  '/days/:dayId',
  authenticate,
  itineraryController.getDayById
);

// Update a day
router.put(
  '/days/:dayId',
  authenticate,
  itineraryController.updateDay
);

// Add an activity to a day
router.post(
  '/days/:dayId/activities',
  authenticate,
  itineraryController.addActivity
);

// Reorder activities for a day
router.post(
  '/days/:dayId/reorder',
  authenticate,
  itineraryController.reorderActivities
);

// Update an activity
router.put(
  '/activities/:activityId',
  authenticate,
  itineraryController.updateActivity
);

// Delete an activity
router.delete(
  '/activities/:activityId',
  authenticate,
  itineraryController.deleteActivity
);

// Public itineraries routes
router.get(
  '/public',
  authenticate,
  itineraryController.getPublicItineraries
);

// Get an itinerary by ID
router.get(
  '/:id',
  authenticate,
  itineraryController.getItineraryById
);

// Update an itinerary
router.put(
  '/:id',
  authenticate,
  itineraryController.updateItinerary
);

// Delete an itinerary
router.delete(
  '/:id',
  authenticate,
  itineraryController.deleteItinerary
);

// Add a collaborator to an itinerary
router.post(
  '/:id/collaborators',
  authenticate,
  itineraryController.addCollaborator
);

// Remove a collaborator from an itinerary
router.delete(
  '/:id/collaborators/:collaboratorId',
  authenticate,
  itineraryController.removeCollaborator
);

// Calculate total costs for an itinerary
router.get(
  '/:itineraryId/costs',
  authenticate,
  costController.calculateItineraryCost
);

// Calculate daily costs for an itinerary
router.get(
  '/:itineraryId/costs/daily',
  authenticate,
  costController.calculateDailyCosts
);

// Get budget status for an itinerary
router.get(
  '/:itineraryId/budget',
  authenticate,
  costController.getBudgetStatus
);

// Join request routes
router.post(
  '/:itineraryId/join-request',
  authenticate,
  itineraryController.requestToJoin
);

router.patch(
  '/:itineraryId/join-request/:requesterId',
  authenticate,
  itineraryController.processJoinRequest
);

router.get(
  '/:itineraryId/join-requests',
  authenticate,
  itineraryController.getJoinRequests
);

router.patch(
  '/:itineraryId/joinable',
  authenticate,
  itineraryController.togglePublicJoinSetting
);

// Update an itinerary with AI
router.post(
  '/:id/edit-with-ai',
  authenticate,
  itineraryController.editItineraryWithAI
);

// Renumber days in chronological order
router.post(
  '/:id/renumber-days',
  authenticate,
  itineraryController.renumberDays
);

// Update itinerary budget
router.patch(
  '/:id/budget',
  authenticate,
  itineraryController.updateBudget
);

// Clear all activities for a day
router.delete(
  '/:id/days/:dayId/activities',
  authenticate,
  itineraryController.clearDayActivities
);

// Add activity to a day
router.post(
  '/:id/days/:dayId/activities',
  authenticate,
  itineraryController.addActivity
);

// Get suggestions for an itinerary
router.get(
  '/:id/suggestions',
  authenticate,
  itineraryController.getItinerarySuggestions
);

export default router; 