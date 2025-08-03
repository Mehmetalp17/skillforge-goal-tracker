// api/routes/aiRoutes.js
import express from 'express';
import { suggestGoals } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { userBasedAiRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Apply rate limiting middleware to AI endpoints
// Using user-based rate limiter instead of IP-based
router.post('/suggest-goals', userBasedAiRateLimiter, suggestGoals);

export default router;