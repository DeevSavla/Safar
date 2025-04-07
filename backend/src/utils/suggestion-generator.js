/**
 * Utility for generating itinerary suggestions when AI service is unavailable
 */

/**
 * Generate suggestions based on destination type and activities
 * @param {Object} itinerary - The itinerary object
 * @returns {Object} Generated suggestions
 */
export const generateBasicSuggestions = (itinerary) => {
  if (!itinerary) return {};
  
  const destination = itinerary.destination?.name || '';
  const destinationCountry = itinerary.destination?.country || '';
  const duration = calculateDuration(itinerary);
  
  // Extract activity categories from existing activities
  const activityTypes = extractActivityTypes(itinerary);
  
  // Generate suggestions based on destination and activities
  const suggestions = {
    accommodations: generateAccommodationSuggestions(destination, duration, destinationCountry),
    restaurants: generateRestaurantSuggestions(destination, activityTypes, destinationCountry),
    activities: generateActivitySuggestions(destination, activityTypes, duration, destinationCountry),
    transportation: generateTransportationSuggestions(destination, duration, destinationCountry),
  };
  
  return suggestions;
};

/**
 * Calculate duration of itinerary in days
 * @param {Object} itinerary - The itinerary object
 * @returns {number} Duration in days
 */
const calculateDuration = (itinerary) => {
  if (!itinerary.dateRange?.start || !itinerary.dateRange?.end) {
    return itinerary.days?.length || 3; // Default to 3 days if no date range
  }
  
  const startDate = new Date(itinerary.dateRange.start);
  const endDate = new Date(itinerary.dateRange.end);
  const durationInMs = endDate - startDate;
  const days = Math.ceil(durationInMs / (1000 * 60 * 60 * 24)) + 1;
  
  return days;
};

/**
 * Extract activity types from existing activities
 * @param {Object} itinerary - The itinerary object
 * @returns {Array} Unique activity types
 */
const extractActivityTypes = (itinerary) => {
  const types = new Set();
  
  if (itinerary.days && Array.isArray(itinerary.days)) {
    itinerary.days.forEach(day => {
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach(activity => {
          if (activity.type) {
            types.add(activity.type.toLowerCase());
          }
          
          // Extract keywords from title
          const title = activity.title || '';
          if (title.toLowerCase().includes('museum')) types.add('cultural');
          if (title.toLowerCase().includes('tour')) types.add('tour');
          if (title.toLowerCase().includes('park')) types.add('outdoor');
          if (title.toLowerCase().includes('restaurant') || title.toLowerCase().includes('dinner') || title.toLowerCase().includes('lunch')) types.add('food');
          if (title.toLowerCase().includes('shopping')) types.add('shopping');
        });
      }
    });
  }
  
  return Array.from(types);
};

/**
 * Generate accommodation suggestions
 * @param {string} destination - Destination name
 * @param {number} duration - Trip duration
 * @param {string} country - Destination country
 * @returns {Object} Accommodation suggestions
 */
const generateAccommodationSuggestions = (destination, duration, country) => {
  const isLongTrip = duration > 7;
  
  // Default suggestions
  const suggestions = {
    'luxury': [
      {
        name: `${destination} Grand Hotel`,
        area: 'City Center',
        price_range: '$$$',
        amenities: ['Swimming Pool', 'Spa', 'Free Wifi', 'Restaurant']
      },
      {
        name: `${destination} Luxury Resort`,
        area: 'Beachfront',
        price_range: '$$$$',
        amenities: ['Beach Access', 'Spa', 'Multiple Restaurants', 'Concierge']
      }
    ],
    'mid-range': [
      {
        name: `${destination} Comfort Inn`,
        area: 'Downtown',
        price_range: '$$',
        amenities: ['Free Breakfast', 'Wifi', 'Fitness Center']
      },
      {
        name: `${destination} Plaza Hotel`,
        area: 'City Center',
        price_range: '$$',
        amenities: ['Restaurant', 'Wifi', 'Business Center']
      }
    ],
    'budget': [
      {
        name: `${destination} Backpackers Hostel`,
        area: 'Tourist District',
        price_range: '$',
        amenities: ['Shared Kitchen', 'Free Wifi', 'Laundry Facilities']
      }
    ]
  };
  
  // For longer trips, add apartment rental options
  if (isLongTrip) {
    suggestions['apartment rentals'] = [
      {
        name: `${destination} Vacation Apartments`,
        area: 'Residential District',
        price_range: '$$',
        amenities: ['Full Kitchen', 'Washer/Dryer', 'Long-term Discounts']
      }
    ];
  }
  
  return suggestions;
};

/**
 * Generate restaurant suggestions
 * @param {string} destination - Destination name
 * @param {Array} activityTypes - Activity types
 * @param {string} country - Destination country
 * @returns {Object} Restaurant suggestions
 */
const generateRestaurantSuggestions = (destination, activityTypes, country) => {
  const hasFoodInterest = activityTypes.includes('food');
  
  // Default cuisine types
  const suggestions = {
    'local': [
      {
        name: `Authentic ${destination} Kitchen`,
        price_range: '$$',
        speciality: 'Local Specialties'
      },
      {
        name: `Traditional ${country} Restaurant`,
        price_range: '$$',
        speciality: 'Regional Cuisine'
      }
    ],
    'international': [
      {
        name: 'Global Fusion Restaurant',
        price_range: '$$$',
        speciality: 'Fusion Cuisine'
      }
    ],
    'casual': [
      {
        name: `${destination} Bistro`,
        price_range: '$$',
        speciality: 'Casual Dining'
      }
    ]
  };
  
  // Add more food options for foodies
  if (hasFoodInterest) {
    suggestions['fine dining'] = [
      {
        name: `${destination} Gourmet Experience`,
        price_range: '$$$$',
        speciality: 'Tasting Menu'
      }
    ];
    suggestions['food tours'] = [
      {
        name: `${destination} Food Walking Tour`,
        price_range: '$$',
        speciality: 'Local Specialties Sampling'
      }
    ];
  }
  
  return suggestions;
};

/**
 * Generate activity suggestions
 * @param {string} destination - Destination name
 * @param {Array} activityTypes - Activity types
 * @param {number} duration - Trip duration
 * @param {string} country - Destination country
 * @returns {Array} Activity suggestions
 */
const generateActivitySuggestions = (destination, activityTypes, duration, country) => {
  const suggestions = [];
  
  // Basic sightseeing activities
  suggestions.push({
    name: `${destination} City Tour`,
    description: `Explore the highlights of ${destination} with a guided tour`
  });
  
  suggestions.push({
    name: `${destination} Historical Walking Tour`,
    description: `Discover the rich history of ${destination} on foot`
  });
  
  // Add cultural activities
  if (activityTypes.includes('cultural') || duration > 3) {
    suggestions.push({
      name: `${destination} National Museum`,
      description: `Learn about the history and culture of ${country}`
    });
    
    suggestions.push({
      name: `${destination} Art Gallery`,
      description: 'Explore local and international art exhibits'
    });
  }
  
  // Add outdoor activities
  if (activityTypes.includes('outdoor') || duration > 5) {
    suggestions.push({
      name: `${destination} Nature Reserve`,
      description: 'Experience the natural beauty of the region'
    });
    
    suggestions.push({
      name: 'Scenic Hiking Trail',
      description: 'Enjoy breathtaking views on a guided hiking experience'
    });
  }
  
  // Add shopping activities
  if (activityTypes.includes('shopping')) {
    suggestions.push({
      name: `${destination} Local Market`,
      description: 'Shop for local crafts, foods, and souvenirs'
    });
    
    suggestions.push({
      name: `${destination} Shopping District`,
      description: 'Explore shops ranging from local boutiques to international brands'
    });
  }
  
  return suggestions;
};

/**
 * Generate transportation suggestions
 * @param {string} destination - Destination name
 * @param {number} duration - Trip duration
 * @param {string} country - Destination country
 * @returns {Array} Transportation suggestions
 */
const generateTransportationSuggestions = (destination, duration, country) => {
  const suggestions = [];
  
  // Basic transportation options
  suggestions.push({
    mode: 'Public Transportation',
    description: `${destination}'s public transit system includes buses and trains that connect major attractions`,
    cost: '$'
  });
  
  suggestions.push({
    mode: 'Taxi/Rideshare',
    description: 'Convenient for direct trips between locations',
    cost: '$$'
  });
  
  // Add car rental for longer trips
  if (duration > 3) {
    suggestions.push({
      mode: 'Car Rental',
      description: 'Provides flexibility for exploring areas outside the city center',
      cost: '$$$'
    });
  }
  
  // Add guided tours for convenience
  suggestions.push({
    mode: 'Guided Tour Transportation',
    description: 'Many guided tours include transportation between attractions',
    cost: '$$'
  });
  
  return suggestions;
}; 