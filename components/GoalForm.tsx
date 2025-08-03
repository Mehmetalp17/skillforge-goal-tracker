import React, { useState, useEffect } from 'react';
import { LearningGoal, GoalStatus, GoalDifficulty, SuggestedGoal } from '../types.ts';
import { SpinnerIcon, SparklesIcon } from './icons.tsx';
import * as aiService from '../services/aiService.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface GoalFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goalData: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'> | LearningGoal) => Promise<void>;
    goalToEdit?: LearningGoal | null;
    parentId?: string | null;
    allGoals: LearningGoal[];
    onSaveWithSubtasks?: (goal: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'> | LearningGoal, subtasks: SuggestedGoal[]) => Promise<void>;
}

const GoalForm = ({ isOpen, onClose, onSave, goalToEdit, parentId = null, allGoals, onSaveWithSubtasks }: GoalFormProps) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        targetEndDate: '',
        status: GoalStatus.NotStarted,
        progressPercentage: 0,
        difficulty: GoalDifficulty.Medium,
        parentGoal: parentId,
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubtasks, setShowSubtasks] = useState(false);
    const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
    const [suggestedSubtasks, setSuggestedSubtasks] = useState<SuggestedGoal[]>([]);
    const [selectedSubtasks, setSelectedSubtasks] = useState<number[]>([]);
    const [subtaskError, setSubtaskError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (goalToEdit) {
            setFormData({
                title: goalToEdit.title,
                description: goalToEdit.description,
                startDate: new Date(goalToEdit.startDate).toISOString().split('T')[0],
                targetEndDate: new Date(goalToEdit.targetEndDate).toISOString().split('T')[0],
                status: goalToEdit.status,
                progressPercentage: goalToEdit.progressPercentage,
                difficulty: goalToEdit.difficulty,
                parentGoal: goalToEdit.parentGoal,
                notes: goalToEdit.notes || '',
            });
        } else {
            // Reset for new goal form
             setFormData({
                title: '',
                description: '',
                startDate: new Date().toISOString().split('T')[0],
                targetEndDate: '',
                status: GoalStatus.NotStarted,
                progressPercentage: 0,
                difficulty: GoalDifficulty.Medium,
                parentGoal: parentId,
                notes: '',
            });
        }
        // Reset subtask state when form opens/closes
        setShowSubtasks(false);
        setSuggestedSubtasks([]);
        setSelectedSubtasks([]);
        setSubtaskError('');
    }, [goalToEdit, parentId, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'progressPercentage' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const goalData = {
            ...formData,
            isArchived: false,
        };
        
        try {
            if (goalToEdit) {
                await onSave({ ...goalToEdit, ...goalData });
            } else {
                await onSave(goalData);
            }
            setIsSubmitting(false);
            onClose();
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    const handleGenerateSubtasks = async () => {
        if (!formData.title || !formData.description || !formData.startDate || !formData.targetEndDate) {
            setSubtaskError('Please fill in the title, description, start date and target end date first.');
            return;
        }

        setIsGeneratingSubtasks(true);
        setSubtaskError('');

        try {
            let prompt;
            
            if (goalToEdit) {
                // Special prompt for breaking down an existing subtask
                prompt = `Break down this specific subtask: "${goalToEdit.title}" into 3-5 more detailed, actionable steps.
                    
                    Context about this subtask: ${goalToEdit.description}
                    
                    These detailed steps should span from ${formData.startDate} to ${formData.targetEndDate} 
                    and represent a clear progression toward completing this specific subtask.
                    
                    For each detailed step:
                    1. Create a concise but descriptive title (what to do)
                    2. Add a detailed but brief description (how to do it, under 200 characters)
                    3. Assign an appropriate difficulty (Easy, Medium, Hard, or Expert)
                    4. Suggest realistic start and end dates within the parent timeframe
                    
                    Ensure each step is concrete, specific, immediately actionable, and builds logically on previous steps.`;
            } else {
                // Original prompt for new goals
                prompt = `Generate progressive subtasks for this goal: "${formData.title}". 
                    Description: ${formData.description}. 
                    The subtasks should span from ${formData.startDate} to ${formData.targetEndDate} 
                    and show a clear progression toward completing the main goal.
                    Create tasks that build on each other and represent a logical progression.
                    Each subtask should be concrete, specific, and achievable within a few days.`;
            }

            const results = await aiService.fetchSuggestedGoals(prompt, token);
            setSuggestedSubtasks(results);
            setShowSubtasks(true);
            // Select all subtasks by default
            setSelectedSubtasks(results.map((_, index) => index));
        } catch (err: any) {
            setSubtaskError(err.message || 'Failed to generate subtasks.');
        } finally {
            setIsGeneratingSubtasks(false);
        }
    };

    const handleToggleSubtask = (index: number) => {
        setSelectedSubtasks(prev => 
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleSaveWithSubtasks = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const goalData = {
            ...formData,
            isArchived: false,
        };
    
        try {
            // Get selected subtasks
            const selectedTasks = selectedSubtasks.map(index => suggestedSubtasks[index]);
            
            // Sort the selected tasks by date
            const sortedSelectedTasks = [...selectedTasks].sort((a, b) => {
                // Sorting logic remains the same
                if (a.suggestedStartDate && b.suggestedStartDate) {
                    return new Date(a.suggestedStartDate).getTime() - new Date(b.suggestedStartDate).getTime();
                } else if (a.suggestedStartDate) {
                    return -1;
                } else if (b.suggestedStartDate) {
                    return 1;
                }
                return 0;
            });
            
            if (goalToEdit) {
                // First update the existing goal
                await onSave({ ...goalToEdit, ...goalData });
                
                // Then add the subtasks to the existing goal if there are any selected
                if (onSaveWithSubtasks && sortedSelectedTasks.length > 0) {
                    await onSaveWithSubtasks({ ...goalData, _id: goalToEdit._id }, sortedSelectedTasks);
                }
            } else {
                // This is a new goal, create it with subtasks
                if (onSaveWithSubtasks) {
                    await onSaveWithSubtasks(goalData, sortedSelectedTasks);
                }
            }
            
            setIsSubmitting(false);
            onClose();
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };
    if (!isOpen) return null;
    
    // Prevent selecting a goal and its descendants as its own parent
    const getDescendants = (goalId: string): string[] => {
      let descendants: string[] = [];
      const children = allGoals.filter(g => g.parentGoal === goalId);
      for(const child of children) {
        descendants.push(child._id);
        descendants = [...descendants, ...getDescendants(child._id)];
      }
      return descendants;
    }
    

    const unselectableParentIds = goalToEdit ? [goalToEdit._id, ...getDescendants(goalToEdit._id)] : [];
    const availableParents = allGoals.filter(g => !unselectableParentIds.includes(g._id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-4">{goalToEdit ? 'Edit Goal' : 'Create New Goal'}</h2>
                
                {goalToEdit && (
                    <div className="text-indigo-300 bg-indigo-900/30 p-3 rounded-md mb-4">
                        <h3 className="font-medium mb-1">Editing: {goalToEdit.title}</h3>
                        <p className="text-sm">
                            Tip: Use the "Break Down with AI" button to automatically generate more detailed subtasks for this goal.
                        </p>
                    </div>
                )}
                
                <form onSubmit={showSubtasks ? handleSaveWithSubtasks : handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
                        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Start Date</label>
                            <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white" />
                        </div>
                        <div>
                            <label htmlFor="targetEndDate" className="block text-sm font-medium text-gray-300">Target End Date</label>
                            <input type="date" name="targetEndDate" id="targetEndDate" value={formData.targetEndDate} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white" />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white">
                                {Object.values(GoalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300">Difficulty</label>
                             <select name="difficulty" id="difficulty" value={formData.difficulty} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white">
                                 {Object.values(GoalDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                             </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="progressPercentage" className="block text-sm font-medium text-gray-300">Progress ({formData.progressPercentage}%)</label>
                        <input type="range" min="0" max="100" step="1" name="progressPercentage" id="progressPercentage" value={formData.progressPercentage} onChange={handleChange} className="mt-1 block w-full" />
                    </div>
                     <div>
                        <label htmlFor="parentGoal" className="block text-sm font-medium text-gray-300">Parent Goal</label>
                        <select name="parentGoal" id="parentGoal" value={formData.parentGoal || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white">
                            <option value="">None (Top-Level Goal)</option>
                            {availableParents.map(g => <option key={g._id} value={g._id}>{g.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-300">Notes (Optional)</label>
                        <textarea 
                            name="notes" 
                            id="notes" 
                            value={formData.notes} 
                            onChange={handleChange} 
                            rows={3} 
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"
                        ></textarea>
                    </div>

                    {/* Show subtasks section if they're generated */}
                    {showSubtasks && suggestedSubtasks.length > 0 && (
                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">
                                {goalToEdit 
                                    ? `Detailed Steps for "${goalToEdit.title}":`
                                    : "Recommended Subtasks:"}
                            </h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto p-2">

                                {suggestedSubtasks
                                .sort((a, b) => {
                                    // If both have suggestedStartDate, compare them
                                    if (a.suggestedStartDate && b.suggestedStartDate) {
                                        return new Date(a.suggestedStartDate).getTime() - new Date(b.suggestedStartDate).getTime();
                                    }
                                    // If only one has suggestedStartDate, prioritize the one with a date
                                    else if (a.suggestedStartDate) {
                                        return -1;
                                    }
                                    else if (b.suggestedStartDate) {
                                        return 1;
                                    }
                                    // If neither has suggestedStartDate, maintain original order
                                    return 0;
                                })
                                
                                .map((subtask, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleToggleSubtask(index)} 
                                        className="bg-gray-900/70 p-3 rounded-lg cursor-pointer border border-gray-700 hover:border-purple-500 transition-all flex items-start gap-3"
                                    >
                                        <div className={`w-5 h-5 rounded-md flex-shrink-0 mt-1 flex items-center justify-center transition-colors ${selectedSubtasks.includes(index) ? 'bg-purple-500' : 'bg-gray-700'}`}>
                                            {selectedSubtasks.includes(index) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                    <p className="font-medium text-white">{subtask.title}</p>
                                    <p className="text-sm text-gray-400">{subtask.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mt-2 inline-block ${
                                            subtask.difficulty === GoalDifficulty.Easy ? 'border-green-400 text-green-300' :
                                            subtask.difficulty === GoalDifficulty.Medium ? 'border-yellow-400 text-yellow-300' :
                                            subtask.difficulty === GoalDifficulty.Hard ? 'border-orange-400 text-orange-300' :
                                            'border-red-400 text-red-300'
                                        }`}>
                                            {subtask.difficulty}
                                        </span>
                                        
                                        {/* Add duration display */}
                                        {subtask.durationDays && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-blue-400 text-blue-300 inline-block">
                                                {subtask.durationDays} days
                                            </span>
                                        )}
                                        
                                        {/* Add date range display */}
                                        {subtask.suggestedStartDate && subtask.suggestedEndDate && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-green-400 text-green-300 inline-block">
                                                {new Date(subtask.suggestedStartDate).toLocaleDateString()} - {new Date(subtask.suggestedEndDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {subtaskError && <p className="text-red-400 bg-red-900/30 p-2 rounded text-sm">{subtaskError}</p>}

                    <div className="flex justify-between space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">
                            Cancel
                        </button>
                        
                        <div className="flex space-x-2">
                            {!showSubtasks && (
                                <button 
                                    type="button" 
                                    onClick={handleGenerateSubtasks}
                                    disabled={isGeneratingSubtasks} 
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-800 transition flex items-center"
                                >
                                    {isGeneratingSubtasks ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                                    {goalToEdit ? 'Break Down with AI' : 'Recommend Subtasks'}
                                </button>
                            )}
                            
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 transition flex items-center"
                            >
                                {isSubmitting && <SpinnerIcon className="w-5 h-5 mr-2" />}
                                {showSubtasks ? `Save with ${selectedSubtasks.length} Subtasks` : 'Save Goal'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalForm;