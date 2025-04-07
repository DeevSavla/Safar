import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Day } from '../models/day.model.js';
import { User } from '../models/user.model.js';
import { Itinerary } from '../models/itinerary.model.js';

/**
 * WebSocketService - Handles realtime communication for the application
 */
class WebSocketService {
  constructor() {
    this.io = null;
    this.connections = new Map(); // Map of user IDs to socket IDs
  }

  /**
   * Initialize the WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Middleware for authentication
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;

        // Get user info
        const user = await User.findById(decoded.id);
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = {
          id: user._id,
          name: user.name,
          email: user.email
        };

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Connection event
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);
      this.connections.set(socket.userId, socket.id);

      // Join itinerary room
      socket.on('join-itinerary', (itineraryId) => {
        socket.join(`itinerary-${itineraryId}`);
        console.log(`User ${socket.userId} joined itinerary ${itineraryId}`);
      });

      // Join day room
      socket.on('join-day', (dayId) => {
        socket.join(`day-${dayId}`);
        console.log(`User ${socket.userId} joined day ${dayId}`);
      });

      // Add comment to day
      socket.on('add-comment', async (data) => {
        try {
          const { dayId, text } = data;
          if (!dayId || !text) {
            socket.emit('error', { message: 'Invalid data' });
            return;
          }

          // Find day
          const day = await Day.findById(dayId).populate({
            path: 'itinerary',
            select: 'owner collaborators'
          });

          if (!day) {
            socket.emit('error', { message: 'Day not found' });
            return;
          }

          // Check if user has access to this day
          const isOwner = day.itinerary.owner.toString() === socket.userId;
          const isCollaborator = day.itinerary.collaborators.some(
            c => c.user && c.user.toString() === socket.userId
          );

          if (!isOwner && !isCollaborator) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Add comment
          const comment = {
            user: socket.userId,
            text,
            createdAt: new Date()
          };

          day.comments.push(comment);
          await day.save();

          // Get the populated comment with user info
          const populatedDay = await Day.findById(dayId).populate({
            path: 'comments.user',
            select: 'name email'
          });

          const newComment = populatedDay.comments[populatedDay.comments.length - 1];

          // Broadcast to all users in the day room
          this.io.to(`day-${dayId}`).emit('new-comment', {
            dayId,
            comment: {
              id: newComment._id,
              text: newComment.text,
              createdAt: newComment.createdAt,
              user: {
                id: newComment.user._id,
                name: newComment.user.name,
                email: newComment.user.email
              }
            }
          });

        } catch (error) {
          console.error('Error adding comment:', error);
          socket.emit('error', { message: 'Failed to add comment' });
        }
      });

      // Disconnect event
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        this.connections.delete(socket.userId);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Send a notification to specific users
   * @param {Array} userIds - User IDs to send notification to
   * @param {Object} notification - Notification data
   */
  sendNotification(userIds, notification) {
    userIds.forEach(userId => {
      const socketId = this.connections.get(userId);
      if (socketId) {
        this.io.to(socketId).emit('notification', notification);
      }
    });
  }

  /**
   * Send a message to all users in an itinerary
   * @param {String} itineraryId - Itinerary ID
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  emitToItinerary(itineraryId, event, data) {
    this.io.to(`itinerary-${itineraryId}`).emit(event, data);
  }

  /**
   * Send a message to all users in a day
   * @param {String} dayId - Day ID
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  emitToDay(dayId, event, data) {
    this.io.to(`day-${dayId}`).emit(event, data);
  }
}

export default new WebSocketService(); 