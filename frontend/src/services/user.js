import api from './api'

function getCurrentUserProfile() {
  return api.get('/users/me')
    .then(response => response.data)
}

function updateUserProfile(userData) {
  return api.patch('/users/me', userData)
    .then(response => {
      // Update the user data in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = { ...currentUser, ...response.data }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      return response.data
    })
}

export {
  getCurrentUserProfile,
  updateUserProfile
} 