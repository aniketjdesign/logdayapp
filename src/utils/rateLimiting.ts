import { supabase } from '../lib/supabase';

// Check if the user is rate limited
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string }> => {
  try {
    console.log(`Checking rate limit for ${email} (${action})`);
    const response = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
    });

    console.log('Raw rate limit response:', response);

    // Check for 429 status (too many requests)
    if (response.error?.status === 429) {
      console.log('Rate limited by status code 429');
      // If we get a 429, we are rate limited regardless of body content
      return { 
        rateLimit: true, 
        message: response.error?.message || 'Too many failed attempts. Please try again after 5 minutes.' 
      };
    }

    if (response.error) {
      console.error('Rate limit check error:', response.error);
      // Don't block the user if there's an error with rate limiting
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

// Record a failed attempt
export const recordFailedAttempt = async (email: string, action: string): Promise<void> => {
  try {
    console.log(`Recording failed attempt for ${email} (${action})`);
    // We'll use the same endpoint but include recordFailedAttempt in the URL
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