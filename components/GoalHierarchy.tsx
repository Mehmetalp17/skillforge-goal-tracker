import React, { useState, useEffect, useCallback } from 'react';
import { LearningGoal, GoalStatus, GoalDifficulty } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import * as goalService from '../services/goalService.ts';
import { ChevronDownIcon, EditIcon, DeleteIcon, PlusIcon, SpinnerIcon } from './icons.tsx';
import GoalForm from './GoalForm.tsx';

// Forward declaration of GoalList for use inside GoalItem
let GoalList: React.FC<GoalListProps>;

// ============================================================================
// GoalItem Component
// ============================================================================

interface GoalItemProps {
    goal: LearningGoal;
    allGoalsForForm: LearningGoal[];
    onEdit: (goal: LearningGoal) => void;
    onDelete: (id: string) => void;
    onAddSubGoal: (parentId: string) => void;
    onGoalUpdate: () => void;
}

const statusColors: Record<GoalStatus, string> = {
    [GoalStatus.NotStarted]: 'bg-gray-500',
    [GoalStatus.InProgress]: 'bg-blue-500',
    [GoalStatus.Completed]: 'bg-green-500',
    [GoalStatus.OnHold]: 'bg-yellow-500',
    [GoalStatus.Cancelled]: 'bg-red-500',
};

const difficultyColors: Record<GoalDifficulty, string> = {
    [GoalDifficulty.Easy]: 'text-green-400',
    [GoalDifficulty.Medium]: 'text-yellow-400',
    [GoalDifficulty.Hard]: 'text-orange-400',
    [GoalDifficulty.Expert]: 'text-red-400',
};

const GoalItem = ({ goal, allGoalsForForm, onEdit, onDelete, onAddSubGoal, onGoalUpdate }: GoalItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [subGoals, setSubGoals] = useState<LearningGoal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const fetchSubGoals = useCallback(async () => {
        if (!isExpanded) return;
        setIsLoading(true);
        setError('');
        try {
            const data = await goalService.fetchSubGoals(goal._id, token);
            setSubGoals(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch sub-goals');
        } finally {
            setIsLoading(false);
        }
    }, [isExpanded, goal._id, token]);

    useEffect(() => {
        fetchSubGoals();
    }, [isExpanded, fetchSubGoals]);
    
    const handleSubGoalUpdate = () => {
       fetchSubGoals();
       onGoalUpdate();
    }

    const toggleExpansion = () => {
        setIsExpanded(!isExpanded);
    };

    const progressBg = `linear-gradient(to right, #4f46e5 ${goal.progressPercentage}%, #374151 ${goal.progressPercentage}%)`;

    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/50 shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={toggleExpansion}>
                    <div className="flex items-center space-x-3">
                         <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[goal.status]}`}>
                            {goal.status}
                        </span>
                         <span className={`text-xs font-semibold ${difficultyColors[goal.difficulty]}`}>
                            {goal.difficulty}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 ml-8">{goal.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onAddSubGoal(goal._id)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition"><PlusIcon className="w-5 h-5"/></button>
                    <button onClick={() => onEdit(goal)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDelete(goal._id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-gray-700 rounded-full transition"><DeleteIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="mt-3 ml-8">
                 <div className="h-2 w-full bg-gray-700 rounded-full" style={{ background: progressBg }}></div>
                 <p className="text-xs text-gray-400 text-right mt-1">{goal.progressPercentage}% complete</p>
            </div>
             {isExpanded && (
                <div className="pl-8 pt-4 mt-4 border-t border-gray-700/50">
                    {isLoading && <div className="flex justify-center p-4"><SpinnerIcon /></div>}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {!isLoading && !error && (
                        subGoals.length > 0 ? (
                            <GoalList 
                                goals={subGoals}
                                allGoalsForForm={allGoalsForForm}
                                onGoalUpdate={handleSubGoalUpdate}
                            />
                        ) : (
                            <p className="text-gray-500 italic">No sub-goals yet. Add one!</p>
                        )
                    )}
                </div>
            )}
        </div>
    );
};


// ============================================================================
// GoalList Component (Exported)
// ============================================================================

interface GoalListProps {
    goals: LearningGoal[];
    allGoalsForForm: LearningGoal[];
    onGoalUpdate: () => void;
}

GoalList = ({ goals, allGoalsForForm, onGoalUpdate }) => {
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
            {goals.map(goal => (
                <GoalItem
                    key={goal._id}
                    goal={goal}
                    allGoalsForForm={allGoalsForForm}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddSubGoal={handleAddSubGoal}
                    onGoalUpdate={onGoalUpdate}
                />
            ))}
            
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
