import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import itineraryRoutes from './itinerary.routes.js';
import placeRoutes from './place.routes.js';
import budgetRoutes from './budget.routes.js';
import commentRoutes from './comment.routes.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/itineraries', itineraryRoutes);
router.use('/places', placeRoutes);
router.use('/budget', authenticate, budgetRoutes);
router.use('/comments', authenticate, commentRoutes);

// Version check endpoint
router.get('/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    apiStatus: 'operational'
  });
});

export default router; 