import { useState, useEffect } from 'react'
import { checkApiConnection } from '../services/api'

function NetworkStatus() {
  const [isApiAvailable, setIsApiAvailable] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Check if we're in mock mode
    const mockMode = localStorage.getItem('useMockMode') === 'true'
    setIsMockMode(mockMode)
    
    // Check if the API is available on initial load
    const checkConnection = async () => {
      const isAvailable = await checkApiConnection()
      setIsApiAvailable(isAvailable)
      
      // If the API is unavailable, show the status banner
      if (!isAvailable) {
        setIsVisible(true)
      }
    }
    
    checkConnection()
    
    // Set up event listeners for connection status changes
    const handleOffline = () => {
      setIsApiAvailable(false)
      setIsVisible(true)
    }
    
    const handleOnline = () => {
      setIsApiAvailable(true)
    }
    
    // Listen for custom event from the API service
    window.addEventListener('api:offline', handleOffline)
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('api:offline', handleOffline)
    }
  }, [])
  
  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null
  }
  
  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50"
        title="Toggle API connection status"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 w-80">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Development Network Status</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isApiAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>API Status: {isApiAvailable ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isMockMode ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          <span>Mock Mode: {isMockMode ? 'Enabled' : 'Disabled'}</span>
        </div>
        
        <div className="border-t pt-3">
          <button
            onClick={() => {
              if (window.setMockMode) {
                window.setMockMode(!isMockMode)
              }
            }}
            className={`w-full py-2 px-4 rounded ${
              isMockMode 
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isMockMode ? 'Disable Mock Mode' : 'Enable Mock Mode'}
          </button>
          
          <p className="text-xs text-gray-500 mt-2">
            {isMockMode 
              ? 'Mock mode simulates API responses for development and testing.' 
              : 'Enable mock mode if the backend server is unavailable.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default NetworkStatus 