import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, clearError, requestOTP, verifyOTP } from '../store/slices/authSlice'

function Login() {
  const [loginMethod, setLoginMethod] = useState('password') // 'password' or 'otp'
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [otp, setOtp] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  
  const { isLoading, error } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (error) dispatch(clearError())
  }

  function handleOtpChange(e) {
    setOtp(e.target.value)
    if (error) dispatch(clearError())
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (loginMethod === 'password') {
      dispatch(loginUser(credentials))
        .unwrap()
        .then(() => {
          navigate('/')
        })
        .catch(() => {
          // Error is handled by the auth slice
        })
    } else if (loginMethod === 'otp' && otpRequested) {
      dispatch(verifyOTP({ email: credentials.email, otp }))
        .unwrap()
        .then(() => {
          navigate('/')
        })
        .catch(() => {
          // Error is handled by the auth slice
        })
    }
  }

  function handleRequestOTP() {
    dispatch(requestOTP({ email: credentials.email }))
      .unwrap()
      .then(() => {
        setOtpRequested(true)
      })
      .catch(() => {
        // Error is handled by the auth slice
      })
  }

  function toggleLoginMethod(method) {
    setLoginMethod(method)
    setOtpRequested(false)
    setOtp('')
    if (error) dispatch(clearError())
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Welcome Back
        </h2>
        
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                loginMethod === 'password' 
                  ? 'bg-white shadow-sm text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => toggleLoginMethod('password')}
            >
              Password
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                loginMethod === 'otp' 
                  ? 'bg-white shadow-sm text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => toggleLoginMethod('otp')}
            >
              OTP Login
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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
              value={credentials.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {loginMethod === 'password' ? (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label 
                  htmlFor="password" 
                  className="block text-gray-700 font-medium"
                >
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          ) : (
            <div className="mb-6">
              {!otpRequested ? (
                <div>
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    className="w-full bg-[#56288A] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#864BD8] focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:ring-offset-2"
                    disabled={isLoading || !credentials.email}
                  >
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    We'll send a one-time password to your email
                  </p>
                </div>
              ) : (
                <div>
                  <label 
                    htmlFor="otp" 
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={otp}
                    onChange={handleOtpChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56288A]"
                    required
                    maxLength={6}
                    placeholder="Enter your 6-digit code"
                  />
                  <button 
                    type="button"
                    className="text-sm text-[#56288A] hover:underline mt-2"
                    onClick={handleRequestOTP}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                </div>
              )}
            </div>
          )}
          
          {(loginMethod === 'password' || (loginMethod === 'otp' && otpRequested)) && (
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          )}
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-indigo-600 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login 