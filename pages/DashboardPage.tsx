import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx'; // Make sure this is imported
import * as goalService from '../services/goalService.ts';
import { fetchDailyQuote } from '../services/quoteService.ts';
import { LearningGoal, SuggestedGoal, GoalDifficulty, GoalStatus } from '../types.ts';
import GoalList from '../components/GoalHierarchy.tsx';
import GoalForm from '../components/GoalForm.tsx';
import AiGoalGeneratorModal from '../components/AiGoalGeneratorModal.tsx';
import { PlusIcon, SpinnerIcon, SparklesIcon } from '../components/icons.tsx';

interface Quote {
  text: string;
  author: string | null;
}

const DashboardPage = () => {
    const [allGoals, setAllGoals] = useState<LearningGoal[]>([]);
    const [topLevelGoals, setTopLevelGoals] = useState<LearningGoal[]>([]);
    const [isLoadingGoals, setIsLoadingGoals] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(true);
    
    // --- THIS IS THE MISSING LINE ---
    const { token } = useAuth(); 
    // --------------------------------

    useEffect(() => {
        const getQuote = async () => {
            setIsLoadingQuote(true);
            try {
                const dailyQuote = await fetchDailyQuote();
                setQuote(dailyQuote);
            } catch (error) {
                console.error("Failed to load quote, will use default.", error);
                setQuote({ text: "The secret of getting ahead is getting started.", author: "Mark Twain" });
            } finally {
                setIsLoadingQuote(false);
            }
        };
        getQuote();
    }, []);

    const fetchAllGoals = useCallback(async () => {
        if (!token) return;
        setIsLoadingGoals(true);
        try {
            const goals = await goalService.fetchGoals(token);
            setAllGoals(goals);
            setTopLevelGoals(goals.filter(g => !g.parentGoal));
            setError(null);
        } catch (err) {
            setError('Failed to load goals.');
            console.error(err);
        } finally {
            setIsLoadingGoals(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAllGoals();
    }, [fetchAllGoals]);
    
    const handleSaveGoal = async (goalData: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'> | LearningGoal) => {
         if (!token) return;
         try {
            if ('_id' in goalData) {
                await goalService.updateGoal(goalData._id, goalData, token);
            } else {
                await goalService.createGoal(goalData, token);
            }
            fetchAllGoals();
        } catch (err: any) {
            setError(err.message || 'Failed to save the goal.');
            setTimeout(() => setError(null), 5000);
        }
    };
    
    const handleAddSuggestedGoals = async (suggestedGoals: SuggestedGoal[]) => {
        if (!token) return;
        setError(null);
        try {
            const creationPromises = suggestedGoals.map(sg => {
                const newGoalData = {
                    title: sg.title,
                    description: sg.description,
                    difficulty: sg.difficulty,
                    status: GoalStatus.NotStarted,
                    startDate: new Date().toISOString().split('T')[0],
                    targetEndDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                    progressPercentage: 0,
                    parentGoal: null,
                    isArchived: false,
                };
                return goalService.createGoal(newGoalData, token);
            });

            await Promise.all(creationPromises);
            fetchAllGoals();
        } catch (err: any) {
             setError(err.message || 'Failed to add suggested goals.');
             setTimeout(() => setError(null), 5000);
        }
    };

    const openNewGoalForm = () => {
        setIsFormOpen(true);
    }

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!isLoadingQuote && quote && (
                <div className="mb-8 p-4 bg-gray-800/50 border-l-4 border-indigo-400 rounded-r-lg animate-fade-in">
                    <p className="text-xl italic text-gray-200">"{quote.text}"</p>
                    <p className="text-right text-gray-400 mt-2">- {quote.author}</p>
                </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-white">Your Learning Goals</h1>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                    >
                        <SparklesIcon />
                        <span>Generate with AI</span>
                    </button>
                    <button
                        onClick={openNewGoalForm}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                    >
                        <PlusIcon />
                        <span>New Goal</span>
                    </button>
                </div>
            </div>

            {isLoadingGoals ? (
                <div className="flex justify-center items-center h-64">
                    <SpinnerIcon className="w-12 h-12 text-indigo-400" />
                </div>
            ) : error ? (
                <div className="bg-red-900/50 text-red-300 p-4 rounded-md text-center">
                    <p>{error}</p>
                    <button onClick={fetchAllGoals} className="mt-2 text-indigo-300 hover:underline">Try again</button>
                </div>
            ) : allGoals.length === 0 ? (
                <div className="text-center py-16 px-4 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                    <h3 className="text-xl font-medium text-white">No goals here... yet!</h3>
                    <p className="text-gray-400 mt-2">Create your first learning goal or use AI to brainstorm ideas.</p>
                </div>
            ) : (
                <GoalList 
                    goals={topLevelGoals}
                    allGoalsForForm={allGoals}
                    onGoalUpdate={fetchAllGoals}
                />
            )}
            
             <GoalForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveGoal}
                allGoals={allGoals}
            />
            
            <AiGoalGeneratorModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onAddGoals={handleAddSuggestedGoals}
            />
        </main>
    );
};

export default DashboardPage;