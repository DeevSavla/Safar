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

const placeSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      unique: true
    },
    name: {
      type: String,
      trim: true
    },
    placeId: {
      type: String,
      trim: true,
      index: true
    },
    location: {
      type: pointSchema
    },
    address: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    types: [{
      type: String,
      trim: true
    }],
    photos: [{
      url: String,
      attribution: String
    }],
    rating: {
      type: Number
    },
    priceLevel: {
      type: Number
    },
    openingHours: {
      type: mongoose.Schema.Types.Mixed
    },
    country: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

// Index for efficient queries
placeSchema.index({ 'location': '2dsphere' });
placeSchema.index({ name: 'text', address: 'text' });
placeSchema.index({ types: 1 });

// Method to get the public ID (UUID)
placeSchema.methods.getPublicId = function() {
  return this.uuid;
};

export const Place = mongoose.model('Place', placeSchema); 