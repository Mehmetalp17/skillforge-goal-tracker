interface Quote {
    text: string;
    author: string | null;
  }
  
  // The new API endpoint from ZenQuotes documentation
  const QUOTE_API_URL = 'https://zenquotes.io/api/today';
  
  export const fetchDailyQuote = async (): Promise<Quote> => {
    try {
      // ZenQuotes has CORS issues with the standard fetch, so we use a proxy.
      // This is a common workaround for this specific API.
      const response = await fetch(`https://proxy.cors.sh/${QUOTE_API_URL}`, {
          headers: {
              'x-cors-api-key': 'temp_1f83c1f6b5f47c0b02f8299834893792'
          }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch quote from ZenQuotes');
      }
  
      const data = await response.json();
      const dailyQuote = data[0]; // ZenQuotes returns an array with one quote
  
      return {
        text: dailyQuote.q, // The quote text is in the 'q' field
        author: dailyQuote.a, // The author is in the 'a' field
      };
    } catch (error) {
      console.error("Quote fetching failed, returning a default quote.", error);
      // Return a default quote if the API fails
      return {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
      };
    }
  };