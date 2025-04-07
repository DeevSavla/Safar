import Joi from 'joi';

// User registration schema
const registerUserSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: Joi.string().valid(Joi.ref('password'))
    .messages({ 'any.only': 'Passwords must match' })
    .optional(),
  profilePicture: Joi.string().uri().optional()
});

// User login schema
const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Request OTP schema
const requestOTPSchema = Joi.object({
  email: Joi.string().email().required()
});

// Verify OTP schema
const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().required().length(6).pattern(/^\d+$/)
    .message('OTP must be a 6-digit number')
});

// Password reset request schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

// Password reset schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().required().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: Joi.string().valid(Joi.ref('password'))
    .messages({ 'any.only': 'Passwords must match' })
}).with('password', 'confirmPassword');

// User profile update schema
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  profilePicture: Joi.string().uri().allow(null, ''),
  preferences: Joi.object({
    currency: Joi.string().length(3), // e.g., USD, EUR
    language: Joi.string().length(2), // e.g., en, fr
    notifications: Joi.boolean()
  }),
  bio: Joi.string().max(500)
});

// Password change schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword'))
    .messages({ 'any.only': 'Passwords must match' })
}).with('newPassword', 'confirmPassword');

export default {
  registerUser: registerUserSchema,
  loginUser: loginUserSchema,
  requestOTP: requestOTPSchema,
  verifyOTP: verifyOTPSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  updateProfile: updateProfileSchema,
  changePassword: changePasswordSchema
}; 