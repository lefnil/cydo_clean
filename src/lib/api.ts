/**
 * Utility to communicate with the Google Apps Script backend.
 */
import { getToken } from '../context/AuthContext';

const GAS_URL = import.meta.env.VITE_GAS_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

// Validate required env vars
if (!GAS_URL) {
  throw new Error('🚫 VITE_GAS_URL is not configured. Please add to .env.local:\nVITE_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec');
}

// Configuration for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Checks if an error is a network-related error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  // Check for network-related error messages
  const networkErrorMessages = [
    'Failed to fetch',
    'Network request failed',
    'net::ERR_INTERNET_DISCONNECTED',
    'net::ERR_CONNECTION_REFUSED',
    'net::ERR_CONNECTION_RESET',
    'NetworkError',
    'Network is down'
  ];
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = String(error);
  return networkErrorMessages.some(msg => 
    errorMessage.includes(msg) || errorString.includes(msg)
  );
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchFromGAS(action: string, payload: Record<string, unknown> = {}) {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const token = getToken();
      
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'text/plain;charset=utf-8',
      };
      
      
      // Build request body with API key included
      const requestBody: Record<string, unknown> = { 
        action, 
        ...payload 
      };
      
      
      // Add API key to request body (more reliable than header with text/plain)
      if (API_KEY) {
        requestBody.apiKey = API_KEY;
      }
      
      
      // Add token if available (for authenticated requests)
      if (token) {
        requestBody.token = token;
        
      }
      
      // We send POST requests as plain text to avoid CORS preflight issues 
      // that Google Apps Script sometimes struggles with.
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers,
        redirect: 'follow' // Essential for Google Apps Script - it redirects to a temp URL
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error === 'Token expired' || data.error === 'Unauthorized') {
  sessionStorage.removeItem('tcydo_session');
  window.location.href = '/login';
  return;
}

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if this is a network error and we have retries left
      if (isNetworkError(error) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Network error on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      // Log the error for debugging
      if (isNetworkError(error)) {
        console.error(`Network error after ${attempt + 1} attempts:`, lastError.message);
        throw new Error(`Unable to connect to the server. Please check your internet connection and try again.`);
      }
      
      console.error(`Error fetching from GAS [${action}]:`, lastError);
      throw lastError;
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error('Unknown error occurred');
}
