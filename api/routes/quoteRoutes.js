import express from 'express';
import { getDailyQuote } from '../controllers/quoteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected route
router.get('/daily', protect, getDailyQuote);

export default router;