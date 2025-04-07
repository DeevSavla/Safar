import { Itinerary } from '../models/itinerary.model.js';
import { ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../middleware/apiResponse.js';
import mongoose from 'mongoose';
import websocketService from '../services/websocket.service.js';

/**
 * BudgetController - Handles budget-related operations
 */
class BudgetController {
  /**
   * Update itinerary budget
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async updateBudget(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const { total, currency } = req.body;
      
      if (!total || !currency) {
        throw ApiError.badRequest('Total budget and currency are required');
      }
      
      // Find itinerary with populated collaborator details
      const itinerary = await Itinerary.findById(itineraryId)
        .populate('collaborators.user', 'name email')
        .lean();
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Print debugging information
      console.log('Update Budget - Authentication Check:');
      console.log('User ID from token:', userId, 'type:', typeof userId);
      console.log('Itinerary owner ID:', itinerary.owner, 'type:', typeof itinerary.owner);
      console.log('String comparison:', String(itinerary.owner) === String(userId));
      console.log('Collaborators:', itinerary.collaborators.map(c => ({
        id: c.user._id,
        idString: String(c.user._id),
        role: c.role
      })));
      
      // Check if user is owner or editor collaborator
      const isOwner = String(itinerary.owner) === String(userId);
      const isEditorCollaborator = itinerary.collaborators.some(
        c => {
          const collaboratorId = c.user._id ? String(c.user._id) : null;
          return collaboratorId === String(userId) && c.role === 'editor';
        }
      );
      
      if (!isOwner && !isEditorCollaborator) {
        throw ApiError.forbidden('Access denied - User must be the owner or an editor collaborator');
      }
      
      // Update budget using findByIdAndUpdate for better reliability
      const updatedItinerary = await Itinerary.findByIdAndUpdate(
        itineraryId,
        { 
          'budget.total': parseFloat(total),
          'budget.currency': currency
        },
        { new: true, runValidators: true }
      );
      
      // Calculate per person budget
      updatedItinerary.calculatePerPersonBudget();
      await updatedItinerary.save();
      
      // Notify all connected clients about the budget update
      websocketService.emitToItinerary(itineraryId, 'budget-update', {
        budget: updatedItinerary.budget,
        itineraryId
      });
      
      ApiResponse.success(res, 200, 'Budget updated successfully', {
        budget: updatedItinerary.budget
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Toggle splitwise mode for an itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async toggleSplitwiseMode(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const { isEnabled } = req.body;
      
      if (isEnabled === undefined) {
        throw ApiError.badRequest('isEnabled is required');
      }
      
      // Find itinerary with populated collaborator details - using lean() to get plain objects
      const itinerary = await Itinerary.findById(itineraryId)
        .populate('collaborators.user', 'name email')
        .lean();
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Print debugging information
      console.log('Toggle Splitwise - Authentication Check:');
      console.log('User ID from token:', userId, 'type:', typeof userId);
      console.log('Itinerary owner ID:', itinerary.owner, 'type:', typeof itinerary.owner);
      console.log('String comparison:', String(itinerary.owner) === String(userId));
      console.log('Collaborators:', itinerary.collaborators.map(c => ({
        id: c.user._id,
        idString: String(c.user._id),
        role: c.role
      })));
      
      // Check if user is owner or editor collaborator
      const isOwner = String(itinerary.owner) === String(userId);
      const isEditorCollaborator = itinerary.collaborators.some(
        c => {
          const collaboratorId = c.user._id ? String(c.user._id) : null;
          return collaboratorId === String(userId) && c.role === 'editor';
        }
      );
      
      if (!isOwner && !isEditorCollaborator) {
        throw ApiError.forbidden('Access denied - User must be the owner or an editor collaborator');
      }
      
      // Update splitwise mode
      const updatedItinerary = await Itinerary.findByIdAndUpdate(
        itineraryId,
        { 'budget.isSplitwiseEnabled': isEnabled },
        { new: true, runValidators: true }
      );
      
      // Recalculate the per-person budget
      updatedItinerary.calculatePerPersonBudget();
      await updatedItinerary.save();
      
      // Notify all connected clients about the update
      websocketService.emitToItinerary(itineraryId, 'budget-update', {
        budget: updatedItinerary.budget,
        itineraryId
      });
      
      ApiResponse.success(res, 200, `Splitwise mode ${isEnabled ? 'enabled' : 'disabled'} successfully`, {
        budget: updatedItinerary.budget
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add expense to itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async addExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const { title, amount, category, notes, memberIds } = req.body;
      
      if (!title || !amount) {
        throw ApiError.badRequest('Title and amount are required');
      }
      
      // Find itinerary with populated collaborators and convert to plain object
      const itinerary = await Itinerary.findById(itineraryId)
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email')
        .lean();
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Print debugging information
      console.log('Add Expense - Authentication Check:');
      console.log('User ID from token:', userId, 'type:', typeof userId);
      console.log('Itinerary owner ID:', itinerary.owner._id, 'type:', typeof itinerary.owner._id);
      
      // Check if user is a member of the itinerary
      const isOwner = String(itinerary.owner._id) === String(userId);
      const isCollaborator = itinerary.collaborators.some(
        c => String(c.user._id) === String(userId)
      );
      
      console.log('Is owner:', isOwner);
      console.log('Is collaborator:', isCollaborator);
      
      if (!isOwner && !isCollaborator) {
        throw ApiError.forbidden('Access denied - User must be a member of the itinerary');
      }
      
      // Prepare members array
      let members = [];
      
      // If memberIds is provided, use only those members
      if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
        // Validate that all members are part of the itinerary
        for (const memberId of memberIds) {
          if (String(itinerary.owner._id) === String(memberId) || 
              itinerary.collaborators.some(c => String(c.user._id) === String(memberId))) {
            members.push({
              user: memberId,
              amount: amount / memberIds.length,
              paid: String(memberId) === String(userId) // Mark as paid if the current user paid for it
            });
          }
        }
      } else {
        // Otherwise, split among all members
        // Add owner
        members.push({
          user: itinerary.owner._id,
          amount: amount / (1 + itinerary.collaborators.length),
          paid: String(itinerary.owner._id) === String(userId)
        });
        
        // Add collaborators
        for (const collaborator of itinerary.collaborators) {
          members.push({
            user: collaborator.user._id,
            amount: amount / (1 + itinerary.collaborators.length),
            paid: String(collaborator.user._id) === String(userId)
          });
        }
      }
      
      // Create expense
      const expense = {
        title,
        amount: parseFloat(amount),
        paidBy: userId,
        category: category || 'other',
        notes: notes || '',
        members,
        date: new Date()
      };
      
      // Add expense to itinerary using findByIdAndUpdate for better reliability
      const updatedItinerary = await Itinerary.findByIdAndUpdate(
        itineraryId,
        { 
          $push: { 'budget.expenses': expense },
          $inc: { 'budget.spent': parseFloat(amount) }
        },
        { new: true, runValidators: true }
      );
      
      // Update categories
      const categoryKey = category || 'other';
      const currentCategoryAmount = updatedItinerary.budget.categories.get(categoryKey) || 0;
      updatedItinerary.budget.categories.set(categoryKey, currentCategoryAmount + parseFloat(amount));
      await updatedItinerary.save();
      
      // Get the added expense with populated user info
      const fullUpdatedItinerary = await Itinerary.findById(itineraryId)
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email')
        .populate('budget.expenses.paidBy', 'name email')
        .populate('budget.expenses.members.user', 'name email');
      
      const addedExpense = fullUpdatedItinerary.budget.expenses[fullUpdatedItinerary.budget.expenses.length - 1];
      
      // Notify all users in the itinerary
      websocketService.emitToItinerary(itineraryId, 'new-expense', {
        expense: addedExpense
      });
      
      ApiResponse.success(res, 201, 'Expense added successfully', {
        expense: addedExpense
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get expense breakdown for an itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getExpenseBreakdown(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      
      // Find itinerary with populated data
      const itinerary = await Itinerary.findById(itineraryId)
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email')
        .populate('budget.expenses.paidBy', 'name email')
        .populate('budget.expenses.members.user', 'name email');
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Print debugging information
      console.log('Get Expense Breakdown - Authentication Check:');
      console.log('User ID from token:', userId, 'type:', typeof userId);
      console.log('Itinerary owner ID:', itinerary.owner._id, 'type:', typeof itinerary.owner._id);
      
      // Check if user is a member of the itinerary
      const isOwner = String(itinerary.owner._id) === String(userId);
      const isCollaborator = itinerary.collaborators.some(
        c => String(c.user._id) === String(userId)
      );
      
      console.log('Is owner:', isOwner);
      console.log('Is collaborator:', isCollaborator);
      
      if (!isOwner && !isCollaborator) {
        throw ApiError.forbidden('Access denied - User must be a member of the itinerary');
      }
      
      // Calculate balances
      const balances = {};
      const members = [
        { id: String(itinerary.owner._id), name: itinerary.owner.name || itinerary.owner.email },
        ...itinerary.collaborators.map(c => ({ 
          id: String(c.user._id), 
          name: c.user.name || c.user.email 
        }))
      ];
      
      // Initialize balances
      members.forEach(member => {
        balances[member.id] = { 
          id: member.id,
          name: member.name,
          paid: 0,
          owes: 0,
          owed: 0,
          net: 0,
          details: {}
        };
        
        // Initialize details for each member
        members.forEach(otherMember => {
          if (member.id !== otherMember.id) {
            balances[member.id].details[otherMember.id] = {
              id: otherMember.id,
              name: otherMember.name,
              amount: 0
            };
          }
        });
      });
      
      // Process each expense
      itinerary.budget.expenses.forEach(expense => {
        const paidById = String(expense.paidBy._id);
        balances[paidById].paid += expense.amount;
        
        // Process each member's share
        expense.members.forEach(member => {
          const memberId = String(member.user._id);
          
          if (!member.paid) {
            // This member owes money to the payer
            balances[memberId].owes += member.amount;
            balances[paidById].owed += member.amount;
            
            // Update the details
            if (memberId !== paidById) {
              balances[memberId].details[paidById].amount -= member.amount;
              balances[paidById].details[memberId].amount += member.amount;
            }
          }
        });
      });
      
      // Calculate net balance for each member
      members.forEach(member => {
        balances[member.id].net = balances[member.id].owed - balances[member.id].owes;
      });
      
      // Get category breakdown
      const categoryBreakdown = {};
      for (const [category, amount] of itinerary.budget.categories.entries()) {
        categoryBreakdown[category] = amount;
      }
      
      ApiResponse.success(res, 200, 'Expense breakdown retrieved successfully', {
        budget: {
          total: itinerary.budget.total,
          perPerson: itinerary.budget.perPerson,
          spent: itinerary.budget.spent,
          currency: itinerary.budget.currency,
          remaining: itinerary.budget.total - itinerary.budget.spent
        },
        members,
        balances: Object.values(balances),
        categoryBreakdown
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Settle expense between users
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async settleExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const { memberId, amount } = req.body;
      
      if (!memberId || !amount) {
        throw ApiError.badRequest('Member ID and amount are required');
      }
      
      // Find itinerary with populated collaborator details
      const itinerary = await Itinerary.findById(itineraryId)
        .populate('collaborators.user', 'name email')
        .lean();
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Check if user is a member of the itinerary
      const isOwner = String(itinerary.owner) === String(userId);
      const isCollaborator = itinerary.collaborators.some(
        c => {
          const collaboratorId = c.user._id ? String(c.user._id) : null;
          return collaboratorId === String(userId);
        }
      );
      
      if (!isOwner && !isCollaborator) {
        throw ApiError.forbidden('Access denied');
      }
      
      // Check if the other user is a member of the itinerary
      const isOtherOwner = String(itinerary.owner) === String(memberId);
      const isOtherCollaborator = itinerary.collaborators.some(
        c => {
          const collaboratorId = c.user._id ? String(c.user._id) : null;
          return collaboratorId === String(memberId);
        }
      );
      
      if (!isOtherOwner && !isOtherCollaborator) {
        throw ApiError.badRequest('Invalid member ID');
      }
      
      // Create a settlement expense
      const settlement = {
        title: 'Settlement',
        amount: parseFloat(amount),
        paidBy: userId,
        category: 'settlement',
        notes: `Settlement between users`,
        members: [
          {
            user: memberId,
            amount: parseFloat(amount),
            paid: true // Mark as paid since this is a settlement
          }
        ],
        date: new Date()
      };
      
      // Add settlement to expenses using findByIdAndUpdate for better reliability
      const updatedItinerary = await Itinerary.findByIdAndUpdate(
        itineraryId,
        { $push: { 'budget.expenses': settlement } },
        { new: true, runValidators: true }
      );
      
      // Get updated itinerary with populated data for response
      const fullUpdatedItinerary = await Itinerary.findById(itineraryId)
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email')
        .populate('budget.expenses.paidBy', 'name email')
        .populate('budget.expenses.members.user', 'name email');
      
      // Notify all users in the itinerary
      websocketService.emitToItinerary(itineraryId, 'settlement', {
        from: userId,
        to: memberId,
        amount: parseFloat(amount)
      });
      
      ApiResponse.success(res, 200, 'Expense settled successfully', {
        settlement
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BudgetController(); 