import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import About from './pages/About'
import Itineraries from './pages/Itineraries'
import CreateItinerary from './pages/CreateItinerary'
import ItineraryDetails from './pages/ItineraryDetails'
import DayPlanner from './pages/DayPlanner'
import PlaceSearch from './pages/PlaceSearch'
import ExploreItineraries from './pages/ExploreItineraries'
import LegalDocsPage from './pages/LegalDocsPage'
import api from './services/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkPendingJoinRequests = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Get all itineraries the user owns
      const response = await api.get('/itineraries', { params: { role: 'owner' } });
      
      if (response.data.success) {
        const itineraries = response.data.data.itineraries || [];
        
        // Check each itinerary for pending join requests
        for (const itinerary of itineraries) {
          if (!itinerary.isPrivate && itinerary.publiclyJoinable) {
            const requestsResponse = await api.get(`/itineraries/${itinerary._id}/join-requests`);
            
            if (requestsResponse.data.success) {
              const joinRequests = requestsResponse.data.data.joinRequests || [];
              const pendingRequests = joinRequests.filter(req => req.status === 'pending');
              
              if (pendingRequests.length > 0) {
                toast.info(`You have ${pendingRequests.length} pending join request(s) for "${itinerary.title}"`);
                break; // Show only one notification to avoid spamming
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for pending join requests:', error);
    }
  };

  useEffect(() => {
    checkPendingJoinRequests()
  }, [isAuthenticated])

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="profile" element={<Profile />} />
            <Route path="about" element={<About />} />
            <Route path="itineraries" element={<Itineraries />} />
            <Route path="itineraries/new" element={<CreateItinerary />} />
            <Route path="itineraries/:id" element={<ItineraryDetails />} />
            <Route path="itineraries/:id/days/:dayId" element={<DayPlanner />} />
            <Route path="places/search" element={<PlaceSearch />} />
            <Route path="itineraries/explore" element={<ExploreItineraries />} />
            <Route path="travel-documents" element={<LegalDocsPage />} />
            {/* Additional routes will be added in future phases */}
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
