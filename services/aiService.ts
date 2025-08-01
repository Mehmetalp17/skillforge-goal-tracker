// services/aiService.ts

import { SuggestedGoal } from '../types.ts';
import { API_BASE_URL } from '../config.ts';

const API_URL = `${API_BASE_URL}/ai`; // Use the base URL for your API

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

// This function now calls YOUR backend, not Google's
export const fetchSuggestedGoals = async (prompt: string, token: string | null): Promise<SuggestedGoal[]> => {
    const response = await fetch(`${API_URL}/suggest-goals`, { // This is your secure endpoint
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ prompt })
    });
    return handleResponse(response);
};