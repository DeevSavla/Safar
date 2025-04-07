import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Search, GripVertical, Map, Clock, Route } from 'lucide-react';

const libraries = ['places', 'directions'];

function ItineraryMap({ locations, setLocations }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const directionsServiceRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && searchInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ['geocode', 'establishment'],
          fields: ['place_id', 'geometry', 'name', 'formatted_address']
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
          const newLocation = {
            name: place.name,
            description: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id,
          };
          setLocations(prevLocations => [...prevLocations, newLocation]);
          searchInputRef.current.value = '';
        }
      });
    }
  }, [isLoaded, setLocations]);

  useEffect(() => {
    if (locations.length >= 2 && map) {
      calculateRoute();
    } else {
      setDirections(null);
      setTotalDistance(0);
      setTotalDuration(0);
    }
  }, [locations, map]);

  const calculateRoute = () => {
    if (!map || !directionsServiceRef.current) return;

    const waypoints = locations.slice(1, -1).map(location => ({
      location: { lat: location.lat, lng: location.lng },
      stopover: true
    }));

    const request = {
      origin: { lat: locations[0].lat, lng: locations[0].lng },
      destination: { lat: locations[locations.length - 1].lat, lng: locations[locations.length - 1].lng },
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        setDirections(result);
        
        // Calculate total distance and duration
        let totalDist = 0;
        let totalDur = 0;
        result.routes[0].legs.forEach(leg => {
          totalDist += leg.distance.value;
          totalDur += leg.duration.value;
        });
        setTotalDistance(totalDist / 1000); // Convert to kilometers
        setTotalDuration(totalDur / 60); // Convert to minutes
      }
    });
  };

  const onMapLoad = React.useCallback((map) => {
    setMap(map);
    directionsServiceRef.current = new google.maps.DirectionsService();
  }, []);

  const handleLocationRemove = (locationToRemove) => {
    setLocations(prevLocations => prevLocations.filter(loc => loc.placeId !== locationToRemove.placeId));
  };

  const handleViewOnGoogleMaps = () => {
    if (locations.length < 2) return;
    
    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const origin = `&origin=${locations[0].lat},${locations[0].lng}`;
    const destination = `&destination=${locations[locations.length - 1].lat},${locations[locations.length - 1].lng}`;
    
    const waypoints = locations.slice(1, -1).map(loc => `${loc.lat},${loc.lng}`).join('|');
    const waypointsParam = waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '';
    
    const url = `${baseUrl}${origin}${destination}${waypointsParam}`;
    window.open(url, '_blank');
  };

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(locations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocations(items);
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  const defaultCenter = locations.length > 0 
    ? { lat: locations[0].lat, lng: locations[0].lng }
    : { lat: 0, lng: 0 };

  const carIcon = {
    url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
    scaledSize: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 20)
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="w-full h-[500px] rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          zoom={locations.length > 0 ? 12 : 2}
          center={defaultCenter}
          onLoad={onMapLoad}
        >
          {locations.map((location, index) => (
            <Marker
              key={index}
              position={{ lat: location.lat, lng: location.lng }}
              onClick={() => handleMarkerClick(location)}
              icon={index === 0 ? carIcon : undefined}
              label={index === 0 ? undefined : {
                text: (index + 1).toString(),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          ))}

          {directions && <DirectionsRenderer directions={directions} />}

          {selectedLocation && (
            <InfoWindow
              position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
              onCloseClick={() => setSelectedLocation(null)}
            >
              <div className="p-2">
                <h3 className="font-bold">{selectedLocation.name}</h3>
                <p className="text-sm text-gray-600">{selectedLocation.description}</p>
                <div className="mt-2 space-x-2">
                  <button
                    className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm hover:bg-gray-300"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedLocation.lat},${selectedLocation.lng}`, '_blank')}
                  >
                    View on Google Maps
                  </button>
                  <button
                    className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm hover:bg-red-200"
                    onClick={() => handleLocationRemove(selectedLocation)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Selected Locations</h2>
          {locations.length >= 2 && (
            <button
              onClick={handleViewOnGoogleMaps}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              <Map className="h-4 w-4" />
              View Full Route
            </button>
          )}
        </div>

        {directions && (
          <div className="flex gap-4 mb-4 p-2 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{totalDistance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{Math.round(totalDuration)} min</span>
            </div>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="locations">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {locations.map((location, index) => (
                  <Draggable
                    key={location.placeId}
                    draggableId={location.placeId}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium">{index + 1}. {location.name}</p>
                            <p className="text-sm text-gray-600">{location.description}</p>
                          </div>
                        </div>
                        <div className="space-x-2">
                          <button
                            className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm hover:bg-gray-300"
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`, '_blank')}
                          >
                            View
                          </button>
                          <button
                            className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm hover:bg-red-200"
                            onClick={() => handleLocationRemove(location)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {locations.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            No locations added yet. Search and add locations to see them here.
          </p>
        )}
      </div>
    </div>
  );
}

export default ItineraryMap;