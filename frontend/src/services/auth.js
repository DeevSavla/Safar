import api from './api'

function login({ email, password }) {
  return api.post('/auth/login', { email, password })
    .then(response => {
      const { token, user } = response.data
      // Store token in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return response.data
    })
}

function register({ name, email, password }) {
  return api.post('/auth/register', { name, email, password })
    .then(response => {
      const { token, user } = response.data
      // Store token in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return response.data
    })
}

function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email })
    .then(response => response.data)
}

function resetPassword({ token, password }) {
  return api.post('/auth/reset-password', { token, password })
    .then(response => response.data)
}

function requestOTP(email) {
  return api.post('/auth/request-otp', { email })
    .then(response => response.data)
}

function verifyOTP(email, otp) {
  return api.post('/auth/verify-otp', { email, otp })
    .then(response => {
      const { token, user } = response.data
      // Store token in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return response.data
    })
}

function refreshToken() {
  const token = localStorage.getItem('token')
  if (!token) return Promise.reject('No refresh token available')
  
  return api.post('/auth/refresh', { token })
    .then(response => {
      const { token: newToken } = response.data
      localStorage.setItem('token', newToken)
      return response.data
    })
}

function logout() {
  // Remove token from localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // Redirect to home page and reload
  window.location.href = '/'
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch (error) {
    return null
  }
}

function isAuthenticated() {
  return !!localStorage.getItem('token')
}

export {
  login,
  register,
  forgotPassword,
  resetPassword,
  requestOTP,
  verifyOTP,
  refreshToken,
  logout,
  getCurrentUser,
  isAuthenticated
} 