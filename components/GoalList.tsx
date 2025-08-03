import React, { useState } from 'react';
import { LearningGoal, GoalStatus, GoalDifficulty, SuggestedGoal } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import * as goalService from '../services/goalService.ts';
import GoalItem from './GoalItem.tsx';
import GoalForm from './GoalForm.tsx';

interface GoalListProps {
    goals: LearningGoal[];
    allGoalsForForm: LearningGoal[];
    onGoalUpdate: () => void;
    onEdit?: (goal: LearningGoal) => void;
    onDelete?: (id: string) => void;
    onAddSubGoal?: (parentId: string) => void;
    isSelectionMode?: boolean;
    selectedGoalIds?: string[];
    onToggleSelection?: (id: string) => void;
    onSaveWithSubtasks?: (goal: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'> | LearningGoal, subtasks: SuggestedGoal[]) => Promise<void>;
}

const GoalList: React.FC<GoalListProps> = ({ 
    goals, 
    allGoalsForForm, 
    onGoalUpdate,
    onEdit: parentOnEdit,
    onDelete: parentOnDelete,
    onAddSubGoal: parentOnAddSubGoal,
    isSelectionMode: parentIsSelectionMode = false,
    selectedGoalIds: parentSelectedGoalIds = [],
    onToggleSelection: parentOnToggleSelection,
    onSaveWithSubtasks: parentOnSaveWithSubtasks
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [goalToEdit, setGoalToEdit] = useState<LearningGoal | null>(null);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    const handleEdit = (goal: LearningGoal) => {
        if (parentOnEdit) {
            parentOnEdit(goal);
        } else {
            setGoalToEdit(goal);
            setCurrentParentId(null);
            setIsFormOpen(true);
        }
    };

    const handleDelete = async (id: string) => {
        if (parentOnDelete) {
            parentOnDelete(id);
        } else {
            const confirmation = window.confirm('Are you sure you want to delete this goal? This action cannot be undone.');
            
            if (!confirmation) return;
            
            try {
                // First attempt to delete
                await goalService.deleteGoal(id, token);
                onGoalUpdate();
            } catch (err: any) {
                // If error contains message about sub-goals
                if (err.message && err.message.includes('sub-goals')) {
                    const cascadeConfirmation = window.confirm(
                        'This goal has sub-goals. Deleting it will also delete all of its sub-goals. Are you absolutely sure?'
                    );
                    
                    if (cascadeConfirmation) {
                        // Call a different endpoint that forces deletion
                        await goalService.forceDeleteGoal(id, token);
                        onGoalUpdate();
                    }
                } else {
                    // Regular error handling
                    setError(err.message || 'Failed to delete goal.');
                    setTimeout(() => setError(null), 5000);
                }
            }
        }
    };

    const handleAddSubGoal = (parentId: string) => {
        if (parentOnAddSubGoal) {
            parentOnAddSubGoal(parentId);
        } else {
            setGoalToEdit(null);
            setCurrentParentId(parentId);
            setIsFormOpen(true);
        }
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

    const handleBatchDelete = async () => {
        if (selectedGoalIds.length === 0) return;
        
        const confirmation = window.confirm(
          `Are you sure you want to delete ${selectedGoalIds.length} selected goal(s)? This action cannot be undone.`
        );
        
        if (!confirmation) return;
        
        setError(null);
        
        try {
          // Option 1: Sequential deletion
          for (const id of selectedGoalIds) {
            try {
              await goalService.deleteGoal(id, token);
            } catch (err: any) {
              // If error contains message about sub-goals
              if (err.message && err.message.includes('sub-goals')) {
                const cascadeConfirmation = window.confirm(
                  `Goal with ID ${id} has sub-goals. Delete it and all its sub-goals?`
                );
                
                if (cascadeConfirmation) {
                  await goalService.forceDeleteGoal(id, token);
                }
              } else {
                throw err; // Re-throw other errors
              }
            }
          }
          
          // Option 2: Create a new batch delete endpoint on the backend
          // await goalService.batchDeleteGoals(selectedGoalIds, token);
          
          onGoalUpdate();
          setSelectedGoalIds([]);
          setIsSelectionMode(false);
        } catch (err: any) {
          setError(err.message || 'Failed to delete selected goals.');
          setTimeout(() => setError(null), 5000);
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedGoalIds([]); // Clear selections when toggling mode
    };
      
    const toggleGoalSelection = (goalId: string) => {
        setSelectedGoalIds(prev => 
          prev.includes(goalId) 
            ? prev.filter(id => id !== goalId) 
            : [...prev, goalId]
        );
    };
      
    const selectAllGoals = () => {
        setSelectedGoalIds(goals.map(goal => goal._id));
    };
      
    const clearSelection = () => {
        setSelectedGoalIds([]);
    };

    const handleSaveGoalWithSubtasks = async (
        goalData: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'> | LearningGoal, 
        subtasks: SuggestedGoal[]
    ) => {
        try {
            // If we have a dedicated handler from parent component, use it
            if (parentOnSaveWithSubtasks) {
                await parentOnSaveWithSubtasks(goalData, subtasks);
            } else {
                // Otherwise, implement the functionality here
                let parentGoalId;
                
                // Check if this is an existing goal or a new one
                if ('_id' in goalData) {
                    // This is an existing goal, use its ID directly
                    parentGoalId = goalData._id;
                    // Update the existing goal
                    await goalService.updateGoal(goalData._id, goalData, token);
                } else {
                    // This is a new goal, create it first
                    const newGoal = await goalService.createGoal(goalData, token);
                    parentGoalId = newGoal._id;
                }
                
                // Calculate date ranges for better distribution
                const startDate = new Date(goalData.startDate);
                const endDate = new Date(goalData.targetEndDate);
                const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                
                // How many days to allocate per subtask (minimum 1 day)
                const daysPerSubtask = Math.max(1, Math.floor(totalDays / subtasks.length));
                
                // Create subtasks with appropriate dates and parent reference
                const subtaskPromises = subtasks
                    .sort((a, b) => {
                        // Sorting logic (same as in DashboardPage)
                        if (a.suggestedStartDate && b.suggestedStartDate) {
                            return new Date(a.suggestedStartDate).getTime() - new Date(b.suggestedStartDate).getTime();
                        } else if (a.suggestedStartDate) {
                            return -1;
                        } else if (b.suggestedStartDate) {
                            return 1;
                        }
                        return 0;
                    })
                    .map((subtask, index) => {
                        // Calculate dates (similar to DashboardPage)
                        let subtaskStartDate, subtaskEndDate;
                        
                        if (subtask.suggestedStartDate && subtask.suggestedEndDate) {
                            subtaskStartDate = new Date(subtask.suggestedStartDate);
                            subtaskEndDate = new Date(subtask.suggestedEndDate);
                        } else {
                            // Calculate based on index
                            subtaskStartDate = new Date(startDate);
                            subtaskStartDate.setDate(startDate.getDate() + (index * daysPerSubtask));
                            
                            subtaskEndDate = new Date(subtaskStartDate);
                            if (index === subtasks.length - 1) {
                                subtaskEndDate = new Date(endDate);
                            } else {
                                subtaskEndDate.setDate(subtaskStartDate.getDate() + daysPerSubtask - 1);
                            }
                        }
                        
                        const formattedStartDate = subtaskStartDate.toISOString().split('T')[0];
                        const formattedEndDate = subtaskEndDate.toISOString().split('T')[0];
                        
                        // Create the subtask
                        const dateRange = `(${formattedStartDate} to ${formattedEndDate})`;
                        return goalService.createGoal({
                            title: subtask.title,
                            description: `${dateRange} ${subtask.description}`,
                            difficulty: subtask.difficulty,
                            status: GoalStatus.NotStarted,
                            startDate: formattedStartDate,
                            targetEndDate: formattedEndDate,
                            progressPercentage: 0,
                            parentGoal: parentGoalId,
                            isArchived: false,
                        }, token);
                    });
                
                await Promise.all(subtaskPromises);
            }
            
            onGoalUpdate();
            setIsFormOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save goal with subtasks.');
            setTimeout(() => setError(null), 5000);
        }
    };

    return (
        <div className="space-y-4">
            {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md text-center">{error}</p>}
            
            <div className="flex justify-between items-center mb-4">
                <button
                onClick={toggleSelectionMode}
                className={`px-3 py-1.5 rounded-md transition ${
                    isSelectionMode 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                >
                {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
                </button>
                
                {isSelectionMode && (
                <div className="flex space-x-2">
                    <button
                    onClick={selectAllGoals}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
                    >
                    Select All
                    </button>
                    
                    <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
                    disabled={selectedGoalIds.length === 0}
                    >
                    Clear
                    </button>
                    
                    <button
                    onClick={handleBatchDelete}
                    className="px-3 py-1.5 bg-red-700 text-white rounded-md hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedGoalIds.length === 0}
                    >
                    Delete Selected ({selectedGoalIds.length})
                    </button>
                </div>
                )}
            </div>
            
            {goals.map(goal => {
                return (
                <React.Fragment key={goal._id}>
                    <GoalItem
                    goal={goal}
                    allGoalsForForm={allGoalsForForm}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddSubGoal={handleAddSubGoal}
                    onGoalUpdate={onGoalUpdate}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedGoalIds.includes(goal._id)}
                    onToggleSelection={() => toggleGoalSelection(goal._id)}
                    selectedGoalIds={selectedGoalIds}
                    />
                </React.Fragment>
                );
            })}
            
            <GoalForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveGoal}
                onSaveWithSubtasks={handleSaveGoalWithSubtasks}
                goalToEdit={goalToEdit}
                parentId={currentParentId}
                allGoals={allGoalsForForm}
            />
        </div>
    );
};

export default GoalList;