import LearningGoal from '../models/LearningGoal.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get all goals for the logged-in user
// @route   GET /api/goals
// @access  Private
export const getGoals = asyncHandler(async (req, res, next) => {
    const goals = await LearningGoal.find({ owner: req.user.id });
    res.status(200).json({ success: true, count: goals.length, data: goals });
});

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
export const getGoal = asyncHandler(async (req, res, next) => {
    const goal = await LearningGoal.findById(req.params.id);

    if (!goal) {
        return next(new ErrorResponse(`Goal not found with id of ${req.params.id}`, 404));
    }
    if (goal.owner.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to access this goal`, 403));
    }
    res.status(200).json({ success: true, data: goal });
});

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
export const createGoal = asyncHandler(async (req, res, next) => {
    req.body.owner = req.user.id;
    
    // If parentGoal is provided, ensure it exists and belongs to the user
    if (req.body.parentGoal) {
        const parent = await LearningGoal.findById(req.body.parentGoal);
        if (!parent || parent.owner.toString() !== req.user.id) {
            return next(new ErrorResponse('Invalid parent goal specified', 400));
        }
    }
    
    const goal = await LearningGoal.create(req.body);
    res.status(201).json({ success: true, data: goal });
});

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = asyncHandler(async (req, res, next) => {
    let goal = await LearningGoal.findById(req.params.id);
    if (!goal) {
        return next(new ErrorResponse(`Goal not found with id of ${req.params.id}`, 404));
    }
    if (goal.owner.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to update this goal`, 403));
    }

    goal = await LearningGoal.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    res.status(200).json({ success: true, data: goal });
});

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = asyncHandler(async (req, res, next) => {
    const goal = await LearningGoal.findById(req.params.id);
    if (!goal) {
        return next(new ErrorResponse(`Goal not found with id of ${req.params.id}`, 404));
    }
    if (goal.owner.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to delete this goal`, 403));
    }
    
    // Business Logic: Prevent deletion if the goal has active sub-goals.
    const subGoalCount = await LearningGoal.countDocuments({ parentGoal: req.params.id });
    if (subGoalCount > 0) {
        return next(new ErrorResponse('Cannot delete a goal that has sub-goals. Please delete or reassign them first.', 400));
    }

    await goal.deleteOne();
    res.status(200).json({ success: true, data: {} });
});

// @desc    Force delete goal and all its sub-goals
// @route   DELETE /api/goals/:id/force
// @access  Private
export const forceDeleteGoal = asyncHandler(async (req, res, next) => {
    const goal = await LearningGoal.findById(req.params.id);
    
    if (!goal) {
        return next(new ErrorResponse(`Goal not found with id of ${req.params.id}`, 404));
    }
    
    if (goal.owner.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to delete this goal`, 403));
    }
    
    // Function to recursively delete a goal and all its sub-goals
    const recursiveDelete = async (goalId) => {
        // Get all sub-goals
        const subGoals = await LearningGoal.find({ parentGoal: goalId });
        
        // Delete all sub-goals recursively
        for (const subGoal of subGoals) {
            await recursiveDelete(subGoal._id);
        }
        
        // Delete the goal itself
        await LearningGoal.findByIdAndDelete(goalId);
    };
    
    // Start the recursive deletion
    await recursiveDelete(req.params.id);
    
    res.status(200).json({ success: true, data: {} });
});

// @desc    Get all sub-goals for a parent goal
// @route   GET /api/goals/:parentId/subgoals
// @access  Private
export const getSubGoals = asyncHandler(async (req, res, next) => {
    const subGoals = await LearningGoal.find({ owner: req.user.id, parentGoal: req.params.parentId });
    res.status(200).json({ success: true, count: subGoals.length, data: subGoals });
});


// In goalController.js
export const batchDeleteGoals = asyncHandler(async (req, res, next) => {
    const { goalIds, forceDelete } = req.body;
    
    if (!Array.isArray(goalIds) || goalIds.length === 0) {
        return next(new ErrorResponse('No goal IDs provided', 400));
    }
    
    const results = {
        success: [],
        failed: []
    };
    
    for (const goalId of goalIds) {
        try {
            const goal = await LearningGoal.findById(goalId);
            
            if (!goal) {
                results.failed.push({id: goalId, error: 'Goal not found'});
                continue;
            }
            
            if (goal.owner.toString() !== req.user.id) {
                results.failed.push({id: goalId, error: 'Not authorized'});
                continue;
            }
            
            const subGoalCount = await LearningGoal.countDocuments({ parentGoal: goalId });
            
            if (subGoalCount > 0 && !forceDelete) {
                results.failed.push({id: goalId, error: 'Has sub-goals'});
                continue;
            }
            
            if (forceDelete) {
                // Use the recursive delete function
                await recursiveDelete(goalId);
            } else {
                await goal.deleteOne();
            }
            
            results.success.push(goalId);
        } catch (err) {
            results.failed.push({id: goalId, error: err.message});
        }
    }
    
    res.status(200).json({
        success: true,
        data: results
    });
});