import { useState, useEffect } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getItineraryById } from "../services/itinerary";
import { searchPlaces } from "../services/place";
import axios from "axios";
import DayComments from "../components/DayComments";
import ItineraryMap from "../components/ItineraryMap";

function DayPlanner() {
  const { id, dayId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [locations, setLocations] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [day, setDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    placeId: "",
    placeName: "",
    startTime: "",
    endTime: "",
    notes: "",
    cost: 0,
    costCurrency: "USD",
    type: "other",
  });
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadData();
  }, [id, dayId]);

  // Load both itinerary and day data
  function loadData() {
    setIsLoading(true);
    setError(null);

    // Get auth token
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please login again.");
      setIsLoading(false);
      return;
    }

    // First, get the itinerary for context with proper authentication
    axios
      .get(`${import.meta.env.NODE_API_URL}/api/itineraries/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log("Itinerary data loaded:", response.data);
        // Handle response based on API format
        if (
          response.data &&
          response.data.status === "success" &&
          response.data.data
        ) {
          setItinerary(response.data.data.itinerary || response.data.data);
        } else {
          throw new Error("Itinerary data format is invalid");
        }

        // Now, directly fetch the day data from the backend
        return axios.get(
          `${import.meta.env.NODE_API_URL}/api/itineraries/days/${dayId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      })
      .then((response) => {
        console.log("Day data response:", response.data);

        // Handle the response based on API format
        if (
          response.data &&
          response.data.status === "success" &&
          response.data.data &&
          response.data.data.day
        ) {
          const dayData = response.data.data.day;
          console.log("Raw day data:", dayData);

          // Transform the backend day data to frontend format
          const transformedDay = transformDayData(dayData);
          console.log("Transformed day data:", transformedDay);
          setDay(transformedDay);
        } else {
          throw new Error("Day data format is invalid");
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setError(
          err.response?.status === 403
            ? "Access denied. You do not have permission to view this content."
            : "Failed to load day details. Please try again."
        );
        setIsLoading(false);
      });
  }

  // Transform backend day data to match frontend format
  function transformDayData(backendDay) {
    if (!backendDay) return null;

    // Process activities if they exist
    let transformedActivities = [];
    if (backendDay.activities && Array.isArray(backendDay.activities)) {
      transformedActivities = backendDay.activities.map((activity) => {
        return {
          id: activity._id || activity.id || activity.uuid,
          title: activity.title || "",
          type: activity.type || "other",
          startTime: activity.timeRange?.start
            ? formatTimeFromDate(activity.timeRange.start)
            : "",
          endTime: activity.timeRange?.end
            ? formatTimeFromDate(activity.timeRange.end)
            : "",
          notes: activity.notes || "",
          cost: activity.cost?.amount || 0,
          placeId: activity.location?.placeId || "",
          placeName: activity.location?.name || "",
          costObject: activity.cost || { amount: 0, currency: "USD" },
        };
      });
    }

    // Extract day number - either directly provided or calculate from date
    let dayNumber = backendDay.dayNumber;
    if (
      !dayNumber &&
      itinerary &&
      backendDay.date &&
      itinerary.dateRange?.start
    ) {
      const startDate = new Date(itinerary.dateRange.start);
      const currentDate = new Date(backendDay.date);
      const timeDiff = currentDate - startDate;
      dayNumber = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    }

    return {
      id: backendDay._id || backendDay.id || backendDay.uuid,
      dayNumber: dayNumber || 1,
      date: backendDay.date,
      notes: backendDay.notes || "",
      activities: transformedActivities,
    };
  }

  // Helper function to format time from an ISO date string
  function formatTimeFromDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toTimeString().substring(0, 5); // Returns HH:MM format
    } catch (e) {
      return "";
    }
  }

  // Add a function to safely handle API data with different formats
  function isSafeToMap(data) {
    return Array.isArray(data) && data.length > 0;
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    searchPlaces(searchQuery)
      .then((results) => {
        setSearchResults(results);
        setIsSearching(false);
      })
      .catch((err) => {
        setError("Failed to search places");
        setIsSearching(false);
        console.error(err);
      });
  }

  function selectPlace(place) {
    setSelectedPlace(place);
    setNewActivity((prev) => ({
      ...prev,
      placeId: place.id,
      placeName: place.name,
      title: place.name,
    }));
    setSearchResults([]);
    setSearchQuery("");
  }

  function handleActivityInputChange(e) {
    const { name, value } = e.target;
    setNewActivity((prev) => ({
      ...prev,
      [name]: name === "cost" ? parseFloat(value) || 0 : value,
    }));
  }

  function addActivity(e) {
    e.preventDefault();

    // Validate times
    if (newActivity.startTime && newActivity.endTime) {
      const start = new Date(`2000-01-01T${newActivity.startTime}`);
      const end = new Date(`2000-01-01T${newActivity.endTime}`);

      if (end < start) {
        setError("End time cannot be before start time");
        return;
      }
    }

    setIsLoading(true);

    // Prepare the activity data for the backend
    const activityData = {
      title: newActivity.title,
      type: newActivity.type || "other",
      notes: newActivity.notes,
      cost: {
        amount: parseFloat(newActivity.cost) || 0,
        currency: newActivity.costCurrency || "USD",
      },
      location: newActivity.placeName
        ? {
            name: newActivity.placeName,
            placeId: newActivity.placeId,
          }
        : null,
    };

    // Add time range if provided
    if (newActivity.startTime || newActivity.endTime) {
      activityData.timeRange = {};

      if (newActivity.startTime) {
        // Convert HH:MM to ISO date
        const [hours, minutes] = newActivity.startTime.split(":");
        const startDate = new Date();
        startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        activityData.timeRange.start = startDate.toISOString();
      }

      if (newActivity.endTime) {
        // Convert HH:MM to ISO date
        const [hours, minutes] = newActivity.endTime.split(":");
        const endDate = new Date();
        endDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        activityData.timeRange.end = endDate.toISOString();
      }
    }

    console.log("Adding activity:", activityData);

    // Make direct API call to add activity to day
    const token = localStorage.getItem("token");
    axios
      .post(
        `${
          import.meta.env.NODE_API_URL
        }/api/itineraries/days/${dayId}/activities`,
        activityData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        console.log("Activity added:", response.data);

        // Reset the form
        setNewActivity({
          title: "",
          placeId: "",
          placeName: "",
          startTime: "",
          endTime: "",
          notes: "",
          cost: 0,
          costCurrency: "USD",
          type: "other",
        });
        setSelectedPlace(null);
        setIsAddingActivity(false);

        // Reload the day data to show the new activity
        loadData();
      })
      .catch((err) => {
        console.error("Error adding activity:", err);
        setError("Failed to add activity. Please try again.");
        setIsLoading(false);
      });
  }

  function removeActivity(activityId) {
    if (!window.confirm("Are you sure you want to remove this activity?"))
      return;

    setIsLoading(true);

    // Make direct API call to remove activity
    const token = localStorage.getItem("token");
    axios
      .delete(
        `${
          import.meta.env.NODE_API_URL
        }/api/itineraries/activities/${activityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        // Reload the day data to reflect the changes
        loadData();
      })
      .catch((err) => {
        console.error("Error removing activity:", err);
        setError("Failed to remove activity. Please try again.");
        setIsLoading(false);
      });
  }

  if (isLoading && !day) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your day plan...</p>
        </div>
      </div>
    );
  }

  if (error && !day) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-700">
                Error Loading Day Plan
              </h3>
              <div className="mt-2 text-red-600">{error}</div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate(`/itineraries/${id}`)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow-md transition-colors flex items-center mx-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Itinerary
          </button>
        </div>
      </div>
    );
  }

  // Sort activities by start time
  const sortedActivities = day?.activities?.length
    ? [...day.activities].sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      })
    : [];

  // Calculate total cost for the day
  const totalCost = sortedActivities.reduce((sum, activity) => {
    return sum + (parseFloat(activity.cost) || 0);
  }, 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 shadow-sm">
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
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link
            to={`/itineraries/${id}`}
            className="text-indigo-600 hover:text-indigo-800 mr-4 flex items-center group transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Itinerary
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-base mr-3">
            Day {day?.dayNumber}
          </span>
          <span>
            {new Date(day?.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h2 className="text-xl font-bold text-gray-900 mb-3 sm:mb-0">
              Day Planner
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="bg-white py-2 px-4 rounded-lg shadow-sm flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">Total Cost: </span>
                <span className="font-medium ml-1 text-gray-900">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setIsAddingActivity(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center disabled:bg-indigo-300"
                disabled={isAddingActivity}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Activity
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isAddingActivity && (
            <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium mb-5 flex items-center text-gray-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-indigo-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clipRule="evenodd"
                  />
                </svg>
                Add New Activity
              </h3>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1 text-indigo-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Search for a Place
                </label>
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Eiffel Tower, Central Park, Museum"
                    disabled={isSearching}
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-3 rounded-r-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors flex items-center"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Search
                      </>
                    )}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="mt-3 border rounded-lg max-h-48 overflow-y-auto shadow-sm">
                    <ul className="divide-y divide-gray-200">
                      {searchResults.map((place) => (
                        <li
                          key={place.id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                          onClick={() => selectPlace(place)}
                        >
                          <div className="font-medium text-indigo-700">
                            {place.name}
                          </div>
                          {place.address && (
                            <div className="text-sm text-gray-600">
                              {place.address}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedPlace && (
                  <div className="mt-3 p-4 border rounded-lg bg-indigo-50 border-indigo-100 shadow-sm">
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-700 mt-0.5 mr-2 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <div className="font-medium text-indigo-800">
                          {selectedPlace.name}
                        </div>
                        {selectedPlace.address && (
                          <div className="text-sm text-indigo-600">
                            {selectedPlace.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={addActivity} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="title"
                      className="block text-gray-700 font-medium flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1 text-indigo-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Activity Title*
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newActivity.title}
                      onChange={handleActivityInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="type"
                      className="block text-gray-700 font-medium flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1 text-indigo-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Activity Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={newActivity.type}
                      onChange={handleActivityInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
                    >
                      <option value="other">Other</option>
                      <option value="attraction">Attraction</option>
                      <option value="food">Food</option>
                      <option value="transport">Transportation</option>
                      <option value="accommodation">Accommodation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="cost"
                      className="block text-gray-700 font-medium flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1 text-indigo-500"
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
                      Estimated Cost
                    </label>
                    <div className="flex shadow-sm">
                      <input
                        type="number"
                        id="cost"
                        name="cost"
                        value={newActivity.cost}
                        onChange={handleActivityInputChange}
                        className="w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.01"
                      />
                      <select
                        id="costCurrency"
                        name="costCurrency"
                        value={newActivity.costCurrency}
                        onChange={handleActivityInputChange}
                        className="px-3 py-2 border-t border-r border-b rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-gray-700 w-24"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="INR">INR</option>
                        <option value="GBP">GBP</option>
                        <option value="AUD">AUD</option>
                        <option value="CAD">CAD</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="startTime"
                      className="block text-gray-700 font-medium flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1 text-indigo-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={newActivity.startTime}
                      onChange={handleActivityInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="endTime"
                      className="block text-gray-700 font-medium flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1 text-indigo-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      End Time
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={newActivity.endTime}
                      onChange={handleActivityInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="notes"
                    className="block text-gray-700 font-medium flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1 text-indigo-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={newActivity.notes}
                    onChange={handleActivityInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    placeholder="Add any additional information or notes about this activity..."
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 pt-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-sm transition-colors flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Add to Itinerary
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingActivity(false);
                      setSelectedPlace(null);
                      setNewActivity({
                        title: "",
                        placeId: "",
                        placeName: "",
                        startTime: "",
                        endTime: "",
                        notes: "",
                        cost: 0,
                        costCurrency: "USD",
                        type: "other",
                      });
                    }}
                    className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 shadow-sm transition-colors flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div>
            {day?.activities && day.activities.length > 0 ? (
              <div className="space-y-3">
                {/* Timeline of activities */}
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-7 w-1 bg-indigo-100 z-0"></div>
                  <ul className="space-y-4 relative z-10">
                    {sortedActivities.map((activity, index) => {
                      return (
                        <li key={activity.id || index} className="relative">
                          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                              {/* Activity Type Icon */}
                              <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  activity.type === "transport"
                                    ? "bg-yellow-100"
                                    : activity.type === "accommodation"
                                    ? "bg-indigo-100"
                                    : activity.type === "food"
                                    ? "bg-green-100"
                                    : activity.type === "attraction"
                                    ? "bg-blue-100"
                                    : "bg-gray-100"
                                }`}
                              >
                                {activity.type === "transport" && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-7 w-7 text-yellow-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-6a1 1 0 00-.293-.707l-3-3A1 1 0 0016 3H3z" />
                                  </svg>
                                )}
                                {activity.type === "accommodation" && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-7 w-7 text-indigo-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                  </svg>
                                )}
                                {activity.type === "food" && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-7 w-7 text-green-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                  </svg>
                                )}
                                {activity.type === "attraction" && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-7 w-7 text-blue-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M2 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm10.293 2.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 10.414V15a1 1 0 11-2 0v-4.586l-2.293 2.293a1 1 0 01-1.414-1.414l3-3zM8 6a1 1 0 100 2 1 1 0 000-2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {(activity.type === "other" ||
                                  !activity.type) && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-7 w-7 text-gray-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>

                              {/* Activity Details */}
                              <div className="flex-grow">
                                <h3 className="font-medium text-lg text-gray-900">
                                  {activity.title}
                                </h3>
                                {activity.placeName && (
                                  <div className="text-gray-600 text-sm flex items-center mt-1">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {activity.placeName}
                                  </div>
                                )}
                                {activity.startTime && activity.endTime && (
                                  <div className="text-gray-600 text-sm flex items-center mt-1">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {formatTime(activity.startTime)} -{" "}
                                    {formatTime(activity.endTime)}
                                  </div>
                                )}
                                {activity.cost > 0 && (
                                  <div className="text-gray-600 text-sm flex items-center mt-1">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
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
                                    {activity.cost}{" "}
                                    {activity.costCurrency || "USD"}
                                  </div>
                                )}
                                {activity.notes && (
                                  <div className="mt-3 bg-gray-50 p-3 rounded-lg text-gray-700 text-sm">
                                    {activity.notes}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <button
                                onClick={() => removeActivity(activity.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Remove activity"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V7z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No Activities Yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  You haven't added any activities to this day yet. Click the
                  button above to add your first activity.
                </p>
                <button
                  onClick={() => setIsAddingActivity(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center mx-auto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add First Activity
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ItineraryMap locations={locations} setLocations={setLocations} />
      {/* Day Comments component with improved error handling */}
      {day && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-indigo-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
              Day Comments
            </h2>
          </div>
          <div className="p-6">
            {/* Ensure we're passing correct ID format - log to debug */}
            {console.log("Rendering DayComments with dayId:", day.id)}
            <DayComments dayId={day.id} />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format time
function formatTime(timeString) {
  try {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return timeString;
  }
}

// Helper function to format datetime from ISO string to just time
function formatDateTime(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return dateString;
  }
}

export default DayPlanner;
