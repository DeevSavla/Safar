import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchItineraries, removeItinerary } from '../store/slices/itinerarySlice'
import { PlusCircle, Map, Users, Globe, Trash2, Calendar, ExternalLink, Lock, Unlock, PlaneTakeoff } from 'lucide-react'
import "./HeroSection.css" // Import the animation styles

function Itineraries() {
  const { isAuthenticated, user } = useSelector(state => state.auth)
  const { itineraries, isLoading, error } = useSelector(state => state.itinerary)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  useEffect(() => {
    // Fetch itineraries when component mounts
    dispatch(fetchItineraries())
  }, [dispatch])
  
  function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this itinerary?')) {
      dispatch(removeItinerary(id))
    }
  }
  
  // Add a function to check if the user is the owner after handleDelete
  function isUserOwner(itinerary) {
    if (!user || !itinerary) return false;
    
    // Get owner ID from itinerary
    const ownerId = itinerary.owner?._id || itinerary.owner?.id || itinerary.owner;
    
    // Get current user ID
    const userId = user._id || user.id;
    
    // Compare as strings to ensure proper comparison
    return String(ownerId) === String(userId);
  }
  
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };
  
  // Create a memoized version of the itineraries data to ensure it's always an array
  const itinerariesData = Array.isArray(itineraries?.itineraries) 
    ? itineraries.itineraries 
    : Array.isArray(itineraries) 
      ? itineraries 
      : []
  
  return (
    <motion.div 
      className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gradient-to-r from-[#56288A]/10 to-[#864BD8]/10 p-8 rounded-3xl mb-12 shadow-soft border border-[#56288A]/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#56288A] to-[#864BD8]">
              Mera Safar
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and explore your personalized travel plans
            </p>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link 
                to="/itineraries/explore" 
                className="glass-card flex items-center gap-2 px-6 py-3 rounded-xl text-[#56288A] hover:shadow-md transition-all"
              >
                <Globe className="h-5 w-5" />
                <span>Explore Public Journeys</span>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link 
                to="/itineraries/new" 
                className="bg-gradient-to-r from-[#56288A] to-[#864BD8] flex items-center gap-2 px-6 py-3 rounded-xl text-white hover:shadow-lg btn-pulse transition-all"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Create New Journey</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
      
      {error && (
        <motion.div 
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg mb-8"
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
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="relative w-24 h-24">
            <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full">
              <div className="w-full h-full rounded-full border-4 border-[#56288A]/20"></div>
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-t-4 border-[#56288A] animate-spin"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="h-10 w-10 text-[#56288A]" />
            </div>
          </div>
        </div>
      ) : itinerariesData.length === 0 ? (
        <motion.div 
          className="glass-card rounded-2xl p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto w-24 h-24 rounded-full bg-[#56288A]/10 flex items-center justify-center mb-6">
            <Map className="h-12 w-12 text-[#56288A]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Begin Your First Adventure</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You haven't created any itineraries yet. Start planning your next adventure with Safar!
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to="/itineraries/new" 
              className="bg-gradient-to-r from-[#56288A] to-[#864BD8] px-8 py-4 rounded-xl text-white font-medium inline-flex items-center gap-2 hover:shadow-lg btn-pulse transition-all"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Create Your First Journey</span>
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {itinerariesData.map(itinerary => (
              <motion.div 
                key={itinerary.id || itinerary._id} 
                className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                variants={itemVariants}
                layout
                exit="exit"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800 truncate max-w-[200px]">
                      {itinerary.title}
                    </h3>
                    <div className="flex gap-1">
                      <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                        itinerary.isPrivate 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {itinerary.isPrivate ? 
                          <><Lock className="h-3 w-3" /> Private</> : 
                          <><Unlock className="h-3 w-3" /> Public</>
                        }
                      </span>
                      {isUserOwner(itinerary) ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Owner
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Collab
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Journey visualization with source and destination */}
                  <motion.div 
                    className="bg-gradient-to-b from-white to-gray-50 p-5 rounded-xl mb-5 border border-gray-100 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  >
                    <div className="relative px-5 py-2">
                      {/* Source to destination line with animated gradient */}
                      <motion.div 
                        className="absolute top-1/2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-green-500 via-[#56288A] to-red-500 transform -translate-y-1/2"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                      
                      {/* Animated dots along the path */}
                      <motion.div 
                        className="absolute top-1/2 left-1/4 w-2 h-2 bg-[#56288A] rounded-full transform -translate-y-1/2 z-20"
                        animate={{ 
                          x: ["0%", "300%"],
                          opacity: [0, 1, 0],
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          repeatType: "loop", 
                          ease: "easeInOut",
                          times: [0, 0.5, 1]
                        }}
                      />
                      
                      {/* Journey details with dots */}
                      <div className="flex justify-between items-center relative z-10 mb-8">
                        {/* Source (departure) */}
                        <motion.div 
                          className="flex flex-col items-center"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div 
                            className="w-6 h-6 rounded-full bg-green-500 mb-1 shadow-md flex items-center justify-center"
                            whileHover={{ scale: 1.2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <motion.svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-3 w-3 text-white" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.6 }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </motion.svg>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col items-center"
                          >
                            <span className="text-xs font-medium text-[#56288A] truncate max-w-[80px] text-center">
                              {itinerary.origin?.name || itinerary.origin || 'Departure'}
                            </span>
                          </motion.div>
                        </motion.div>
                        
                        {/* Travel icon */}
                        <motion.div 
                          className="bg-white p-2 rounded-full shadow-md z-20"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          whileHover={{ 
                            scale: 1.2,
                            rotate: 10,
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                          }}
                        >
                          <motion.div
                            animate={{ 
                              x: ["-10%", "10%"],
                              y: ["-10%", "10%"]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse", 
                              ease: "easeInOut" 
                            }}
                          >
                            <PlaneTakeoff className="h-5 w-5 text-[#56288A]" />
                          </motion.div>
                        </motion.div>
                        
                        {/* Destination */}
                        <motion.div 
                          className="flex flex-col items-center"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div 
                            className="w-6 h-6 rounded-full bg-red-500 mb-1 shadow-md flex items-center justify-center"
                            whileHover={{ scale: 1.2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <motion.svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-3 w-3 text-white" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.6 }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </motion.svg>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col items-center"
                          >
                            <span className="text-xs font-medium text-[#56288A] max-w-[80px] text-center truncate">
                              {itinerary.destination?.name || itinerary.destination || 'Destination'}
                            </span>
                          </motion.div>
                        </motion.div>
                      </div>
                      
                      {/* Dates display - moved below the locations */}
                      <div className="flex justify-between items-center px-2 mt-1">
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(itinerary.dateRange?.start || itinerary.startDate).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}
                          </span>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(itinerary.dateRange?.end || itinerary.endDate).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}
                          </span>
                        </motion.div>
                      </div>
                      
                      {/* Journey duration */}
                      <motion.div 
                        className="flex justify-center mt-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <motion.span 
                          className="text-xs bg-[#56288A]/10 text-[#56288A] px-3 py-1 rounded-full font-medium flex items-center"
                          whileHover={{ 
                            scale: 1.05,
                            backgroundColor: "rgba(86, 40, 138, 0.2)"
                          }}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-3 w-3 mr-1" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {itinerary.days?.length || 0} {itinerary.days?.length === 1 ? 'Day' : 'Days'}
                        </motion.span>
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  <div className="flex justify-between mt-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link 
                        to={`/itineraries/${itinerary.id || itinerary._id || itinerary.uuid}`} 
                        className="bg-[#56288A]/5 hover:bg-[#56288A]/10 text-[#56288A] px-4 py-2 rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Details
                      </Link>
                    </motion.div>
                    {isUserOwner(itinerary) && (
                      <motion.button 
                        onClick={() => handleDelete(itinerary.id || itinerary._id || itinerary.uuid)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Itineraries 