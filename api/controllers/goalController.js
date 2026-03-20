import LearningGoal from '../models/LearningGoal.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// BFS helper: returns array of all IDs (roots + descendants)
const collectDescendantIds = async (rootIds) => {
    const allIds = [...rootIds];
    const queue = [...rootIds];

    while (queue.length > 0) {
        const batch = queue.splice(0, queue.length);
        const children = await LearningGoal.find({ parentGoal: { $in: batch } }, '_id').lean();
        for (const child of children) {
            allIds.push(child._id);
            queue.push(child._id);
        }
    }

    return allIds;
};

// @desc    Get all goals for the logged-in user
// @route   GET /api/goals
// @access  Private
export const getGoals = asyncHandler(async (req, res, next) => {
    const goals = await LearningGoal.find({ owner: req.user.id }).lean();
    res.status(200).json({ success: true, count: goals.length, data: goals });
});

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
export const getGoal = asyncHandler(async (req, res, next) => {
    const goal = await LearningGoal.findById(req.params.id).lean();

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
        const parent = await LearningGoal.findById(req.body.parentGoal).lean();
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
    let goal = await LearningGoal.findById(req.params.id).lean();
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
    const goal = await LearningGoal.findById(req.params.id).lean();

    if (!goal) {
        return next(new ErrorResponse(`Goal not found with id of ${req.params.id}`, 404));
    }

    if (goal.owner.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to delete this goal`, 403));
    }

    // BFS: collect root + all descendants, then delete in one shot
    const allIds = await collectDescendantIds([goal._id]);
    await LearningGoal.deleteMany({ _id: { $in: allIds } });

    res.status(200).json({ success: true, data: {} });
});

// @desc    Get all sub-goals for a parent goal
// @route   GET /api/goals/:parentId/subgoals
// @access  Private
export const getSubGoals = asyncHandler(async (req, res, next) => {
    const subGoals = await LearningGoal.find({ owner: req.user.id, parentGoal: req.params.parentId }).lean();
    res.status(200).json({ success: true, count: subGoals.length, data: subGoals });
});

// @desc    Batch delete goals
// @route   DELETE /api/goals/batch
// @access  Private
export const batchDeleteGoals = asyncHandler(async (req, res, next) => {
    const { goalIds, forceDelete } = req.body;

    if (!Array.isArray(goalIds) || goalIds.length === 0) {
        return next(new ErrorResponse('No goal IDs provided', 400));
    }

    const results = { success: [], failed: [] };

    // Fetch all requested goals in one query
    const goals = await LearningGoal.find({ _id: { $in: goalIds } }, '_id owner').lean();
    const foundIds = new Set(goals.map(g => g._id.toString()));

    // Mark not-found IDs as failed
    for (const id of goalIds) {
        if (!foundIds.has(id.toString())) {
            results.failed.push({ id, error: 'Goal not found' });
        }
    }

    // Separate authorized vs unauthorized
    const authorizedGoals = [];
    for (const goal of goals) {
        if (goal.owner.toString() !== req.user.id) {
            results.failed.push({ id: goal._id.toString(), error: 'Not authorized' });
        } else {
            authorizedGoals.push(goal);
        }
    }

    if (authorizedGoals.length === 0) {
        return res.status(200).json({ success: true, data: results });
    }

    const authorizedIds = authorizedGoals.map(g => g._id);

    if (forceDelete) {
        // Collect all descendants via BFS and delete in one shot
        const allIdsToDelete = await collectDescendantIds(authorizedIds);
        await LearningGoal.deleteMany({ _id: { $in: allIdsToDelete } });
        results.success.push(...authorizedIds.map(id => id.toString()));
    } else {
        // Find which authorized goals have children (one aggregation)
        const goalsWithChildren = await LearningGoal.aggregate([
            { $match: { parentGoal: { $in: authorizedIds } } },
            { $group: { _id: '$parentGoal' } }
        ]);
        const blockedIds = new Set(goalsWithChildren.map(g => g._id.toString()));

        const toDelete = [];
        for (const goal of authorizedGoals) {
            const idStr = goal._id.toString();
            if (blockedIds.has(idStr)) {
                results.failed.push({ id: idStr, error: 'Has sub-goals' });
            } else {
                toDelete.push(goal._id);
                results.success.push(idStr);
            }
        }

        if (toDelete.length > 0) {
            await LearningGoal.deleteMany({ _id: { $in: toDelete } });
        }
    }

    res.status(200).json({ success: true, data: results });
});
