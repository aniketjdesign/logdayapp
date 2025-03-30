import { supabase } from '../config/supabase';

// Check if the user is rate limited
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string }> => {
  try {
    console.log(`Checking rate limit for ${email} (${action})`);
    const response = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
    });

    console.log('Raw rate limit response:', JSON.stringify(response));

    // Case 1: Error object with 429 status
    if (response.error) {
      console.log('Response contains error:', response.error);
      
      // Check if this is specifically a rate limit error (status 429)
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
      console.error('Rate limit check error (not 429):', response.error);
      return { rateLimit: false };
    }

    // Case 2: Data object with rateLimit field
    console.log('Rate limit check response data:', response.data);
    if (response.data?.rateLimit === true) {
      console.log('Rate limited by data.rateLimit flag');
      return { 
        rateLimit: true, 
        message: response.data.message || 'Too many failed attempts. Please try again after 5 minutes.'
      };
    }

    // If we got here, user is not rate limited
    console.log('User is not rate limited');
    return { rateLimit: false };
  } catch (error) {
    console.error('Rate limit check error (exception):', error);
    // Don't block the user if there's an error with rate limiting itself
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