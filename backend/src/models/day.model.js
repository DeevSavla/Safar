import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const daySchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      unique: true
    },
    date: {
      type: Date
    },
    itinerary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary'
    },
    activities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity'
    }],
    notes: {
      type: String,
      trim: true
    },
    comments: [commentSchema]
  },
  { timestamps: true }
);

// Index for efficient queries
daySchema.index({ itinerary: 1, date: 1 });

// Method to get the public ID (UUID)
daySchema.methods.getPublicId = function () {
  return this.uuid;
};

// Virtual for day number in the itinerary
daySchema.virtual('dayNumber').get(function () {
  if (this._dayNumber !== undefined) {
    return this._dayNumber;
  }
  return null;
});

daySchema.virtual('dayNumber').set(function (num) {
  this._dayNumber = num;
});

// Include virtuals when converting to JSON
daySchema.set('toJSON', { virtuals: true });
daySchema.set('toObject', { virtuals: true });

export const Day = mongoose.model('Day', daySchema);

 