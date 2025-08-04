// api/middleware/rateLimitMiddleware.js
import rateLimit from 'express-rate-limit';
import MongoStore from 'rate-limit-mongo';
import ErrorResponse from '../utils/errorResponse.js';

// Lazy loading function - only creates store when actually needed
const getStore = (options = {}) => {
  if (process.env.NODE_ENV === 'development') {
    return undefined; // Use memory store in development
  }
  
  return new MongoStore({
    uri: process.env.MONGO_URI,
    collectionName: 'rate-limits',
    expireTimeMs: 60 * 60 * 1000, // 1 hour by default
    onError: (err) => {
      console.error('Rate limit MongoDB error:', err);
    },
    ...options
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
  skip: (req, res) => process.env.NODE_ENV === 'development',
  // Use lazy loading
  store: undefined, // Will be set dynamically
  onLimitReached: () => {
    // Initialize store on first use if needed
    if (!aiRateLimiter.store && process.env.NODE_ENV !== 'development') {
      aiRateLimiter.store = getStore();
    }
  }
});

// Default rate limiter for all routes
export const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
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
  store: undefined
});

// Per-user rate limiting
export const userBasedAiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
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
  store: undefined
});

// Initialize stores after environment is loaded (call this in your main app file)
export const initializeRateLimitStores = () => {
  if (process.env.NODE_ENV !== 'development') {
    aiRateLimiter.store = getStore();
    defaultRateLimiter.store = getStore({ expireTimeMs: 15 * 60 * 1000 });
    userBasedAiRateLimiter.store = getStore({ 
      collectionName: 'user-rate-limits',
      expireTimeMs: 60 * 60 * 1000 
    });
  }
};