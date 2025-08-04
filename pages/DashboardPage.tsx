import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx'; // Make sure this is imported
import * as goalService from '../services/goalService.ts';
import { fetchDailyQuote } from '../services/quoteService.ts';
import { LearningGoal, SuggestedGoal, GoalDifficulty, GoalStatus } from '../types.ts';
import GoalList from '../components/GoalList.tsx';
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
    const [filteredGoals, setFilteredGoals] = useState<LearningGoal[]>([]);
    const [statusFilter, setStatusFilter] = useState<GoalStatus | 'All'>('All');
    const [isLoadingGoals, setIsLoadingGoals] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(true);
    
    const { token } = useAuth(); 

    // Filter goals whenever topLevelGoals or statusFilter changes
    useEffect(() => {
        if (statusFilter === 'All') {
            setFilteredGoals(topLevelGoals);
        } else {
            setFilteredGoals(topLevelGoals.filter(goal => goal.status === statusFilter));
        }
    }, [topLevelGoals, statusFilter]);

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

    // Update the handleSaveGoalWithSubtasks function in DashboardPage.tsx
    const handleSaveGoalWithSubtasks = async (
        goalData: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'> | LearningGoal, 
        subtasks: SuggestedGoal[]
    ) => {
        if (!token) return;
        
        try {
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
            
            // Create subtasks with distributed dates and time intervals
            const subtaskPromises = subtasks
                // Sort subtasks by suggestedStartDate if available
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
                .map((subtask, index) => {
                    let subtaskStartDate, subtaskEndDate;
                    
                    if (subtask.suggestedStartDate && subtask.suggestedEndDate) {
                        // Use AI-suggested dates if available
                        subtaskStartDate = new Date(subtask.suggestedStartDate);
                        subtaskEndDate = new Date(subtask.suggestedEndDate);
                    } else {
                        // Calculate based on index in the sequence
                        subtaskStartDate = new Date(startDate);
                        subtaskStartDate.setDate(startDate.getDate() + (index * daysPerSubtask));
                        
                        subtaskEndDate = new Date(subtaskStartDate);
                        if (index === subtasks.length - 1) {
                            // Last subtask ends on the overall end date
                            subtaskEndDate = new Date(endDate);
                        } else {
                            // Subtask ends right before the next one starts
                            subtaskEndDate.setDate(subtaskStartDate.getDate() + daysPerSubtask - 1);
                        }
                    }
                    
                    const formattedStartDate = subtaskStartDate.toISOString().split('T')[0];
                    const formattedEndDate = subtaskEndDate.toISOString().split('T')[0];
                    
                    // Add date range to description for clarity
                    const dateRange = `(${formattedStartDate} to ${formattedEndDate})`;
                    const enhancedDescription = `${dateRange} ${subtask.description}`;
                    
                    const newGoalData = {
                        title: subtask.title,
                        description: enhancedDescription,
                        difficulty: subtask.difficulty,
                        status: GoalStatus.NotStarted,
                        startDate: formattedStartDate,
                        targetEndDate: formattedEndDate,
                        progressPercentage: 0,
                        parentGoal: parentGoalId,  // Set parent goal correctly
                        isArchived: false,
                    };
                    
                    return goalService.createGoal(newGoalData, token);
                });
            
            await Promise.all(subtaskPromises);
            fetchAllGoals();
        } catch (err: any) {
            setError(err.message || 'Failed to save goal with subtasks.');
            setTimeout(() => setError(null), 5000);
        }
    };

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
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                        <span>✨</span>
                        <span>AI Assistant</span>
                    </button>
                    <button
                        onClick={openNewGoalForm}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                    >
                        <span>+</span>
                        <span>Add Goal</span>
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex flex-wrap items-center gap-4">
                    <label className="text-sm font-medium text-gray-300">Filter by Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as GoalStatus | 'All')}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="All">All Goals</option>
                        {Object.values(GoalStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    
                    {/* Goal count display */}
                    <span className="text-sm text-gray-400">
                        Showing {filteredGoals.length} of {topLevelGoals.length} goals
                    </span>
                    
                    {/* Clear filter button */}
                    {statusFilter !== 'All' && (
                        <button
                            onClick={() => setStatusFilter('All')}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded-full hover:bg-gray-500 transition"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-900/50 text-red-300 rounded-md text-center">
                    {error}
                    <button onClick={fetchAllGoals} className="mt-2 text-indigo-300 hover:underline">Try again</button>
                </div>
            )}

            {isLoadingGoals ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : error ? (
                <div className="text-center py-16 px-4 bg-red-900/50 rounded-lg border border-red-700">
                    <h3 className="text-xl font-medium text-red-300">Failed to load goals</h3>
                    <p className="text-red-400 mt-2">{error}</p>
                    <button onClick={fetchAllGoals} className="mt-2 text-indigo-300 hover:underline">Try again</button>
                </div>
            ) : filteredGoals.length === 0 ? (
                <div className="text-center py-16 px-4 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                    {statusFilter === 'All' ? (
                        <>
                            <h3 className="text-xl font-medium text-white">No goals here... yet!</h3>
                            <p className="text-gray-400 mt-2">Create your first learning goal or use AI to brainstorm ideas.</p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-medium text-white">No {statusFilter.toLowerCase()} goals found</h3>
                            <p className="text-gray-400 mt-2">Try selecting a different status filter or create new goals.</p>
                        </>
                    )}
                </div>
            ) : (
                <GoalList 
                    goals={filteredGoals}
                    allGoalsForForm={allGoals}
                    onGoalUpdate={fetchAllGoals}
                />
            )}
            
             <GoalForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveGoal}
                onSaveWithSubtasks={handleSaveGoalWithSubtasks}
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
