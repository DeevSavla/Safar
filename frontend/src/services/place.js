import api from './api'

// Mock data for development environment when API is unavailable
const MOCK_PLACES = [
  {
    id: 'place-1',
    name: 'Eiffel Tower',
    address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    category: 'Landmark',
    description: 'Iconic iron tower built in 1889 that defines the Paris skyline.',
    images: ['https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800&auto=format&fit=crop'],
    priceLevel: 3,
    openingHours: '9:00 AM - 11:45 PM',
    phone: '+33 892 70 12 39',
    website: 'https://www.toureiffel.paris/en'
  },
  {
    id: 'place-2',
    name: 'Louvre Museum',
    address: 'Rue de Rivoli, 75001 Paris, France',
    category: 'Museum',
    description: 'The world\'s largest art museum and a historic monument in Paris.',
    images: ['https://images.unsplash.com/photo-1565099824688-ab1a6a783c04?w=800&auto=format&fit=crop'],
    priceLevel: 2,
    openingHours: '9:00 AM - 6:00 PM, Closed on Tuesdays',
    phone: '+33 1 40 20 50 50',
    website: 'https://www.louvre.fr/en'
  },
  {
    id: 'place-3',
    name: 'Colosseum',
    address: 'Piazza del Colosseo, 00184 Roma RM, Italy',
    category: 'Historic Site',
    description: 'Iconic oval amphitheatre in the centre of Rome, Italy.',
    images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop'],
    priceLevel: 3,
    openingHours: '8:30 AM - 7:00 PM',
    phone: '+39 06 3996 7700',
    website: 'https://www.colosseo.it/en/'
  },
  {
    id: 'place-4',
    name: 'Central Park',
    address: 'New York, NY, USA',
    category: 'Park',
    description: 'Urban park in New York City between the Upper West and Upper East Sides of Manhattan.',
    images: ['https://images.unsplash.com/photo-1534251369789-5067c8b8602a?w=800&auto=format&fit=crop'],
    priceLevel: 1,
    openingHours: '6:00 AM - 1:00 AM',
    phone: '+1 212-310-6600',
    website: 'https://www.centralparknyc.org/'
  }
];

// Check if we should use mock data (this is set in the itinerary service)
let useMockData = false;

// We'll check if we're in development mode
if (import.meta.env.DEV) {
  // Listen for errors to determine if we should use mock data
  window.addEventListener('api:offline', () => {
    console.info('Switching place service to mock data mode');
    useMockData = true;
  });
  
  // Check if the itinerary service has already detected offline mode
  if (window.itineraryServiceOffline) {
    useMockData = true;
  }
}

function searchPlaces(query) {
  // If using mock data, filter the mock places
  if (useMockData) {
    const filteredPlaces = MOCK_PLACES.filter(place => {
      const searchTerm = query.toLowerCase();
      return (
        place.name.toLowerCase().includes(searchTerm) ||
        place.address.toLowerCase().includes(searchTerm) ||
        (place.category && place.category.toLowerCase().includes(searchTerm))
      );
    });
    
    return Promise.resolve(filteredPlaces);
  }

  return api.get(`/places/search?query=${encodeURIComponent(query)}`)
    .then(response => response.data)
    .catch(err => {
      console.error('Error searching places:', err);
      
      // If we get a network error in development, use mock data
      if (import.meta.env.DEV && err.code === 'ERR_NETWORK') {
        useMockData = true;
        window.itineraryServiceOffline = true;
        window.dispatchEvent(new Event('api:offline'));
        
        // Filter mock places
        const filteredPlaces = MOCK_PLACES.filter(place => {
          const searchTerm = query.toLowerCase();
          return (
            place.name.toLowerCase().includes(searchTerm) ||
            place.address.toLowerCase().includes(searchTerm) ||
            (place.category && place.category.toLowerCase().includes(searchTerm))
          );
        });
        
        return filteredPlaces;
      }
      
      return [];
    });
}

function getPlaceById(id) {
  // If using mock data, find the place by id
  if (useMockData) {
    const place = MOCK_PLACES.find(p => p.id === id);
    return Promise.resolve(place || null);
  }

  return api.get(`/places/${id}`)
    .then(response => response.data)
    .catch(err => {
      console.error(`Error fetching place ${id}:`, err);
      
      // If we get a network error in development, use mock data
      if (import.meta.env.DEV && err.code === 'ERR_NETWORK') {
        useMockData = true;
        window.itineraryServiceOffline = true;
        window.dispatchEvent(new Event('api:offline'));
        
        const place = MOCK_PLACES.find(p => p.id === id);
        return place || null;
      }
      
      throw err;
    });
}

export {
  searchPlaces,
  getPlaceById
} 