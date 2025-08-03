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
    // In GoalList.tsx, add these state variables
    const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    const handleEdit = (goal: LearningGoal) => {
        setGoalToEdit(goal);
        setCurrentParentId(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
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
            goalToEdit={goalToEdit}
            parentId={currentParentId}
            allGoals={allGoalsForForm}
          />
        </div>
      );
};

export default GoalList;