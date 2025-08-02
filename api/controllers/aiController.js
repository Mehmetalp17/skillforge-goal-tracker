// In api/controllers/aiController.js

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

        // Extract dates from the prompt if provided
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
        console.error('Gemini API Error:', error);
        return next(new ErrorResponse('Failed to generate goal suggestions. Please try again.', 500));
    }
});