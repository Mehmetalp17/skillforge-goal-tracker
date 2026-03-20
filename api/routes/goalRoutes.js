import express from 'express';
import {
    getGoals,
    getGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    getSubGoals,
    forceDeleteGoal,
    batchDeleteGoals // Import this
} from '../controllers/goalController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

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

router.route('/:id/force')
    .delete(authorize('manager'), forceDeleteGoal);

router.route('/batch')
    .post(authorize('manager'), batchDeleteGoals);

export default router;
