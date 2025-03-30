import { supabase } from '../lib/supabase';

// Check if the user is rate limited
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string }> => {
  try {
    console.log(`Checking rate limit for ${email} (${action})`);
    const { data, error } = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Don't block the user if there's an error with rate limiting
      return { rateLimit: false };
    }

    console.log('Rate limit check response:', data);
    return data as { rateLimit: boolean; message?: string };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Don't block the user if there's an error with rate limiting
    return { rateLimit: false };
  }
};

// Record a failed attempt
export const recordFailedAttempt = async (email: string, action: string): Promise<void> => {
  try {
    console.log(`Recording failed attempt for ${email} (${action})`);
    // We'll use the same endpoint but include recordFailedAttempt in the URL
    const { data, error } = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
      method: 'POST',
      headers: {
        'x-record-failed-attempt': 'true'
      }
    });
    
    console.log('Record failed attempt response:', { data, error });
    
    if (error) {
      console.error('Failed to record attempt:', error);
    }
  } catch (error) {
    console.error('Record failed attempt error:', error);
    // Just log the error, don't fail the application
  }
}; 