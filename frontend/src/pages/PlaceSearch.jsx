import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { searchPlaces, getPlaceById } from '../services/place'

function PlaceSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const initialQuery = queryParams.get('query') || ''
  const returnPath = queryParams.get('returnTo') || '/itineraries'
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isLoadingPlace, setIsLoadingPlace] = useState(false)
  
  function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setError(null)
    setSelectedPlace(null)
    
    searchPlaces(searchQuery)
      .then(data => {
        setResults(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError('Failed to search places')
        setIsLoading(false)
        console.error(err)
      })
  }
  
  function handleSelectPlace(placeId) {
    setIsLoadingPlace(true)
    setError(null)
    
    getPlaceById(placeId)
      .then(data => {
        setSelectedPlace(data)
        setIsLoadingPlace(false)
      })
      .catch(err => {
        setError('Failed to load place details')
        setIsLoadingPlace(false)
        console.error(err)
      })
  }
  
  function handleAddPlace() {
    if (selectedPlace && location.state?.itineraryId && location.state?.dayId) {
      navigate(`/itineraries/${location.state.itineraryId}/days/${location.state.dayId}`, {
        state: { 
          selectedPlace
        }
      })
    } else {
      navigate(returnPath)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Link to={returnPath} className="text-indigo-600 hover:text-indigo-800 mr-4">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Find Places</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label htmlFor="searchQuery" className="block text-gray-700 font-medium mb-2">
                  Search for Places
                </label>
                <input
                  id="searchQuery"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter attraction, restaurant, landmark..."
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
                disabled={isLoading || !searchQuery.trim()}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Searching for places...</p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map(place => (
                  <div 
                    key={place.id}
                    className={`border rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors ${
                      selectedPlace?.id === place.id ? 'border-indigo-500 bg-indigo-50' : ''
                    }`}
                    onClick={() => handleSelectPlace(place.id)}
                  >
                    <h3 className="text-lg font-medium mb-1">{place.name}</h3>
                    {place.address && <p className="text-gray-600 text-sm">{place.address}</p>}
                    {place.category && (
                      <p className="mt-2">
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {place.category}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery && !isLoading && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Places Found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or search for a different location.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {selectedPlace && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedPlace.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {selectedPlace.images && selectedPlace.images.length > 0 ? (
                <div className="rounded-lg overflow-hidden h-64">
                  <img 
                    src={selectedPlace.images[0]} 
                    alt={selectedPlace.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
              
              <div>
                {selectedPlace.address && (
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm mb-1">Address</h3>
                    <p>{selectedPlace.address}</p>
                  </div>
                )}
                
                {selectedPlace.phone && (
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm mb-1">Phone</h3>
                    <p>{selectedPlace.phone}</p>
                  </div>
                )}
                
                {selectedPlace.website && (
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm mb-1">Website</h3>
                    <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                      {new URL(selectedPlace.website).hostname}
                    </a>
                  </div>
                )}
                
                {selectedPlace.openingHours && (
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm mb-1">Hours</h3>
                    <p className="text-sm">{selectedPlace.openingHours}</p>
                  </div>
                )}
                
                {selectedPlace.priceLevel && (
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm mb-1">Price Level</h3>
                    <p>{"$".repeat(selectedPlace.priceLevel)}</p>
                  </div>
                )}
              </div>
            </div>
            
            {selectedPlace.description && (
              <div className="mb-6">
                <h3 className="text-gray-600 text-sm mb-1">Description</h3>
                <p className="text-gray-700">{selectedPlace.description}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleAddPlace}
                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
              >
                {location.state?.itineraryId ? 'Add to Itinerary' : 'Select Place'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaceSearch 