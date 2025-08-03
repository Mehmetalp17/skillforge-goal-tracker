// In api/controllers/quoteController.js
import asyncHandler from '../middleware/asyncHandler.js';
import fetch from 'node-fetch';

let cachedQuote = null;
let cacheTimestamp = null;

export const getDailyQuote = asyncHandler(async (req, res) => {
    // Check if we have a cached quote from today
    const now = new Date();
    const isNewDay = !cacheTimestamp || 
        now.getDate() !== cacheTimestamp.getDate() || 
        now.getMonth() !== cacheTimestamp.getMonth() || 
        now.getFullYear() !== cacheTimestamp.getFullYear();
    
    // If we have a cached quote from today, use it
    if (cachedQuote && !isNewDay) {
        return res.status(200).json({
            success: true,
            data: cachedQuote
        });
    }
    
    // Otherwise fetch a new one
    try {
        const response = await fetch('https://zenquotes.io/api/today');
        
        if (!response.ok) {
            throw new Error('Failed to fetch quote from ZenQuotes');
        }
        
        const data = await response.json();
        const dailyQuote = data[0];
        
        // Cache the quote and timestamp
        cachedQuote = {
            text: dailyQuote.q,
            author: dailyQuote.a
        };
        cacheTimestamp = now;
        
        res.status(200).json({
            success: true,
            data: cachedQuote
        });
    } catch (error) {
        // Return a default quote if API fails
        const defaultQuote = {
            text: "The secret of getting ahead is getting started.",
            author: "Mark Twain"
        };
        
        // Cache the default quote if we don't have anything cached
        if (!cachedQuote) {
            cachedQuote = defaultQuote;
            cacheTimestamp = now;
        }
        
        res.status(200).json({
            success: true,
            data: cachedQuote || defaultQuote
        });
    }
});