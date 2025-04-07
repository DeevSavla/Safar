import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSearch, FaMapMarkerAlt, FaUserPlus, FaCheck, FaUser, FaCalendarAlt, FaGlobeAmericas } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPublicItineraries } from '../store/slices/itinerarySlice';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// Components
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';

const ExploreItineraries = () => {
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });
  const [requestedItineraries, setRequestedItineraries] = useState([]);
  
  // Sample images array
  const sampleImages = [
    'https://plus.unsplash.com/premium_photo-1661930618375-aafabc2bf3e7',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    'https://images.unsplash.com/photo-1494783367193-149034c05e8f',
    'https://images.unsplash.com/photo-1496950866446-3253e1470e8e',
    'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'
  ];
  
  // Get authentication state and itineraries from Redux
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { publicItineraries, isLoading, error } = useSelector(state => state.itinerary);
  const dispatch = useDispatch();
  
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchItineraries();
    }
  }, [pagination.page, search, isAuthenticated]);

  const fetchItineraries = () => {
    if (!isAuthenticated) return;
    
    dispatch(fetchPublicItineraries({
      page: pagination.page,
      limit: pagination.limit,
      search
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to first page when searching
    setPagination({ ...pagination, page: 1 });
    fetchItineraries();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleRequestJoin = async (itineraryId) => {
    try {
      const response = await api.post(
        `/itineraries/${itineraryId}/join-request`,
        {}
      );

      if (response.data.success) {
        toast.success('Join request sent successfully');
        // Add this itinerary to the requested list so we can disable the button
        setRequestedItineraries([...requestedItineraries, itineraryId]);
      }
    } catch (err) {
      console.error('Error requesting to join:', err);
      const errorMsg = err.response?.data?.message || 'Failed to send join request';
      toast.error(errorMsg);
    }
  };

  const viewItineraryDetails = (itineraryId) => {
    navigate(`/itineraries/${itineraryId}`);
  };

  // Helper function to get a random image from the sample images array
  const getRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * sampleImages.length);
    return sampleImages[randomIndex];
  };

  // Check if the current user is the owner of an itinerary
  const isUserOwner = (itinerary) => {
    if (!user || !itinerary || !itinerary.owner) return false;
    
    // Get owner ID from itinerary
    const ownerId = itinerary.owner._id || itinerary.owner.id || itinerary.owner;
    
    // Get current user ID
    const userId = user._id || user.id;
    
    // Compare as strings to ensure proper comparison
    return String(ownerId) === String(userId);
  };

  // Check if the current user is a collaborator in an itinerary
  const isUserCollaborator = (itinerary) => {
    if (!user || !itinerary || !itinerary.collaborators) return false;
    
    // Get current user ID
    const userId = user._id || user.id;
    
    // Check if the user is in the collaborators array
    return itinerary.collaborators.some(collab => {
      const collaboratorId = collab.user._id || collab.user.id || collab.user;
      return String(collaboratorId) === String(userId);
    });
  };

  // Extract itineraries from Redux state
  const itineraries = publicItineraries?.data || [];
  const paginationInfo = publicItineraries?.pagination || { total: 0, pages: 0 };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        type: "spring",
        stiffness: 100 
      }
    }
  };

  const buttonHoverVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95,
      boxShadow: "0 5px 10px -3px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-gradient-to-r from-[#56288A]/10 to-[#864BD8]/10 p-8 rounded-3xl mb-10 shadow-md border border-[#56288A]/20"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#56288A] to-[#864BD8]">
              Explore Journeys
            </h1>
            <p className="text-gray-600 mt-2 max-w-lg">
              Discover public itineraries created by travelers from around the world. Get inspired for your next adventure!
            </p>
          </motion.div>
          
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonHoverVariants}
          >
            <Link 
              to="/itineraries" 
              className="bg-gradient-to-r from-[#56288A] to-[#864BD8] flex items-center gap-2 px-6 py-3 rounded-xl text-white hover:shadow-lg transition-all"
            >
              <FaUser className="h-5 w-5" />
              <span>My Itineraries</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Search Box */}
      <motion.div 
        className="mb-12"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              className="w-full p-4 pl-12 border border-purple-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-[#56288A] bg-white/80 shadow-sm transition-all duration-300"
              placeholder="Search itineraries by title, destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#56288A]" />
          </div>
          <motion.button
            type="submit"
            className="bg-gradient-to-r from-[#56288A] to-[#864BD8] text-white px-6 py-4 rounded-r-xl hover:from-[#6b339e] hover:to-[#9562e6] focus:outline-none focus:ring-2 focus:ring-[#56288A] shadow-sm"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Search
          </motion.button>
        </form>
      </motion.div>

      {/* Content section */}
      {isLoading ? (
        <motion.div 
          className="flex justify-center my-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-24 h-24">
            <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full">
              <div className="w-full h-full rounded-full border-4 border-[#56288A]/20"></div>
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-t-4 border-[#56288A] animate-spin"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaGlobeAmericas className="h-10 w-10 text-[#56288A]" />
            </div>
          </div>
        </motion.div>
      ) : error ? (
        <motion.div 
          className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg my-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
          <motion.button 
            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            onClick={() => dispatch(fetchItineraries())}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try again
          </motion.button>
        </motion.div>
      ) : itineraries.length === 0 ? (
        <motion.div 
          className="bg-white border border-purple-100 rounded-2xl p-12 text-center shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="mx-auto w-24 h-24 rounded-full bg-[#56288A]/10 flex items-center justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5,
              type: "spring", 
              delay: 0.2 
            }}
          >
            <FaMapMarkerAlt className="h-12 w-12 text-[#56288A]" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">No Journeys Found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            No public itineraries match your search criteria. Try adjusting your search or check back later for new journeys.
          </p>
          <motion.button
            onClick={() => setSearch('')}
            className="bg-gradient-to-r from-[#56288A] to-[#864BD8] px-8 py-3 rounded-xl text-white font-medium inline-flex items-center gap-2 hover:shadow-lg transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSearch className="h-4 w-4" />
            <span>Clear Search</span>
          </motion.button>
        </motion.div>
      ) : (
        <div>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {itineraries.map((itinerary) => (
                <motion.div 
                  key={itinerary._id} 
                  className="bg-white border border-purple-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  layout
                >
                  <div className="h-48 flex items-center justify-center overflow-hidden">
                    {/* Always display a random image from the sample images array */}
                    <img 
                      src={getRandomImage()} 
                      alt={itinerary.title} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-xl font-semibold mb-2 text-[#56288A] hover:text-[#864BD8] transition-colors truncate max-w-[200px]">
                        {itinerary.title}
                      </h2>
                      <div className="flex gap-1">
                        <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                          itinerary.isPrivate 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {itinerary.isPrivate ? 
                            <><FaUserPlus className="h-3 w-3" /> Private</> : 
                            <><FaCheck className="h-3 w-3" /> Public</>
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-4 text-sm text-gray-600">
                      <div className="flex items-center mb-2">
                        <span className="font-medium text-[#56288A] w-24">Creator:</span>
                        <span className="ml-2 truncate">
                          {isUserOwner(itinerary) ? (
                            <span className="flex items-center text-[#56288A]">
                              {itinerary.owner?.username || 'You'} <FaUser className="ml-1" size={12} />
                            </span>
                          ) : (
                            itinerary.owner?.username || 'Anonymous'
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <span className="font-medium text-[#56288A] w-24">Destination:</span>
                        <span className="ml-2 truncate max-w-[180px]">
                          {itinerary.destinations?.join(', ') || itinerary.destination?.name || itinerary.destination || 'Not specified'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium text-[#56288A] w-24">Dates:</span>
                        <span className="ml-2 text-xs bg-indigo-50 px-2 py-1 rounded-md flex items-center">
                          <FaCalendarAlt className="mr-1 text-[#56288A]" />
                          {itinerary.dateRange ? (
                            `${new Date(itinerary.dateRange.start).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${new Date(itinerary.dateRange.end).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`
                          ) : itinerary.startDate && itinerary.endDate ? (
                            `${new Date(itinerary.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${new Date(itinerary.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`
                          ) : 'Not specified'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-5 pt-3 border-t border-gray-100">
                      <motion.button
                        onClick={() => viewItineraryDetails(itinerary._id)}
                        className="px-4 py-2 bg-gradient-to-r from-[#56288A] to-[#864BD8] text-white rounded-lg hover:from-[#6b339e] hover:to-[#9562e6] flex items-center gap-1 shadow-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaGlobeAmericas className="h-4 w-4 mr-1" />
                        View Details
                      </motion.button>
                      
                      {!isUserOwner(itinerary) && !isUserCollaborator(itinerary) && (
                        <motion.button
                          onClick={() => handleRequestJoin(itinerary._id)}
                          disabled={requestedItineraries.includes(itinerary._id)}
                          className={`px-4 py-2 rounded-lg flex items-center gap-1 shadow-sm ${
                            requestedItineraries.includes(itinerary._id)
                              ? 'bg-green-500 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          whileHover={!requestedItineraries.includes(itinerary._id) ? { scale: 1.05 } : {}}
                          whileTap={!requestedItineraries.includes(itinerary._id) ? { scale: 0.95 } : {}}
                        >
                          {requestedItineraries.includes(itinerary._id) ? (
                            <>
                              <FaCheck className="h-4 w-4 mr-1" />
                              Requested
                            </>
                          ) : (
                            <>
                              <FaUserPlus className="h-4 w-4 mr-1" />
                              Join
                            </>
                          )}
                        </motion.button>
                      )}
                      
                      {isUserCollaborator(itinerary) && (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                          <FaCheck className="h-4 w-4 mr-1" />
                          Member
                        </span>
                      )}
                      
                      {isUserOwner(itinerary) && (
                        <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-1">
                          <FaUser className="h-4 w-4 mr-1" />
                          Your Itinerary
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {/* Pagination */}
          {paginationInfo.pages > 1 && (
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Pagination
                currentPage={pagination.page}
                totalPages={paginationInfo.pages}
                onPageChange={handlePageChange}
              />
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ExploreItineraries;