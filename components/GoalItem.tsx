import React, { useState, useEffect, useCallback } from 'react';
import { LearningGoal, GoalStatus, GoalDifficulty } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import * as goalService from '../services/goalService.ts';
import { ChevronDownIcon, EditIcon, DeleteIcon, PlusIcon, SpinnerIcon } from './icons.tsx';
import GoalList from './GoalList.tsx';

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
    const [showDetails, setShowDetails] = useState(false);
    const { token } = useAuth();

    const toggleDetails = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the expansion toggle
        setShowDetails(!showDetails);
    };

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
                    <button onClick={(e) => toggleDetails(e)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button onClick={() => onAddSubGoal(goal._id)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition"><PlusIcon className="w-5 h-5"/></button>
                    <button onClick={() => onEdit(goal)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDelete(goal._id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-gray-700 rounded-full transition"><DeleteIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="mt-3 ml-8">
                 <div className="h-2 w-full bg-gray-700 rounded-full" style={{ background: progressBg }}></div>
                 <p className="text-xs text-gray-400 text-right mt-1">{goal.progressPercentage}% complete</p>
            </div>
            
            {showDetails && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h4 className="text-md font-semibold text-white mb-2">Goal Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400">Start Date:</p>
                            <p className="text-white">{new Date(goal.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Target End Date:</p>
                            <p className="text-white">{new Date(goal.targetEndDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Status:</p>
                            <p className="text-white">{goal.status}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Difficulty:</p>
                            <p className="text-white">{goal.difficulty}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-400">Progress:</p>
                            <div className="h-2 w-full bg-gray-700 rounded-full mt-1" style={{ background: progressBg }}></div>
                            <p className="text-xs text-gray-400 text-right mt-1">{goal.progressPercentage}% complete</p>
                        </div>
                        {goal.notes && (
                            <div className="col-span-2">
                                <p className="text-gray-400">Notes:</p>
                                <p className="text-white">{goal.notes}</p>
                            </div>
                        )}
                        <div className="col-span-2">
                            <p className="text-gray-400">Created:</p>
                            <p className="text-white">{new Date(goal.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={(e) => toggleDetails(e)} 
                        className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
                    >
                        Close Details
                    </button>
                </div>
            )}
             
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

export default GoalItem;