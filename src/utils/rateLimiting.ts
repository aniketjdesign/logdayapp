import { supabase } from '../lib/supabase';

// Check if the user is rate limited
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Don't block the user if there's an error with rate limiting
      return { rateLimit: false };
    }

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
    // We'll use the same endpoint but include recordFailedAttempt in the URL
    await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
      method: 'POST',
      headers: {
        'x-record-failed-attempt': 'true'
      }
    });
  } catch (error) {
    console.error('Record failed attempt error:', error);
    // Just log the error, don't fail the application
  }
}; 