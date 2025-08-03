// api/middleware/rateLimitMiddleware.js
import rateLimit from 'express-rate-limit';
import MongoStore from 'rate-limit-mongo';
import ErrorResponse from '../utils/errorResponse.js';

// Create a function that generates a MongoDB store
// This ensures the MONGO_URI from process.env is available when needed
const createMongoStore = (options = {}) => {
  // Only create the store if we're not in development mode
  if (process.env.NODE_ENV === 'development') {
    return undefined; // Use memory store in development
  }
  
  return new MongoStore({
    uri: process.env.MONGO_URI, // This will be available when the function is called
    collectionName: 'rate-limits',
    expireTimeMs: 60 * 60 * 1000, // 1 hour by default
    onError: (err) => {
      console.error('Rate limit MongoDB error:', err);
      // Continue without failing the app
    },
    ...options // Allow overriding defaults
  });
};

// Create a limiter for AI endpoints
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 15, // limit each user to 15 requests per hour
  message: {
    success: false,
    error: 'Too many AI requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new ErrorResponse(options.message.error, 429));
  },
  // Skip rate limiting in development mode
  skip: (req, res) => process.env.NODE_ENV === 'development',
  // Create the store dynamically
  store: process.env.NODE_ENV !== 'development' ? 
    createMongoStore() : undefined
});

// Default rate limiter for all routes
export const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new ErrorResponse(options.message.error, 429));
  },
  skip: (req, res) => process.env.NODE_ENV === 'development',
  // Create the store dynamically with different expiration
  store: process.env.NODE_ENV !== 'development' ? 
    createMongoStore({ expireTimeMs: 15 * 60 * 1000 }) : undefined
});

// Per-user rate limiting
export const userBasedAiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 15, // limit each user to 15 requests per hour
  // Use the user ID as the rate limit key
  keyGenerator: (req) => req.user.id,
  message: {
    success: false, 
    error: 'You have exceeded your hourly AI request limit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new ErrorResponse(options.message.error, 429));
  },
  skip: (req, res) => process.env.NODE_ENV === 'development',
  // Create the store dynamically with a different collection name
  store: process.env.NODE_ENV !== 'development' ? 
    createMongoStore({ collectionName: 'user-rate-limits' }) : undefined
});