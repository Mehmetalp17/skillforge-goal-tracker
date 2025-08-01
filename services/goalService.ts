
import { LearningGoal } from '../types.ts';
import { API_BASE_URL } from '../config.ts';

const API_URL = `${API_BASE_URL}/goals`;

const getHeaders = (token: string | null) => {
    if (!token) throw new Error("Authentication token is missing");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data.data;
};

export const fetchGoals = async (token: string | null): Promise<LearningGoal[]> => {
    const response = await fetch(API_URL, { headers: getHeaders(token) });
    return handleResponse(response);
};

export const fetchGoalById = async (id: string, token: string | null): Promise<LearningGoal> => {
    const response = await fetch(`${API_URL}/${id}`, { headers: getHeaders(token) });
    return handleResponse(response);
};

export const createGoal = async (goalData: Omit<LearningGoal, '_id' | 'createdAt' | 'owner'>, token: string | null): Promise<LearningGoal> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(goalData)
    });
    return handleResponse(response);
};

export const updateGoal = async (id: string, updates: Partial<LearningGoal>, token: string | null): Promise<LearningGoal> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(updates)
    });
    return handleResponse(response);
};

export const deleteGoal = async (id: string, token: string | null): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(token)
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete goal');
    }
    // Return a success message or the empty data object from the API
    return { message: "Goal deleted successfully" };
};

export const fetchSubGoals = async (parentId: string, token: string | null): Promise<LearningGoal[]> => {
    const response = await fetch(`${API_URL}/${parentId}/subgoals`, { headers: getHeaders(token) });
    return handleResponse(response);
};
