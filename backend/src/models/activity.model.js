import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number] // [longitude, latitude]
  }
});

const activitySchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      unique: true
    },
    title: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['attraction', 'food', 'transport', 'accommodation', 'other']
    },
    day: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Day'
    },
    location: {
      name: {
        type: String
      },
      coordinates: {
        type: pointSchema
      },
      address: {
        type: String,
        trim: true
      },
      placeId: {
        type: String,
        trim: true
      }
    },
    timeRange: {
      start: {
        type: Date
      },
      end: {
        type: Date
      }
    },
    cost: {
      amount: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    notes: {
      type: String,
      trim: true
    },
    reservationInfo: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for efficient queries
activitySchema.index({ day: 1 });
// activitySchema.index({ uuid: 1 }); // Removed to avoid duplicate index with the unique property
activitySchema.index({ 'location.coordinates': '2dsphere' });

// Method to get the public ID (UUID)
activitySchema.methods.getPublicId = function() {
  return this.uuid;
};

// Remove pre-save validation hook
// No validation for time range

export const Activity = mongoose.model('Activity', activitySchema);
 