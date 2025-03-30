import { supabase } from '../config/supabase';

// Check if the user is rate limited
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string }> => {
  try {
    console.log(`Checking rate limit for ${email} (${action})`);
    
    // Direct API call to ensure we get the proper status code
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ email, action })
    });
    
    console.log('Rate limit check status:', response.status);
    
    // If status is 429, user is rate limited
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return { 
        rateLimit: true, 
        message: data.message || 'Too many failed attempts. Please try again after 5 minutes.'
      };
    }
    
    // For successful responses
    if (response.ok) {
      const data = await response.json();
      if (data.rateLimit === true) {
        return {
          rateLimit: true,
          message: data.message || 'Too many failed attempts. Please try again after 5 minutes.'
        };
      }
      return { rateLimit: false };
    }
    
    // For other error cases, log but don't block
    console.error('Rate limit check unexpected response:', response.status);
    return { rateLimit: false };
  } catch (error) {
    console.error('Rate limit check error (exception):', error);
    // Don't block the user if there's an error with the check itself
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