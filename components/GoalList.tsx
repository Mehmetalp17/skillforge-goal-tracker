import React, { useState } from 'react';
import { LearningGoal } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import * as goalService from '../services/goalService.ts';
import GoalItem from './GoalItem.tsx';
import GoalForm from './GoalForm.tsx';

interface GoalListProps {
    goals: LearningGoal[];
    allGoalsForForm: LearningGoal[];
    onGoalUpdate: () => void;
}

const GoalList: React.FC<GoalListProps> = ({ goals, allGoalsForForm, onGoalUpdate }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [goalToEdit, setGoalToEdit] = useState<LearningGoal | null>(null);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    const handleEdit = (goal: LearningGoal) => {
        setGoalToEdit(goal);
        setCurrentParentId(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
            try {
                await goalService.deleteGoal(id, token);
                onGoalUpdate();
            } catch (err: any) {
                setError(err.message || 'Failed to delete goal.');
                setTimeout(() => setError(null), 5000);
            }
        }
    };

    const handleAddSubGoal = (parentId: string) => {
        setGoalToEdit(null);
        setCurrentParentId(parentId);
        setIsFormOpen(true);
    };
    
    const handleSaveGoal = async (goalData: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'> | LearningGoal) => {
        try {
            if ('_id' in goalData) {
                await goalService.updateGoal(goalData._id, goalData, token);
            } else {
                await goalService.createGoal(goalData, token);
            }
            onGoalUpdate();
            setIsFormOpen(false); // Close form on success
        } catch (err: any) {
            setError(err.message || 'Failed to save the goal.');
            setTimeout(() => setError(null), 5000);
        }
    };

    return (
        <div className="space-y-4">
            {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md text-center">{error}</p>}
            {goals.map(goal => {
    // By using this pattern, React gets the key but it's not passed to the component props
    return (
        <React.Fragment key={goal._id}>
            <GoalItem
                goal={goal}
                allGoalsForForm={allGoalsForForm}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddSubGoal={handleAddSubGoal}
                onGoalUpdate={onGoalUpdate}
            />
        </React.Fragment>
        );
    })}
            
            <GoalForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveGoal}
                goalToEdit={goalToEdit}
                parentId={currentParentId}
                allGoals={allGoalsForForm}
            />
        </div>
    );
};

export default GoalList;