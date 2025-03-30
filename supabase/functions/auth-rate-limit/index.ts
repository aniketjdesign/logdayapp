import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_ATTEMPTS: 3,         // Maximum failed attempts allowed
  WINDOW_MINUTES: 5,       // Time window in minutes
  LOCKOUT_MINUTES: 5,      // Lockout duration in minutes
  IP_TRACKING: true,       // Whether to track IP addresses for additional security
};

// Standard headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-record-failed-attempt, x-forwarded-for',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

// Helper to create standard response objects
const createResponse = (
  status: number, 
  body: Record<string, unknown>, 
  additionalHeaders: Record<string, string> = {}
) => {
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { ...corsHeaders, ...additionalHeaders } 
    }
  );
};

// Helper to get client IP from request
const getClientIP = (req: Request): string => {
  // Try to get IP from headers (for proxied requests)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback to a placeholder if we can't determine the IP
  return 'unknown-ip';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    let email, action;
    try {
      const body = await req.json();
      email = body.email?.toLowerCase().trim(); // Normalize email to prevent case-based bypass
      action = body.action;
      
      const clientIP = getClientIP(req);
      console.log(`Request received for ${email || 'unknown'}, action: ${action || 'unknown'}, IP: ${clientIP}`);
      console.log(`Request method: ${req.method}, record failed attempt header: ${req.headers.get('x-record-failed-attempt')}`);
      
      if (!email) {
        return createResponse(400, { 
          error: true,
          code: 'MISSING_EMAIL',
          message: 'Email is required' 
        });
      }
      
      if (!action) {
        return createResponse(400, { 
          error: true,
          code: 'MISSING_ACTION',
          message: 'Action is required' 
        });
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return createResponse(400, { 
        error: true, 
        code: 'INVALID_REQUEST',
        message: 'Invalid request body'
      });
    }

    // Get Supabase URL and SERVICE ROLE key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    console.log(`Environment variables: URL exists: ${!!supabaseUrl}, Service Key exists: ${!!supabaseServiceKey}`);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return createResponse(500, { 
        error: true,
        code: 'CONFIGURATION_ERROR',
        message: 'Server configuration error' 
      });
    }

    // Create a Supabase client with service role key for full access
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { 
        auth: { persistSession: false }
      }
    );

    // Get client IP for enhanced security
    const clientIP = RATE_LIMIT.IP_TRACKING ? getClientIP(req) : null;
    
    // Calculate time window
    const timeWindowAgo = new Date();
    timeWindowAgo.setMinutes(timeWindowAgo.getMinutes() - RATE_LIMIT.WINDOW_MINUTES);
    
    // Always check current rate limit status first
    const { data: attempts, error: fetchError } = await supabaseAdmin
      .from('auth_rate_limits')
      .select('*')
      .eq('email', email)
      .eq('action', action)
      .gte('created_at', timeWindowAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Error fetching rate limit data:', fetchError);
      return createResponse(500, { 
        error: true,
        code: 'DB_ERROR',
        message: 'Error checking rate limits',
        details: fetchError 
      });
    }
    
    const attemptsCount = attempts?.length || 0;
    console.log(`Found ${attemptsCount} recent failed attempts for ${email}`);
    
    // Check if rate limited
    const isRateLimited = attemptsCount >= RATE_LIMIT.MAX_ATTEMPTS;
    
    // Check if this is a request to record a failed attempt
    const isRecordFailedAttempt = req.method === 'POST' && req.headers.get('x-record-failed-attempt') === 'true';
    
    // If already rate limited, return 429 regardless of what the request is trying to do
    if (isRateLimited) {
      console.log(`Rate limiting ${email} with ${attemptsCount} failed attempts`);
      
      // Create a timestamp for when they can try again
      const oldestAttempt = attempts?.[attempts.length - 1]?.created_at;
      const retryAfterDate = new Date(oldestAttempt);
      retryAfterDate.setMinutes(retryAfterDate.getMinutes() + RATE_LIMIT.LOCKOUT_MINUTES);
      
      // Calculate seconds until retry is allowed
      const now = new Date();
      const retryAfterSeconds = Math.max(0, Math.ceil((retryAfterDate.getTime() - now.getTime()) / 1000));
      
      // Return a 429 Too Many Requests response
      return createResponse(429, { 
        error: true,
        code: 'RATE_LIMITED',
        rateLimit: true, 
        message: `Too many failed attempts. Please try again after ${RATE_LIMIT.LOCKOUT_MINUTES} minutes.`,
        attemptsCount,
        retryAfter: retryAfterSeconds,
        retryAt: retryAfterDate.toISOString(),
        windowMinutes: RATE_LIMIT.WINDOW_MINUTES,
        maxAttempts: RATE_LIMIT.MAX_ATTEMPTS
      }, {
        'Retry-After': retryAfterSeconds.toString()
      });
    }
    
    // Handle recording failed attempts if not already rate limited
    if (isRecordFailedAttempt) {
      console.log('Recording failed attempt for', email);
      try {
        // Insert the failed attempt record
        const attemptData: any = { 
          email, 
          action,
        };
        
        // Add IP address if tracking enabled
        if (RATE_LIMIT.IP_TRACKING && clientIP) {
          attemptData.ip_address = clientIP;
        }
        
        const { error: insertError } = await supabaseAdmin
          .from('auth_rate_limits')
          .insert(attemptData);
          
        if (insertError) {
          console.error('Error recording failed attempt:', insertError);
          return createResponse(500, { 
            error: true,
            code: 'DB_ERROR',
            message: 'Error recording failed attempt',
            details: insertError 
          });
        }
        
        console.log('Successfully recorded failed attempt');
        
        // Check if this new attempt caused rate limiting
        const newAttemptsCount = attemptsCount + 1;
        const isNowRateLimited = newAttemptsCount >= RATE_LIMIT.MAX_ATTEMPTS;
        
        // If this attempt caused rate limiting, return a 429
        if (isNowRateLimited) {
          const lockoutUntil = new Date();
          lockoutUntil.setMinutes(lockoutUntil.getMinutes() + RATE_LIMIT.LOCKOUT_MINUTES);
          
          return createResponse(429, { 
            error: true,
            code: 'RATE_LIMITED',
            rateLimit: true,
            message: `Too many failed attempts. Please try again after ${RATE_LIMIT.LOCKOUT_MINUTES} minutes.`,
            attemptsCount: newAttemptsCount,
            retryAfter: RATE_LIMIT.LOCKOUT_MINUTES * 60,
            retryAt: lockoutUntil.toISOString(),
            windowMinutes: RATE_LIMIT.WINDOW_MINUTES,
            maxAttempts: RATE_LIMIT.MAX_ATTEMPTS
          }, {
            'Retry-After': (RATE_LIMIT.LOCKOUT_MINUTES * 60).toString()
          });
        }
        
        // Otherwise return success with attempt count
        return createResponse(200, { 
          success: true,
          rateLimit: false,
          attemptsCount: newAttemptsCount,
          remaining: RATE_LIMIT.MAX_ATTEMPTS - newAttemptsCount,
          message: `Attempt recorded. ${RATE_LIMIT.MAX_ATTEMPTS - newAttemptsCount} attempts remaining.`
        });
      } catch (dbError) {
        console.error('Database error recording attempt:', dbError);
        return createResponse(500, { 
          error: true,
          code: 'DB_ERROR',
          message: 'Database error recording attempt',
          details: dbError.message 
        });
      }
    }
    
    // For rate limit check requests, return current status
    console.log(`User ${email} is not rate limited`);
    
    // Return rate limit status
    return createResponse(200, { 
      rateLimit: false,
      attemptsCount,
      remaining: RATE_LIMIT.MAX_ATTEMPTS - attemptsCount,
      windowMinutes: RATE_LIMIT.WINDOW_MINUTES,
      maxAttempts: RATE_LIMIT.MAX_ATTEMPTS
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return createResponse(500, {
      error: true,
      code: 'SERVER_ERROR',
      message: 'Internal server error',
      details: error.message
    });
  }
}); 