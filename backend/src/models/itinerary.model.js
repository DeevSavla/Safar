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

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  placeId: {
    type: String
  },
  location: {
    type: pointSchema
  }
});

const collaboratorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  role: {
    type: String,
    enum: ['editor', 'viewer'],
    default: 'viewer'
  }
});

const joinRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  }
});

const expenseMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    default: 0
  },
  paid: {
    type: Boolean,
    default: false
  }
});

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members: [expenseMemberSchema],
  category: {
    type: String,
    enum: ['accommodation', 'food', 'transport', 'attraction', 'other'],
    default: 'other'
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
});

const itinerarySchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    collaborators: [collaboratorSchema],
    joinRequests: [joinRequestSchema],
    isPrivate: {
      type: Boolean,
      default: false,
      description: 'Flag to indicate if the itinerary is private or public'
    },
    publiclyJoinable: {
      type: Boolean,
      default: true,
      description: 'Flag to indicate if users can request to join this itinerary'
    },
    source: {
      type: String,
      trim: true,
      description: 'Where the user heard about the service'
    },
    sourceLocation: {
      type: String,
      trim: true,
      default: 'Borivali',
      description: 'Starting location for the trip'
    },
    numberOfPeople: {
      type: Number,
      default: 1,
      min: 1,
      description: 'Number of people on the trip'
    },
    destination: {
      name: {
        type: String
      },
      location: {
        type: pointSchema
      },
      country: {
        type: String
      }
    },
    routeLocations: [locationSchema],
    dateRange: {
      start: {
        type: Date
      },
      end: {
        type: Date
      }
    },
    days: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Day'
    }],
    budget: {
      currency: {
        type: String,
        default: 'USD'
      },
      total: {
        type: Number,
        default: 0
      },
      perPerson: {
        type: Number,
        default: 0
      },
      spent: {
        type: Number,
        default: 0
      },
      categories: {
        type: Map,
        of: Number,
        default: {}
      },
      isSplitwiseEnabled: {
        type: Boolean,
        default: false
      },
      expenses: [expenseSchema]
    },
    transportation: {
      mode: {
        type: String,
        enum: ['flying', 'driving', 'transit', 'mixed'],
        default: 'mixed'
      },
      details: {
        type: mongoose.Schema.Types.Mixed
      }
    },
    version: {
      type: Number,
      default: 1
    },
    additionalSuggestions: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
itinerarySchema.index({ owner: 1 });
itinerarySchema.index({ 'destination.location': '2dsphere' });
itinerarySchema.index({ 'routeLocations.location': '2dsphere' });
itinerarySchema.index({ isPrivate: 1 }); // Index for querying public itineraries

// Method to get the public ID (UUID)
itinerarySchema.methods.getPublicId = function() {
  return this.uuid;
};

// Method to calculate per person budget
itinerarySchema.methods.calculatePerPersonBudget = function() {
  const totalMembers = 1 + (this.collaborators ? this.collaborators.length : 0);
  if (totalMembers > 0 && this.budget.total > 0) {
    this.budget.perPerson = this.budget.total / totalMembers;
  } else {
    this.budget.perPerson = 0;
  }
  return this.budget.perPerson;
};

export const Itinerary = mongoose.model('Itinerary', itinerarySchema);

