import express from 'express';
import placeController from '../controllers/place.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Search places by query
router.get(
  '/search',
  authenticate,
  placeController.searchPlaces
);

// Search places nearby a specific location
router.get(
  '/nearby',
  authenticate,
  placeController.searchNearby
);

// Get place by ID
router.get(
  '/:id',
  authenticate,
  placeController.getPlaceById
);

export default router; 