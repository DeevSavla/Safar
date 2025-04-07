import Joi from 'joi';

// Define common schemas
const dateRangeSchema = Joi.object({
  start: Joi.date().required(),
  end: Joi.date().required().min(Joi.ref('start'))
});

const locationSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  }),
  placeId: Joi.string(),
  types: Joi.array().items(Joi.string())
});

const budgetSchema = Joi.object({
  currency: Joi.string().default('USD'),
  total: Joi.number().min(0),
  spent: Joi.number().min(0)
});

const transportationSchema = Joi.object({
  mode: Joi.string().valid('flight', 'train', 'car', 'bus', 'walking', 'mixed').default('mixed'),
  details: Joi.string()
});

const timeRangeSchema = Joi.object({
  start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

const costSchema = Joi.object({
  amount: Joi.number().min(0),
  currency: Joi.string().default('USD')
});

const reservationInfoSchema = Joi.object({
  confirmationNumber: Joi.string(),
  provider: Joi.string(),
  notes: Joi.string()
});

// Itinerary validation schemas
const createItinerarySchema = Joi.object({
  title: Joi.string().required().max(100),
  description: Joi.string().max(1000),
  destination: locationSchema.required(),
  dateRange: dateRangeSchema.required(),
  budget: budgetSchema,
  transportation: transportationSchema,
  generateDays: Joi.boolean().default(true),
  source: Joi.string().max(200),
  sourceLocation: Joi.string().max(100).default('Borivali'),
  numberOfPeople: Joi.number().integer().min(1).default(1)
});

const updateItinerarySchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(1000),
  destination: locationSchema,
  dateRange: dateRangeSchema,
  budget: budgetSchema,
  transportation: transportationSchema
});

// Day validation schemas
const updateDaySchema = Joi.object({
  date: Joi.date(),
  notes: Joi.string().max(1000),
  weatherInfo: Joi.object({
    temperature: Joi.number(),
    conditions: Joi.string(),
    icon: Joi.string()
  }),
  completed: Joi.boolean()
});

// Activity validation schemas
const createActivitySchema = Joi.object({
  title: Joi.string().required().max(100),
  description: Joi.string().max(1000),
  type: Joi.string().required().valid(
    'transportation', 'accommodation', 'attraction', 
    'food', 'event', 'shopping', 'other'
  ),
  location: locationSchema,
  timeRange: timeRangeSchema,
  cost: costSchema,
  reservationInfo: reservationInfoSchema,
  completed: Joi.boolean().default(false)
});

const updateActivitySchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(1000),
  type: Joi.string().valid(
    'transportation', 'accommodation', 'attraction', 
    'food', 'event', 'shopping', 'other'
  ),
  location: locationSchema,
  timeRange: timeRangeSchema,
  cost: costSchema,
  reservationInfo: reservationInfoSchema,
  completed: Joi.boolean()
});

// Collaborator validation schemas
const addCollaboratorSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('editor', 'viewer').required()
});

// Reorder activities validation schema
const reorderActivitiesSchema = Joi.object({
  activityIds: Joi.array().items(Joi.string()).required()
});

export default {
  createItinerary: createItinerarySchema,
  updateItinerary: updateItinerarySchema,
  updateDay: updateDaySchema,
  createActivity: createActivitySchema,
  updateActivity: updateActivitySchema,
  addCollaborator: addCollaboratorSchema,
  reorderActivities: reorderActivitiesSchema
}; 