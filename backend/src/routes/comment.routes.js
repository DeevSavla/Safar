import express from 'express';
import commentController from '../controllers/comment.controller.js';

const router = express.Router();

// Add comment to day
router.post('/days/:dayId', commentController.addComment);

// Get comments for day
router.get('/days/:dayId', commentController.getComments);

// Delete comment
router.delete('/days/:dayId/comments/:commentId', commentController.deleteComment);

export default router; 