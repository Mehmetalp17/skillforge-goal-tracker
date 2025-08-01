import express from 'express';
import { suggestGoals } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are protected
router.use(protect);

router.post('/suggest-goals', suggestGoals);

export default router;
