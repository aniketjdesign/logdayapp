import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Standard headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-record-failed-attempt',
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
      email = body.email;
      action = body.action;
      
      console.log(`Request received for ${email || 'unknown'}, action: ${action || 'unknown'}`);
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

    // Check if this is a request to record a failed attempt
    const isRecordFailedAttempt = req.method === 'POST' && req.headers.get('x-record-failed-attempt') === 'true';
    
    if (isRecordFailedAttempt) {
      console.log('Recording failed attempt for', email);
      try {
        const { error: insertError } = await supabaseAdmin
          .from('auth_rate_limits')
          .insert({ email, action });
          
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
        
        // Return success, but also check and include the current rate limit status
        const { data: attempts, error: countError } = await supabaseAdmin
          .from('auth_rate_limits')
          .select('*')
          .eq('email', email)
          .eq('action', action)
          .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
          
        const attemptsCount = attempts?.length || 0;
        const isNowRateLimited = attemptsCount >= 3;
        
        return createResponse(200, { 
          success: true,
          rateLimit: isNowRateLimited,
          attemptsCount,
          message: isNowRateLimited 
            ? 'Too many failed attempts. Please try again after 5 minutes.' 
            : `Attempt recorded. ${3 - attemptsCount} attempts remaining.`
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
    
    // Otherwise, check for rate limits
    const tableName = 'auth_rate_limits';
    
    // Get current timestamp minus 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    console.log('Checking for failed attempts since', fiveMinutesAgo.toISOString());
    
    // Check for recent failed attempts
    const { data: attempts, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('email', email)
      .eq('action', action)
      .gte('created_at', fiveMinutesAgo.toISOString())
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
    
    // Check if rate limited (3 or more attempts in the last 5 minutes)
    if (attemptsCount >= 3) {
      console.log(`Rate limiting ${email} after ${attemptsCount} failed attempts`);
      
      // Create a timestamp for when they can try again
      const retryAfter = 300; // 5 minutes in seconds
      const retryTimestamp = new Date(Date.now() + retryAfter * 1000).toISOString();
      
      // Return a 429 Too Many Requests response
      return createResponse(429, { 
        error: true,
        code: 'RATE_LIMITED',
        rateLimit: true, 
        message: 'Too many failed attempts. Please try again after 5 minutes.',
        attemptsCount,
        retryAfter,
        retryAt: retryTimestamp
      }, {
        'Retry-After': retryAfter.toString()
      });
    }
    
    console.log(`User ${email} is not rate limited`);
    
    // Return rate limit status
    return createResponse(200, { 
      rateLimit: false,
      attemptsCount,
      remaining: Math.max(0, 3 - attemptsCount)
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