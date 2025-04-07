import axios from "axios";

// Define the API URL with a fallback in case the environment variable is not defined
const API_URL = `${import.meta.env.VITE_NODE_API_URL}/api`;

console.log(API_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Add a method to check API availability
export const checkApiConnection = async () => {
  try {
    // Try to ping the API server
    await axios.get(`${API_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.warn("API server not available:", error.message);
    return false;
  }
};

// Initialize mock server if in development mode
if (import.meta.env.DEV) {
  // Setup a simple health endpoint for testing
  const originalGet = axios.get;

  // Override axios.get for specific routes to provide mock responses
  axios.get = async function (url, config) {
    // If this is a health check and we can't reach the actual server,
    // return a mock success response
    if (url === `${API_URL}/health`) {
      try {
        return await originalGet.call(this, url, config);
      } catch (error) {
        // If the server is unavailable, check if we want to use mock mode
        const useMockMode = localStorage.getItem("useMockMode") === "true";
        if (useMockMode) {
          console.log("Mock server: Health check successful (mock mode)");
          return { data: { status: "ok", mode: "mock" } };
        }
        throw error;
      }
    }

    // For all other requests, use the original method
    return originalGet.call(this, url, config);
  };

  // Add a global flag to check if we're in mock mode
  window.setMockMode = (enabled) => {
    localStorage.setItem("useMockMode", enabled ? "true" : "false");
    window.location.reload();
  };

  // Check if the user has enabled mock mode
  const useMockMode = localStorage.getItem("useMockMode") === "true";
  if (useMockMode) {
    console.info("Mock mode enabled. Backend calls will be simulated.");
    window.itineraryServiceOffline = true;

    // Dispatch event to notify other services
    setTimeout(() => {
      window.dispatchEvent(new Event("api:offline"));
    }, 0);
  }
}

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log the request in development mode
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log network errors in a user-friendly way
    if (error.code === "ERR_NETWORK") {
      console.error(
        "Network Error: Unable to connect to the API server. Please check if the backend is running."
      );

      // In development, suggest enabling mock mode
      if (import.meta.env.DEV) {
        console.info(
          "Tip: You can enable mock mode by running this in the console: window.setMockMode(true)"
        );
      }

      return Promise.reject({
        ...error,
        userMessage:
          "Unable to connect to the server. Please check your internet connection or try again later.",
      });
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh the token
      try {
        const refreshToken = localStorage.getItem("token");
        if (refreshToken) {
          // Create a new instance to avoid circular requests
          const refreshResponse = await axios.post(
            `${API_URL}/auth/refresh`,
            { token: refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          const { token } = refreshResponse.data;
          localStorage.setItem("token", token);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Export the API base URL for use in other parts of the app
export const getApiUrl = () => API_URL;

export default api;
