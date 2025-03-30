import { supabase } from '../lib/supabase';

// Check if the user is rate limited
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('auth-rate-limit', {
      body: { email, action },
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return { rateLimit: false };
    }

    return data as { rateLimit: boolean; message?: string };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { rateLimit: false };
  }
};

// Record a failed attempt
export const recordFailedAttempt = async (email: string, action: string): Promise<void> => {
  try {
    await supabase.functions.invoke('auth-rate-limit/recordFailedAttempt', {
      body: { email, action },
      method: 'POST',
    });
  } catch (error) {
    console.error('Record failed attempt error:', error);
  }
}; 