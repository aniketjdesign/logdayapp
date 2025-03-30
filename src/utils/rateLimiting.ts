import { supabase } from '../lib/supabase';

/**
 * Check if the user is rate limited
 * 
 * Returns an object with:
 * - rateLimit: boolean - whether the user is rate limited
 * - message: string | undefined - the error message if rate limited
 */
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string }> => {
  if (!email) {
    console.log('No email provided for rate limit check');
    return { rateLimit: false };
  }
  
  try {
    console.log(`Checking rate limit for ${email} (${action})`);
    
    // Make the request to the Edge Function with retries and timeout
    const response = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
      // Add timeout to prevent hanging requests
      headers: {
        // Add a random cache busting parameter to prevent browser caching issues
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'x-cache-buster': Date.now().toString()
      }
    });

    console.log('Raw rate limit response:', JSON.stringify(response));

    // Handle API error responses (including 429)
    if (response.error) {
      console.log('API Error detected:', response.error);
      
      // Rate limit response (429)
      if (response.error.status === 429) {
        console.log('Rate limited by status code 429');
        
        // Try to parse the error message
        let errorMessage = 'Too many failed attempts. Please try again after 5 minutes.';
        
        try {
          // Try to extract a message from the error
          if (response.error.message) {
            errorMessage = response.error.message;
          }
          
          // If there's context data, try to parse it for more info
          if (response.error.context) {
            try {
              const contextData = typeof response.error.context === 'string' 
                ? JSON.parse(response.error.context)
                : response.error.context;
                
              if (contextData.message) {
                errorMessage = contextData.message;
              }
            } catch (e) {
              console.error('Failed to parse error context:', e);
            }
          }
        } catch (e) {
          console.error('Error parsing rate limit error details:', e);
        }
        
        return { 
          rateLimit: true, 
          message: errorMessage 
        };
      }
      
      // For other API errors, log but don't block the user
      console.error('Rate limit check API error:', response.error);
      return { rateLimit: false };
    }

    // Handle normal responses
    console.log('Rate limit check response data:', response.data);
    
    // Check if the response data indicates rate limiting
    if (response.data?.rateLimit === true) {
      return { 
        rateLimit: true, 
        message: response.data.message || 'Too many failed attempts. Please try again after 5 minutes.'
      };
    }

    // No rate limiting
    return { rateLimit: false };
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // Don't block the user if there's an exception with rate limiting
    return { rateLimit: false };
  }
};

/**
 * Function to directly check if an email address is rate limited
 * Returns a boolean indicating if the user is rate limited
 */
export const isRateLimited = async (email: string, action: string): Promise<boolean> => {
  if (!email) return false;
  
  try {
    const { rateLimit } = await checkRateLimit(email, action);
    return rateLimit;
  } catch (error) {
    console.error("Error checking rate limit status:", error);
    return false;
  }
};

/**
 * Record a failed authentication attempt
 * This will increment the count of failed attempts for the user
 */
export const recordFailedAttempt = async (email: string, action: string): Promise<void> => {
  if (!email) {
    console.log('No email provided for recording failed attempt');
    return;
  }
  
  try {
    console.log(`Recording failed attempt for ${email} (${action})`);
    
    const response = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
      method: 'POST',
      headers: {
        'x-record-failed-attempt': 'true',
        // Add a random cache busting parameter to prevent browser caching issues
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'x-cache-buster': Date.now().toString()
      }
    });
    
    console.log('Record failed attempt response:', response);
    
    if (response.error) {
      console.error('Failed to record attempt:', response.error);
    }
  } catch (error) {
    console.error('Record failed attempt exception:', error);
    // Just log the error, don't fail the application
  }
}; 