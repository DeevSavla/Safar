import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getCurrentUserProfile, updateUserProfile } from '../services/user'

function Profile() {
  const { user, isAuthenticated } = useSelector(state => state.auth)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Fetch the latest user data when the component mounts
  useEffect(() => {
    setIsLoading(true)
    getCurrentUserProfile()
      .then(userData => {
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          bio: userData.bio || ''
        })
        setIsLoading(false)
      })
      .catch(err => {
        setError('Failed to load profile data')
        setIsLoading(false)
        console.error(err)
      })
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear messages when the user makes changes
    if (error) setError(null)
    if (successMessage) setSuccessMessage('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    
    // Use the update user service to save changes
    updateUserProfile({
      name: profileData.name,
      bio: profileData.bio
    })
      .then(() => {
        setSuccessMessage('Profile updated successfully')
        setIsEditing(false)
        setIsLoading(false)
      })
      .catch(err => {
        setError('Failed to update profile')
        setIsLoading(false)
        console.error(err)
      })
  }

  if (isLoading && !profileData.name) {
    return <div className="text-center py-12">Loading profile data...</div>
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Profile</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              disabled={isLoading}
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="name" 
                className="block text-gray-700 font-medium mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-4">
              <label 
                htmlFor="email" 
                className="block text-gray-700 font-medium mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            
            <div className="mb-6">
              <label 
                htmlFor="bio" 
                className="block text-gray-700 font-medium mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              ></textarea>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-1">Full Name</h3>
              <p className="text-xl">{profileData.name}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-1">Email</h3>
              <p className="text-xl">{profileData.email}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-1">Bio</h3>
              <p className="text-xl">
                {profileData.bio || 'No bio provided yet.'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Trip Stats Section */}
      <div className="bg-white rounded-lg shadow-md p-8 mt-8">
        <h3 className="text-xl font-bold mb-4">Your Travel Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-indigo-600 font-medium">Total Trips</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-indigo-600 font-medium">Countries Visited</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-indigo-600 font-medium">Upcoming Trips</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 