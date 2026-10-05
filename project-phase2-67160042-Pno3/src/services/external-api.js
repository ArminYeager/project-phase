const axios = require('axios');

function isRetryable(error) {
  if (!error.response) return true; // network error or timeout
  const status = error.response.status;
  return status === 429 || (status >= 500 && status < 600);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, timeoutMs = 3000, maxRetries = 2) {
  let attempt = 0;
  
  while (true) {
    try {
      const response = await axios.get(url, { timeout: timeoutMs });
      return response.data;
    } catch (error) {
      attempt += 1;
      const canRetry = attempt <= maxRetries && isRetryable(error);
      
      if (!canRetry) {
        throw error;
      }
      
      const baseBackoffMs = 2 ** (attempt - 1) * 1000;
      const backoffMs = baseBackoffMs / 2 + Math.random() * (baseBackoffMs / 2); // Equal Jitter
      console.warn(`Request to ${url} failed (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(backoffMs)}ms`);
      await delay(backoffMs);
    }
  }
}

async function getExternalReviews(movieId) {
  try {
    // using jsonplaceholder as a dummy external API for reviews
    // if movieId > 100, it will return 404 which doesn't trigger retry, but goes to catch and then fallback.
    const data = await fetchWithRetry(`https://jsonplaceholder.typicode.com/posts/${movieId}/comments`, 3000, 2);
    return { source: "external", reviews: data.slice(0, 3) }; // return top 3 reviews
  } catch (error) {
    console.error(`External API unavailable after retries: ${error.message}`);
    // Fallback
    return {
      source: "fallback",
      reviews: [],
      message: "ไม่สามารถดึงข้อมูลรีวิวจากภายนอกได้ในขณะนี้ (External reviews unavailable)"
    };
  }
}

module.exports = { getExternalReviews };
