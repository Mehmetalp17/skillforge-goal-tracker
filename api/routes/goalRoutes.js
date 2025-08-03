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

// In api/routes/goalRoutes.js
router.route('/:id/force')
    .delete(forceDeleteGoal);

// Then add a route in goalRoutes.js
router.route('/batch')
    .post(batchDeleteGoals);

export default router;
