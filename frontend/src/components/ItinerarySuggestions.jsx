import { useState, useEffect } from "react";
import axios from "axios";

function ItinerarySuggestions({ itineraryId, isOpen, setIsOpen }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);

  // Use effect to fetch suggestions when isOpen changes to true
  useEffect(() => {
    if (isOpen && !suggestions) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const toggleSuggestions = () => {
    if (!suggestions && !isOpen) {
      // Load suggestions when first opening
      fetchSuggestions();
    }
    setIsOpen(!isOpen);
  };

  const fetchSuggestions = async (refresh = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      // Make API call to get suggestions with proper authentication
      const response = await axios.get(
        `${
          import.meta.env.NODE_API_URL
        }/api/itineraries/${itineraryId}/suggestions${
          refresh ? "?refresh=true" : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Suggestions data:", response.data);
      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data
      ) {
        // Set suggestions data
        setSuggestions(
          response.data.data.suggestions || response.data.data || {}
        );
      } else {
        // Handle empty or malformed response
        setSuggestions({});
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading suggestions:", err);
      let errorMsg = "Failed to load suggestions. Please try again.";

      // Handle specific error codes
      if (err.response) {
        if (err.response.status === 403) {
          errorMsg =
            "Access denied. You do not have permission to view suggestions.";
        } else if (err.response.status === 404) {
          // Set empty suggestions instead of error for 404
          console.log(
            "No suggestions endpoint available, displaying empty state"
          );
          setSuggestions({});
          setIsLoading(false);
          return;
        }
      }

      setError(errorMsg);
      setIsLoading(false);
    }
  };

  // Function to refresh suggestions from AI
  const refreshSuggestions = () => {
    fetchSuggestions(true);
  };

  return (
    <div className="relative">
      {/* Suggestions Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          aria-labelledby="slide-over-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 overflow-hidden">
            {/* Background overlay */}
            <div
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={toggleSuggestions}
            ></div>

            <div className="fixed inset-y-0 left-0 max-w-full flex">
              <div className="relative w-screen max-w-md">
                <div className="h-full flex flex-col py-6 bg-white shadow-xl overflow-y-auto">
                  <div className="px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2
                        className="text-xl font-semibold text-gray-900"
                        id="slide-over-title"
                      >
                        Travel Suggestions
                      </h2>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          type="button"
                          className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-2"
                          onClick={refreshSuggestions}
                          title="Refresh suggestions"
                          disabled={isLoading}
                        >
                          <span className="sr-only">Refresh suggestions</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onClick={toggleSuggestions}
                        >
                          <span className="sr-only">Close panel</span>
                          <svg
                            className="h-6 w-6"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 relative flex-1 px-4 sm:px-6">
                    {/* Suggestions Content */}
                    <div className="absolute inset-0 px-4 sm:px-6 overflow-y-auto">
                      {isLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                          <p className="text-gray-600 font-medium">
                            Loading suggestions...
                          </p>
                        </div>
                      ) : error ? (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg my-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg
                                className="h-5 w-5 text-red-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-700">{error}</p>
                            </div>
                          </div>
                        </div>
                      ) : suggestions && Object.keys(suggestions).length > 0 ? (
                        <div className="space-y-8">
                          {/* Accommodation Suggestions */}
                          {suggestions.accommodations &&
                            Object.keys(suggestions.accommodations).length >
                              0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center text-indigo-900">
                                  <span className="bg-indigo-100 p-1.5 rounded-lg mr-2">
                                    🏨
                                  </span>
                                  Accommodation Suggestions
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                  {Object.entries(
                                    suggestions.accommodations
                                  ).map(([type, hotels]) => (
                                    <div
                                      key={type}
                                      className="bg-indigo-50 p-4 rounded-lg shadow-sm border border-indigo-100"
                                    >
                                      <h4 className="font-medium mb-3 capitalize text-indigo-800 border-b border-indigo-100 pb-2">
                                        {type}
                                      </h4>
                                      <ul className="space-y-3">
                                        {Array.isArray(hotels) ? (
                                          hotels.map((hotel, index) => (
                                            <li
                                              key={index}
                                              className="bg-white p-3 rounded border border-indigo-100 shadow-sm"
                                            >
                                              <div className="font-medium text-gray-900">
                                                {hotel.name}
                                              </div>
                                              {hotel.area && (
                                                <div className="text-sm text-gray-600 mt-1 flex items-center">
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 mr-1 text-indigo-500"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                  >
                                                    <path
                                                      fillRule="evenodd"
                                                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                                      clipRule="evenodd"
                                                    />
                                                  </svg>
                                                  {hotel.area}
                                                </div>
                                              )}
                                              {hotel.price_range && (
                                                <div className="text-sm text-gray-600 mt-1 flex items-center">
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 mr-1 text-indigo-500"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                  >
                                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                    <path
                                                      fillRule="evenodd"
                                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                                      clipRule="evenodd"
                                                    />
                                                  </svg>
                                                  {hotel.price_range}
                                                </div>
                                              )}
                                              {hotel.amenities &&
                                                hotel.amenities.length > 0 && (
                                                  <div className="text-sm text-gray-600 mt-2">
                                                    <div className="font-medium text-gray-700 mb-1">
                                                      Amenities:
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                      {hotel.amenities.map(
                                                        (amenity, i) => (
                                                          <span
                                                            key={i}
                                                            className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                                                          >
                                                            {amenity}
                                                          </span>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                            </li>
                                          ))
                                        ) : (
                                          <li className="bg-white p-3 rounded border border-indigo-100 shadow-sm">
                                            <p className="text-gray-600">
                                              No specific hotels listed
                                            </p>
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Restaurant Suggestions */}
                          {suggestions.restaurants &&
                            Object.keys(suggestions.restaurants).length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center text-indigo-900">
                                  <span className="bg-indigo-100 p-1.5 rounded-lg mr-2">
                                    🍽️
                                  </span>
                                  Restaurant Suggestions
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                  {Object.entries(suggestions.restaurants).map(
                                    ([cuisine, restaurants]) => (
                                      <div
                                        key={cuisine}
                                        className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100"
                                      >
                                        <h4 className="font-medium mb-3 capitalize text-green-800 border-b border-green-100 pb-2">
                                          {cuisine} Cuisine
                                        </h4>
                                        <ul className="space-y-3">
                                          {Array.isArray(restaurants) ? (
                                            restaurants.map(
                                              (restaurant, index) => (
                                                <li
                                                  key={index}
                                                  className="bg-white p-3 rounded border border-green-100 shadow-sm"
                                                >
                                                  <div className="font-medium text-gray-900">
                                                    {restaurant.name}
                                                  </div>
                                                  {restaurant.price_range && (
                                                    <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                      {restaurant.price_range}
                                                    </div>
                                                  )}
                                                  {restaurant.speciality && (
                                                    <div className="text-sm text-gray-600 mt-1 flex items-center">
                                                      <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 mr-1 text-green-500"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                      >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                      </svg>
                                                      Speciality:{" "}
                                                      {restaurant.speciality}
                                                    </div>
                                                  )}
                                                  {restaurant.address && (
                                                    <div className="text-sm text-gray-600 mt-1 flex items-center">
                                                      <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 mr-1 text-green-500"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                      >
                                                        <path
                                                          fillRule="evenodd"
                                                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                                          clipRule="evenodd"
                                                        />
                                                      </svg>
                                                      {restaurant.address}
                                                    </div>
                                                  )}
                                                </li>
                                              )
                                            )
                                          ) : typeof restaurants === "object" &&
                                            restaurants !== null ? (
                                            <li className="bg-white p-3 rounded border border-green-100 shadow-sm">
                                              <div className="font-medium text-gray-900">
                                                {restaurants.name ||
                                                  "Restaurant"}
                                              </div>
                                              {restaurants.description && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                  {restaurants.description}
                                                </div>
                                              )}
                                            </li>
                                          ) : (
                                            <li className="bg-white p-3 rounded border border-green-100 shadow-sm">
                                              <p className="text-gray-600">
                                                No specific restaurants listed
                                              </p>
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Activity Suggestions */}
                          {suggestions.activities &&
                            (Array.isArray(suggestions.activities)
                              ? suggestions.activities.length > 0
                              : Object.keys(suggestions.activities).length >
                                0) && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center text-indigo-900">
                                  <span className="bg-indigo-100 p-1.5 rounded-lg mr-2">
                                    🎯
                                  </span>
                                  Activity Suggestions
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                  {Array.isArray(suggestions.activities) ? (
                                    suggestions.activities.map(
                                      (activity, index) => (
                                        <div
                                          key={index}
                                          className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                          <div className="font-medium text-gray-900 text-lg">
                                            {activity.name ||
                                              activity.title ||
                                              (typeof activity === "string"
                                                ? activity
                                                : "Activity")}
                                          </div>
                                          {typeof activity === "object" &&
                                            activity.description && (
                                              <div className="text-gray-700 mt-2">
                                                {activity.description}
                                              </div>
                                            )}
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                                      <p className="text-gray-600">
                                        No specific activities listed
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Transportation Suggestions */}
                          {suggestions.transportation &&
                            (Array.isArray(suggestions.transportation)
                              ? suggestions.transportation.length > 0
                              : Object.keys(suggestions.transportation).length >
                                0) && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center text-indigo-900">
                                  <span className="bg-indigo-100 p-1.5 rounded-lg mr-2">
                                    🚌
                                  </span>
                                  Transportation Options
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                  {Array.isArray(suggestions.transportation) ? (
                                    suggestions.transportation.map(
                                      (option, index) => (
                                        <div
                                          key={index}
                                          className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 shadow-sm"
                                        >
                                          <div className="font-medium text-gray-900">
                                            {option.mode ||
                                              option.name ||
                                              option.type ||
                                              `Option ${index + 1}`}
                                          </div>
                                          {option.description && (
                                            <div className="text-gray-700 mt-2 text-sm">
                                              {option.description}
                                            </div>
                                          )}
                                          {option.cost && (
                                            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                              Cost: {option.cost}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 shadow-sm">
                                      <p className="text-gray-600">
                                        No specific transportation options
                                        listed
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Show a message if no sections are available */}
                          {!suggestions.accommodations &&
                            !suggestions.restaurants &&
                            !suggestions.activities &&
                            !suggestions.transportation && (
                              <div className="text-center py-8">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-12 w-12 mx-auto text-gray-400 mb-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-700 mb-2">
                                  No Specific Suggestions Available
                                </h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                  This itinerary doesn't have detailed
                                  suggestions yet. You can add your own
                                  activities to each day from the day planner.
                                </p>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mx-auto text-gray-400 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-700 mb-2">
                            No Suggestions
                          </h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            There are no suggestions available for this
                            itinerary.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItinerarySuggestions;
