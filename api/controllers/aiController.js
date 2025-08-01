import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Generate goal suggestions using AI
// @route   POST /api/ai/suggest-goals
// @access  Private
export const suggestGoals = asyncHandler(async (req, res, next) => {
    const { prompt } = req.body;

    // Use the key securely from the server's environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if the key is configured on the server
    if (!apiKey) {
        return next(new ErrorResponse('AI service is not configured.', 500));
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
        
        let text = response.text();

        // Clean up the response to ensure it's valid JSON
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1) {
            throw new Error("AI response did not contain a valid JSON array.");
        }
        
        const jsonText = text.substring(startIndex, endIndex + 1);
        const suggestions = JSON.parse(jsonText);

        res.status(200).json({ success: true, data: suggestions });

    } catch (error) {
        console.error('Error calling or parsing Gemini API:', error);
        return next(new ErrorResponse('Failed to generate suggestions from the AI service.', 500));
    }
});