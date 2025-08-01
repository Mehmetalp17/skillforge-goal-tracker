import express from 'express';
import {
    getGoals,
    getGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    getSubGoals
} from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(getGoals)
    .post(createGoal);

router.route('/:id')
    .get(getGoal)
    .put(updateGoal)
    .delete(deleteGoal);
    
router.route('/:parentId/subgoals')
    .get(getSubGoals);

export default router;
