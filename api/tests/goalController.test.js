import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
const mockGoal = {
    _id: 'goal-1',
    title: 'Test Goal',
    owner: { toString: () => 'user-1' },
    deleteOne: vi.fn().mockResolvedValue({}),
};

vi.mock('../models/LearningGoal.js', () => ({
    default: {
        findById: vi.fn(),
        find: vi.fn(),
        findByIdAndDelete: vi.fn(),
        countDocuments: vi.fn(),
    },
}));

vi.mock('../middleware/asyncHandler.js', () => ({
    default: (fn) => fn,
}));

vi.mock('../utils/errorResponse.js', () => ({
    default: class ErrorResponse extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    },
}));

import LearningGoal from '../models/LearningGoal.js';
import { forceDeleteGoal, batchDeleteGoals } from '../controllers/goalController.js';

// Helper to build mock req/res/next
const makeReq = (params = {}, body = {}, userId = 'user-1') => ({
    params,
    body,
    user: { id: userId },
});

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

// --- forceDeleteGoal ---
describe('forceDeleteGoal', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 404 when goal is not found', async () => {
        LearningGoal.findById.mockResolvedValue(null);
        const req = makeReq({ id: 'nonexistent' });
        const res = makeRes();
        const next = vi.fn();

        await forceDeleteGoal(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    it('deletes goal and all sub-goals recursively on success', async () => {
        const subGoal = { _id: 'sub-1', owner: { toString: () => 'user-1' } };

        LearningGoal.findById.mockResolvedValue({ ...mockGoal });
        // First find call (sub-goals of root) returns [subGoal], second (sub-goals of subGoal) returns []
        LearningGoal.find
            .mockResolvedValueOnce([subGoal])
            .mockResolvedValueOnce([]);
        LearningGoal.findByIdAndDelete.mockResolvedValue({});

        const req = makeReq({ id: 'goal-1' });
        const res = makeRes();
        const next = vi.fn();

        await forceDeleteGoal(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(LearningGoal.findByIdAndDelete).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
    });
});

// --- batchDeleteGoals ---
describe('batchDeleteGoals', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 400 when goalIds is empty', async () => {
        const req = makeReq({}, { goalIds: [] });
        const res = makeRes();
        const next = vi.fn();

        await batchDeleteGoals(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('deletes goals without sub-goals and reports results', async () => {
        LearningGoal.findById.mockResolvedValue({ ...mockGoal });
        LearningGoal.countDocuments.mockResolvedValue(0);

        const req = makeReq({}, { goalIds: ['goal-1'], forceDelete: false });
        const res = makeRes();
        const next = vi.fn();

        await batchDeleteGoals(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        const json = res.json.mock.calls[0][0];
        expect(json.success).toBe(true);
        expect(json.data.success).toContain('goal-1');
        expect(json.data.failed).toHaveLength(0);
    });
});
