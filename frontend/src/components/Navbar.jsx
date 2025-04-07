import { Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { logoutUser } from '../store/slices/authSlice'
import { 
  Bell, 
  Globe, 
  Home, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Book,
  Info,
  LogIn,
  UserPlus,
  FileText,
  ChevronDown
} from 'lucide-react'
import { Button } from './ui/button'
import api from '../services/api'
import "../pages/HeroSection.css" // Import our glassmorphism styles
import logo from '../assets/logo.svg' // Import our custom logo

function Navbar() {
  const { isAuthenticated, user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const location = useLocation() // Get current location for active route highlighting
  const [hasPendingRequests, setHasPendingRequests] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Helper function to check if a route is active
  const isActiveRoute = (path) => {
    // Handle nested routes like /itineraries/123 - should highlight /itineraries link
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // Close dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Check for pending join requests when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      checkPendingJoinRequests()
    }
  }, [isAuthenticated, user])

  const checkPendingJoinRequests = async () => {
    try {
      // Get all itineraries the user owns
      const response = await api.get('/itineraries')
      
      if (response.data.success) {
        const itineraries = response.data.data.itineraries || []
        
        // Find itineraries owned by the current user
        const ownedItineraries = itineraries.filter(itinerary => 
          itinerary.owner?._id === user._id || 
          itinerary.owner === user._id
        )
        
        // Check for pending join requests
        let foundPending = false
        
        for (const itinerary of ownedItineraries) {
          if (!itinerary.isPrivate && itinerary.publiclyJoinable) {
            try {
              const requestsResponse = await api.get(`/itineraries/${itinerary._id}/join-requests`)
              
              if (requestsResponse.data.success) {
                const joinRequests = requestsResponse.data.data?.joinRequests || []
                const pendingRequests = joinRequests.filter(req => req.status === 'pending')
                
                if (pendingRequests.length > 0) {
                  foundPending = true
                  break
                }
              }
            } catch (error) {
              console.error(`Error checking join requests for itinerary ${itinerary._id}:`, error)
            }
          }
        }
        
        setHasPendingRequests(foundPending)
      }
    } catch (error) {
      console.error('Error checking for pending join requests:', error)
    }
  }

  function handleLogout() {
    dispatch(logoutUser())
    setProfileDropdownOpen(false)
    setMobileMenuOpen(false)
  }

  // Mobile menu animation variants
  const mobileMenuVariants = {
    closed: { 
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren"
      }
    },
    open: { 
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }

  const mobileItemVariants = {
    closed: { opacity: 0, y: -10 },
    open: { opacity: 1, y: 0 }
  }

  // Profile dropdown animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2 }
    }
  }

  // Nav link style generation helper
  const getNavLinkStyles = (path) => {
    const baseStyles = "flex items-center gap-1 lg:gap-2 group transition-all duration-200 py-1.5 px-2.5 rounded-lg text-sm"
    const activeStyles = "bg-white/20 text-white font-medium"
    const inactiveStyles = "hover:bg-white/10 text-indigo-100 hover:text-white"
    
    return `${baseStyles} ${isActiveRoute(path) ? activeStyles : inactiveStyles}`
  }

  // Mobile nav link style generation
  const getMobileNavLinkStyles = (path) => {
    const baseStyles = "w-full py-2 px-3 rounded-lg flex items-center gap-2"
    const activeStyles = "bg-indigo-600 text-white font-medium"
    const inactiveStyles = "hover:bg-indigo-500 text-white/90"
    
    return `${baseStyles} ${isActiveRoute(path) ? activeStyles : inactiveStyles}`
  }

  return (
    <motion.nav 
      className="sticky top-0 z-50 bg-gradient-to-r from-[#56288A] to-[#864BD8] text-white shadow-md nav-pattern"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-6">
            <Link to="/" className="flex items-center group">
              <motion.div
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <img src={logo} alt="Safar Logo" className="h-8 w-8 sm:h-10 sm:w-10 mr-2" />
              </motion.div>
              <motion.span 
                className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-200"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                Safar
              </motion.span>
            </Link>
            <div className="hidden md:flex space-x-2 lg:space-x-4 ml-4">
              <Link to="/" className={getNavLinkStyles('/')}>
                <Home className={`h-4 w-4 ${isActiveRoute('/') ? 'text-amber-300' : 'group-hover:text-amber-300 transition-colors'}`} />
                <span>Home</span>
              </Link>
              {isAuthenticated && (
                <Link to="/itineraries" className={getNavLinkStyles('/itineraries')}>
                  <Book className={`h-4 w-4 ${isActiveRoute('/itineraries') ? 'text-amber-300' : 'group-hover:text-amber-300 transition-colors'}`} />
                  <span>My Journeys</span>
                </Link>
              )}
              <Link to="/itineraries/explore" className={getNavLinkStyles('/itineraries/explore')}>
                <Globe className={`h-4 w-4 ${isActiveRoute('/itineraries/explore') ? 'text-amber-300' : 'group-hover:text-amber-300 transition-colors'}`} />
                <span>Explore</span>
              </Link>
              <Link to="/about" className={getNavLinkStyles('/about')}>
                <Info className={`h-4 w-4 ${isActiveRoute('/about') ? 'text-amber-300' : 'group-hover:text-amber-300 transition-colors'}`} />
                <span>About</span>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 lg:space-x-4">
                <motion.div 
                  className="glass px-3 py-1.5 rounded-full flex items-center gap-1 lg:gap-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <User className="h-3 w-3 lg:h-4 lg:w-4 text-amber-200" />
                  <span className="text-xs lg:text-sm truncate max-w-[100px] lg:max-w-[150px]">
                    {user?.name || 'User'}
                  </span>
                </motion.div>
                
                {hasPendingRequests && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/itineraries" className="relative inline-block">
                      <Bell className="text-amber-300 w-5 h-5" />
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        !
                      </span>
                    </Link>
                  </motion.div>
                )}
                
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white shadow-md overflow-hidden"
                    aria-label="Settings"
                  >
                    <div className="flex items-center justify-center text-amber-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </motion.button>
                  
                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={dropdownVariants}
                        className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      >
                        <div className="py-1">
                          <Link 
                            to="/profile" 
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-[#56288A]"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Your Profile
                          </Link>
                          <button 
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-2 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md mt-1"
                          >
                            <LogOut className="h-4 w-4 mr-2 text-red-600" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Link 
                  to="/login" 
                  className="flex items-center gap-1.5"
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    icon={<LogIn className="h-3.5 w-3.5 lg:h-4 lg:w-4" />}
                  >
                    <span className="text-xs lg:text-sm">Login</span>
                  </Button>
                </Link>
                
                <Link 
                  to="/register" 
                  className="flex items-center gap-1.5"
                >
                  <Button 
                    variant="glass" 
                    size="sm"
                    icon={<UserPlus className="h-3.5 w-3.5 lg:h-4 lg:w-4" />}
                  >
                    <span className="text-xs lg:text-sm">Sign Up</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-indigo-500 transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileMenuOpen ? 'close' : 'open'}
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden mt-3 overflow-hidden rounded-lg bg-indigo-800 bg-opacity-50 backdrop-blur-sm"
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileMenuVariants}
            >
              <div className="px-2 py-3 space-y-1">
                <motion.div variants={mobileItemVariants}>
                  <Link 
                    to="/" 
                    className={getMobileNavLinkStyles('/')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                </motion.div>
                
                {isAuthenticated && (
                  <motion.div variants={mobileItemVariants}>
                    <Link 
                      to="/itineraries" 
                      className={getMobileNavLinkStyles('/itineraries')}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Book className="h-5 w-5" />
                      <span>My Journeys</span>
                    </Link>
                  </motion.div>
                )}
                
                <motion.div variants={mobileItemVariants}>
                  <Link 
                    to="/itineraries/explore" 
                    className={getMobileNavLinkStyles('/itineraries/explore')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Globe className="h-5 w-5" />
                    <span>Explore</span>
                  </Link>
                </motion.div>
                
                <motion.div variants={mobileItemVariants}>
                  <Link 
                    to="/about" 
                    className={getMobileNavLinkStyles('/about')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Info className="h-5 w-5" />
                    <span>About</span>
                  </Link>
                </motion.div>
                
                <motion.div
                  className="border-t border-white border-opacity-20 my-2 pt-2"
                  variants={mobileItemVariants}
                >
                  {isAuthenticated ? (
                    <>
                      {hasPendingRequests && (
                        <div className="px-3 py-2 flex items-center text-amber-300">
                          <Bell className="h-5 w-5 mr-2" />
                          <span>You have pending join requests</span>
                        </div>
                      )}
                      <Link 
                        to="/profile" 
                        className={getMobileNavLinkStyles('/profile')}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </Link>
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 shadow-sm"
                      >
                        <LogOut className="h-5 w-5 text-white" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2 px-3 pt-2">
                      <Link 
                        to="/login" 
                        className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="h-5 w-5" />
                        <span>Login</span>
                      </Link>
                      
                      <Link 
                        to="/register" 
                        className="w-full py-2.5 px-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg hover:bg-opacity-30 flex items-center justify-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserPlus className="h-5 w-5" />
                        <span>Sign Up</span>
                      </Link>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

export default Navbar 