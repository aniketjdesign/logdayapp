import { supabase } from '../config/supabase';

// Check if the user is rate limited
export const checkRateLimit = async (email: string, action: string): Promise<{ rateLimit: boolean; message?: string; reason?: string }> => {
  try {
    console.log(`Checking rate limit for ${email} (${action})`);
    
    // Use direct fetch to ensure proper status code handling
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ email, action })
    });
    
    console.log('Raw rate limit response status:', response.status);
    
    // If status is 429, user is rate limited
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return { 
        rateLimit: true, 
        message: data.message || 'Too many failed attempts. Please try again after 5 minutes.',
        reason: data.reason
      };
    }
    
    // For successful responses
    if (response.ok) {
      const data = await response.json();
      if (data.rateLimit === true) {
        return {
          rateLimit: true,
          message: data.message || 'Too many failed attempts. Please try again after 5 minutes.',
          reason: data.reason
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

// Check for IP-based rate limiting only (for preemptive checks)
export const checkIpRateLimit = async (action: string): Promise<{ rateLimit: boolean; message?: string; reason?: string }> => {
  try {
    console.log(`Checking IP-based rate limit for ${action}`);
    
    // Use direct fetch to ensure proper status code handling
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action, checkIpOnly: true })
    });
    
    console.log('Raw IP rate limit response status:', response.status);
    
    // If status is 429, IP is rate limited
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return { 
        rateLimit: true, 
        message: data.message || 'Too many attempts from your IP address. Please try again after 5 minutes.',
        reason: data.reason
      };
    }
    
    // For successful responses
    if (response.ok) {
      const data = await response.json();
      if (data.rateLimit === true) {
        return {
          rateLimit: true,
          message: data.message || 'Too many attempts from your IP address. Please try again after 5 minutes.',
          reason: data.reason
        };
      }
      return { rateLimit: false };
    }
    
    // For other error cases, log but don't block
    console.error('IP rate limit check unexpected response:', response.status);
    return { rateLimit: false };
  } catch (error) {
    console.error('IP rate limit check error (exception):', error);
    // Don't block the user if there's an error with the check itself
    return { rateLimit: false };
  }
};

// Record a failed attempt
export const recordFailedAttempt = async (email: string, action: string): Promise<void> => {
  try {
    console.log(`Recording failed attempt for ${email} (${action})`);
    
    // Use direct fetch to ensure proper headers are sent
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-record-failed-attempt': 'true'
      },
      body: JSON.stringify({ email, action })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to record attempt:', response.status, errorData);
    } else {
      console.log('Successfully recorded failed attempt');
    }
  } catch (error) {
    console.error('Record failed attempt error (exception):', error);
    // Just log the error, don't fail the application
  }
}; 