import { API_BASE_URL } from '../config.ts';

interface Quote {
  text: string;
  author: string | null;
}

export const fetchDailyQuote = async (): Promise<Quote> => {
  try {
    // Get the stored token
    const token = localStorage.getItem('skillforge_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/quotes/daily`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quote');
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Quote fetching failed, returning a default quote.", error);
    // Return a default quote if the API fails
    return {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
    };
  }
};