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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Extract dates from the prompt if provided
        const dateRegex = /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i;
        const dateMatch = prompt.match(dateRegex);
        
        let startDate = new Date().toISOString().split('T')[0];
        let endDate = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];
        
        if (dateMatch && dateMatch.length >= 3) {
            startDate = dateMatch[1];
            endDate = dateMatch[2];
        }

        console.log(`Generating suggestions for: "${prompt}" with timeframe ${startDate} to ${endDate}`);

        const fullPrompt = `You are an expert project manager. A user wants to achieve this goal: "${prompt}". 
Break it down into 3 to 5 smaller, concrete, and actionable sub-goals. 

For each sub-goal, provide:
1. A title
2. A detailed description (under 200 characters)
3. Difficulty (Easy, Medium, Hard, or Expert)
4. Recommended duration in days
5. A suggested start date (YYYY-MM-DD format)
6. A suggested end date (YYYY-MM-DD format)

The sub-goals should represent a progressive path toward completing the main goal.
The entire timeline should span from ${startDate} to ${endDate}.

Respond ONLY with a valid JSON array of objects. Each object must have "title", "description", "difficulty", "durationDays", "suggestedStartDate", and "suggestedEndDate" properties. Do not include any other text, markdown, or explanation.`;

        console.log("Sending prompt to Gemini API...");
        const result = await model.generateContent(fullPrompt);
        console.log("Received response from Gemini API");
        const response = await result.response;
        
        let text = response.text();
        console.log("Raw response text:", text.substring(0, 100) + "..."); // Just log the beginning for debugging

        // Clean up the response to ensure it's valid JSON
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1) {
            console.error("Invalid JSON format in response: no array brackets found");
            throw new Error("AI response did not contain a valid JSON array.");
        }
        
        const jsonText = text.substring(startIndex, endIndex + 1);
        console.log("Extracted JSON text:", jsonText.substring(0, 100) + "..."); // Just log the beginning
        
        try {
            const suggestions = JSON.parse(jsonText);
            console.log(`Successfully parsed ${suggestions.length} suggestions`);
            
            // Validate the structure of each suggestion
            suggestions.forEach((suggestion, index) => {
                if (!suggestion.title || !suggestion.description || !suggestion.difficulty) {
                    console.error(`Suggestion #${index} is missing required fields:`, suggestion);
                }
            });
            
            res.status(200).json({ success: true, data: suggestions });
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("JSON text that failed to parse:", jsonText);
            throw new Error("Failed to parse AI response as JSON.");
        }
    } catch (error) {
        console.error('Gemini API Error:', error.message);
        if (error.response) {
            console.error('Error details:', error.response);
        }
        return next(new ErrorResponse('Failed to generate suggestions from the AI service.', 500));
    }
});