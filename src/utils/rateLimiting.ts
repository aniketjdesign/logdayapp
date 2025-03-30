import { supabase } from '../lib/supabase';

// Check if the user is rate limited
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string }> => {
  try {
    console.log(`Checking rate limit for ${email} (${action})`);
    const response = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
    });

    console.log('Raw rate limit response:', response);

    // Check for 429 status in error object - Supabase puts this in error for non-2xx responses
    if (response.error) {
      console.log('Response error:', response.error);
      
      // Check if this is specifically a rate limit error
      if (response.error.status === 429) {
        console.log('Rate limited by status code 429');
        
        // Try to parse the error message from the response
        let errorMessage = 'Too many failed attempts. Please try again after 5 minutes.';
        try {
          // The error message might be in the error message or in the error data
          if (response.error.message) {
            errorMessage = response.error.message;
          } else if (typeof response.error.context === 'string') {
            const contextData = JSON.parse(response.error.context);
            errorMessage = contextData.message || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing rate limit message:', e);
        }
        
        return { 
          rateLimit: true, 
          message: errorMessage 
        };
      }
      
      // For other errors, log but don't block the user
      console.error('Rate limit check error:', response.error);
      return { rateLimit: false };
    }

    console.log('Rate limit check response data:', response.data);
    // Check the data payload as well
    if (response.data?.rateLimit === true) {
      return { 
        rateLimit: true, 
        message: response.data.message || 'Too many failed attempts. Please try again after 5 minutes.'
      };
    }

    return { rateLimit: false };
  } catch (error) {
    console.error('Rate limit check error (exception):', error);
    // Don't block the user if there's an error with rate limiting
    return { rateLimit: false };
  }
};

// Function to directly check an email address for rate limiting
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

// Record a failed attempt
export const recordFailedAttempt = async (email: string, action: string): Promise<void> => {
  try {
    console.log(`Recording failed attempt for ${email} (${action})`);
    const response = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
      method: 'POST',
      headers: {
        'x-record-failed-attempt': 'true'
      }
    });
    
    console.log('Record failed attempt response:', response);
    
    if (response.error) {
      console.error('Failed to record attempt:', response.error);
    }
  } catch (error) {
    console.error('Record failed attempt error (exception):', error);
    // Just log the error, don't fail the application
  }
}; 