import React, { useState } from 'react';
import { SuggestedGoal, GoalDifficulty } from '../types.ts';
import * as aiService from '../services/aiService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { CloseIcon, SparklesIcon, SpinnerIcon, CheckIcon } from './icons.tsx';

interface AiGoalGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddGoals: (goals: SuggestedGoal[]) => Promise<void>;
}

const difficultyColors: Record<GoalDifficulty, string> = {
    [GoalDifficulty.Easy]: 'border-green-400 text-green-300',
    [GoalDifficulty.Medium]: 'border-yellow-400 text-yellow-300',
    [GoalDifficulty.Hard]: 'border-orange-400 text-orange-300',
    [GoalDifficulty.Expert]: 'border-red-400 text-red-300',
};

const AiGoalGeneratorModal = ({ isOpen, onClose, onAddGoals }: AiGoalGeneratorModalProps) => {
    const [prompt, setPrompt] = useState('');
    const [suggestions, setSuggestions] = useState<SuggestedGoal[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a goal you want to achieve.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuggestions([]);
        setSelectedGoals([]);

        try {
            const results = await aiService.fetchSuggestedGoals(prompt, token);
            setSuggestions(results);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleSelection = (index: number) => {
        setSelectedGoals(prev => 
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleAddSelectedGoals = async () => {
        const goalsToAdd = selectedGoals.map(index => suggestions[index]);
        if (goalsToAdd.length > 0) {
            await onAddGoals(goalsToAdd);
            handleClose();
        }
    };
    
    const handleClose = () => {
        setPrompt('');
        setSuggestions([]);
        setSelectedGoals([]);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-700">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="text-purple-400" />
                        Generate Goals with AI
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition">
                        <CloseIcon />
                    </button>
                </header>

                <div className="p-6 flex-grow overflow-y-auto">
                    <p className="text-gray-300 mb-4">Describe a skill you want to learn or a large goal you want to achieve. The AI will break it down into smaller, manageable steps for you.</p>
                    <div className="flex gap-3">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'Learn to build modern web applications with React and Node.js' or 'Master landscape photography'"
                            rows={3}
                            className="flex-grow bg-gray-900/50 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white p-3 transition"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="self-start px-5 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition flex items-center justify-center h-[84px]"
                        >
                            {isLoading ? <SpinnerIcon /> : "Generate"}
                        </button>
                    </div>

                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center mt-4">{error}</p>}
                    
                    {isLoading && (
                        <div className="text-center p-8">
                             <p className="text-gray-300">AI is thinking... please wait.</p>
                        </div>
                    )}

                    {suggestions.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">Suggested Goals (select to add):</h3>
                            <div className="space-y-3">
                            {suggestions.map((goal, index) => (
                                <div key={index} onClick={() => handleToggleSelection(index)} className="bg-gray-900/70 p-4 rounded-lg cursor-pointer border-2 border-transparent hover:border-purple-500 transition-all flex items-start gap-4">
                                    <div className={`w-6 h-6 rounded-md flex-shrink-0 mt-1 flex items-center justify-center transition-colors ${selectedGoals.includes(index) ? 'bg-purple-500 border-purple-500' : 'bg-gray-700 border-gray-600'}`}>
                                        {selectedGoals.includes(index) && <CheckIcon className="w-5 h-5 text-white" />}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-white">{goal.title}</h4>
                                        <p className="text-gray-400 text-sm">{goal.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border inline-block ${difficultyColors[goal.difficulty]}`}>
                                                {goal.difficulty}
                                            </span>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-blue-400 text-blue-300 inline-block">
                                                {goal.durationDays} days
                                            </span>
                                            {goal.suggestedStartDate && goal.suggestedEndDate && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-green-400 text-green-300 inline-block">
                                                    {new Date(goal.suggestedStartDate).toLocaleDateString()} - {new Date(goal.suggestedEndDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={handleAddSelectedGoals}
                        disabled={selectedGoals.length === 0}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed transition flex items-center"
                    >
                        Add {selectedGoals.length > 0 ? `${selectedGoals.length} ` : ''}Selected Goals
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AiGoalGeneratorModal;