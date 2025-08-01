import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Generate goal suggestions using AI
// @route   POST /api/ai/suggest-goals
// @access  Private
export const suggestGoals = asyncHandler(async (req, res, next) => {
    const { prompt } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
        return next(new ErrorResponse('AI service is not configured. Please ensure GEMINI_API_KEY is set correctly in your .env file.', 500));
    }

    if (!prompt) {
        return next(new ErrorResponse('Please provide a prompt describing your goal.', 400));
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const fullPrompt = `You are an expert project manager. A user wants to achieve this goal: "${prompt}". Break it down into 3 to 5 smaller, concrete, and actionable sub-goals. For each sub-goal, provide a title, description, and difficulty (Easy, Medium, Hard, or Expert). Respond ONLY with a valid JSON array of objects. Each object must have "title", "description", and "difficulty" properties. Do not include any other text, markdown, or explanation.`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        
        // --- START: THE FINAL, MOST ROBUST FIX ---
        let text = response.text();

        // Find the start and end of the JSON array
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1) {
            throw new Error("AI response did not contain a valid JSON array.");
        }
        
        // Extract ONLY the JSON part of the string
        const jsonText = text.substring(startIndex, endIndex + 1);
        // --- END: THE FINAL, MOST ROBUST FIX ---

        const suggestions = JSON.parse(jsonText);

        res.status(200).json({ success: true, data: suggestions });

    } catch (error) {
        console.error('Error calling or parsing Gemini API:', error);
        // Include the raw text in the error for easier debugging
        console.error("Raw AI Response Text:", error.rawText || "N/A");
        return next(new ErrorResponse('Failed to generate suggestions from AI. The model returned an unexpected format.', 500));
    }
});