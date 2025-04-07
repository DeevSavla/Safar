import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-planner',
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: '7d'
  },
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Email configuration (for password reset, notifications, etc.)
  email: {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    smtp: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    }
  },
  
  // File upload configurations
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10), // 5MB default
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
  },
  
  // Google Places API
  googlePlacesApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
};

// Validate required configs
const requiredConfigs = ['jwt.secret'];
requiredConfigs.forEach(configKey => {
  if (config.nodeEnv === 'production' && (!config[configKey] || config[configKey] === 'your-secret-key')) {
    console.error(`Error: ${configKey} is required in production environment`);
    process.exit(1);
  }
});

export default config; 