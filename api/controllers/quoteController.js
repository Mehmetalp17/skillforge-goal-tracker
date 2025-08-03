import asyncHandler from '../middleware/asyncHandler.js';
import fetch from 'node-fetch'; // You may need to install this: npm install node-fetch

// @desc    Get daily quote
// @route   GET /api/quotes/daily
// @access  Private
export const getDailyQuote = asyncHandler(async (req, res) => {
    try {
        const response = await fetch('https://zenquotes.io/api/today');
        
        if (!response.ok) {
            throw new Error('Failed to fetch quote from ZenQuotes');
        }
        
        const data = await response.json();
        const dailyQuote = data[0];
        
        res.status(200).json({
            success: true,
            data: {
                text: dailyQuote.q,
                author: dailyQuote.a
            }
        });
    } catch (error) {
        // Return a default quote if API fails
        res.status(200).json({
            success: true,
            data: {
                text: "The secret of getting ahead is getting started.",
                author: "Mark Twain"
            }
        });
    }
});