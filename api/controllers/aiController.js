import Groq from 'groq-sdk';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Generate goal suggestions using AI
// @route   POST /api/ai/suggest-goals
// @access  Private
export const suggestGoals = asyncHandler(async (req, res, next) => {
    const { prompt } = req.body;

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return next(new ErrorResponse('AI service is not configured.', 500));
    }

    if (!prompt) {
        return next(new ErrorResponse('Please provide a prompt describing your goal.', 400));
    }

    try {
        const groq = new Groq({ apiKey });

        const dateRegex = /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i;
        const dateMatch = prompt.match(dateRegex);

        let startDate = new Date().toISOString().split('T')[0];
        let endDate = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];

        if (dateMatch && dateMatch.length >= 3) {
            startDate = dateMatch[1];
            endDate = dateMatch[2];
        }

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

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: fullPrompt }],
        });

        let text = completion.choices[0].message.content;

        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1) {
            throw new Error("AI response did not contain a valid JSON array.");
        }

        const jsonText = text.substring(startIndex, endIndex + 1);

        try {
            const suggestions = JSON.parse(jsonText);
            res.status(200).json({ success: true, data: suggestions });
        } catch (parseError) {
            throw new Error("Failed to parse AI response as JSON.");
        }
    } catch (error) {
        console.error('Groq API Error:', error.message);
        return next(new ErrorResponse('Failed to generate suggestions from the AI service.', 500));
    }
});