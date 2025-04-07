import express from 'express';
import budgetController from '../controllers/budget.controller.js';

const router = express.Router();

// Update itinerary budget
router.put('/itineraries/:id', budgetController.updateBudget);

// Toggle splitwise mode
router.put('/itineraries/:id/splitwise', budgetController.toggleSplitwiseMode);

// Add expense
router.post('/itineraries/:id/expenses', budgetController.addExpense);

// Get expense breakdown
router.get('/itineraries/:id/breakdown', budgetController.getExpenseBreakdown);

// Settle expense
router.post('/itineraries/:id/settle', budgetController.settleExpense);

export default router; 