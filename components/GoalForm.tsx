import React, { useState, useEffect } from 'react';
import { LearningGoal, GoalStatus, GoalDifficulty } from '../types.ts';
import { SpinnerIcon } from './icons.tsx';

interface GoalFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'> | LearningGoal) => Promise<void>;
    goalToEdit?: LearningGoal | null;
    parentId?: string | null;
    allGoals: LearningGoal[];
}

const GoalForm = ({ isOpen, onClose, onSave, goalToEdit, parentId = null, allGoals }: GoalFormProps) => {
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
        
        if (goalToEdit) {
            await onSave({ ...goalToEdit, ...goalData });
        } else {
            await onSave(goalData);
        }
        setIsSubmitting(false);
        onClose();
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
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" />
                        </div>
                        <div>
                            <label htmlFor="targetEndDate" className="block text-sm font-medium text-gray-300">Target End Date</label>
                            <input type="date" name="targetEndDate" id="targetEndDate" value={formData.targetEndDate} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 transition flex items-center">
                            {isSubmitting && <SpinnerIcon className="w-5 h-5 mr-2" />}
                            {isSubmitting ? 'Saving...' : 'Save Goal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalForm;