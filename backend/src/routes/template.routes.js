import express from 'express';
import templateController from '../controllers/template.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all available templates
router.get(
  '/',
  authenticate,
  templateController.getTemplates
);

// Get template details
router.get(
  '/:id',
  authenticate,
  templateController.getTemplateDetails
);

// Create itinerary from template
router.post(
  '/create',
  authenticate,
  templateController.createFromTemplate
);

export default router; 