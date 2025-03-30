import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-record-failed-attempt, x-real-ip, x-forwarded-for',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Rate limit thresholds
const EMAIL_LOGIN_THRESHOLD = 5;  // 3 failed login attempts per email
const EMAIL_SIGNUP_THRESHOLD = 3; // 3 failed signup attempts per email
const IP_LOGIN_THRESHOLD = 10;    // 10 failed login attempts per IP
const IP_SIGNUP_THRESHOLD = 2;    // 2 signup attempts (failed or successful) per IP every 5 minutes

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, action, checkIpOnly } = await req.json();
    
    // Get client IP address from request headers
    const clientIp = req.headers.get('x-real-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown-ip';
    
    console.log(`------------------------------`);
    console.log(`Request received for ${checkIpOnly ? 'IP-only check' : email}, action: ${action}, IP: ${clientIp}`);
    console.log(`Request method: ${req.method}, record failed attempt header: ${req.headers.get('x-record-failed-attempt')}`);
    
    if (!checkIpOnly && !email) {
      console.log('Error: Email is required for non-IP-only checks');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase URL and SERVICE ROLE key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    console.log(`Environment variables: URL exists: ${!!supabaseUrl}, Service Key exists: ${!!supabaseServiceKey}`);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.log(`Recording failed attempt for ${email} (${action}) from IP: ${clientIp}`);
      const { error: insertError } = await supabaseAdmin
        .from('auth_rate_limits')
        .insert({ 
          email, 
          action,
          ip_address: clientIp 
        });
        
      if (insertError) {
        console.error('Error recording failed attempt:', insertError);
        return new Response(
          JSON.stringify({ error: 'Error recording failed attempt', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Successfully recorded failed attempt');
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get current timestamp minus 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    // If this is a request to check IP-only rate limiting, only check IP-based limits
    if (checkIpOnly) {
      console.log(`IP-only check requested for ${action}, checking IP ${clientIp} only`);
      
      // For signup action, directly check IP-based limits
      if (action === 'signup') {
        const { data: ipAttempts, error: ipFetchError } = await supabaseAdmin
          .from('auth_rate_limits')
          .select('*')
          .eq('ip_address', clientIp)
          .eq('action', action)
          .gte('created_at', fiveMinutesAgo.toISOString())
          .order('created_at', { ascending: false });
        
        if (ipFetchError) {
          console.error('Error fetching IP rate limit data:', ipFetchError);
          return new Response(
            JSON.stringify({ error: 'Error checking IP rate limits', details: ipFetchError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const isAtLimit = ipAttempts && ipAttempts.length >= IP_SIGNUP_THRESHOLD;
        
        if (isAtLimit) {
          console.log(`IP ${clientIp} is at the signup limit with ${ipAttempts.length} attempts`);
          return new Response(
            JSON.stringify({ 
              rateLimit: true, 
              message: `Maximum of ${IP_SIGNUP_THRESHOLD} signup attempts per IP address allowed every 5 minutes.`,
              reason: `IP address (${ipAttempts.length} attempts)`,
              attemptsCount: ipAttempts.length,
            }),
            { 
              status: 429, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '300' } 
            }
          );
        }
        
        console.log(`IP ${clientIp} is not at the signup limit (${ipAttempts?.length || 0}/${IP_SIGNUP_THRESHOLD})`);
        return new Response(
          JSON.stringify({ rateLimit: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // For login action, directly check IP-based limits
      if (action === 'login') {
        const { data: ipAttempts, error: ipFetchError } = await supabaseAdmin
          .from('auth_rate_limits')
          .select('*')
          .eq('ip_address', clientIp)
          .eq('action', action)
          .gte('created_at', fiveMinutesAgo.toISOString())
          .order('created_at', { ascending: false });
        
        if (ipFetchError) {
          console.error('Error fetching IP rate limit data:', ipFetchError);
          return new Response(
            JSON.stringify({ error: 'Error checking IP rate limits', details: ipFetchError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const isAtLimit = ipAttempts && ipAttempts.length >= IP_LOGIN_THRESHOLD;
        
        if (isAtLimit) {
          console.log(`IP ${clientIp} is at the login limit with ${ipAttempts.length} attempts`);
          return new Response(
            JSON.stringify({ 
              rateLimit: true, 
              message: `Maximum of ${IP_LOGIN_THRESHOLD} failed login attempts per IP address allowed every 5 minutes.`,
              reason: `IP address (${ipAttempts.length} attempts)`,
              attemptsCount: ipAttempts.length,
            }),
            { 
              status: 429, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '300' } 
            }
          );
        }
        
        console.log(`IP ${clientIp} is not at the login limit (${ipAttempts?.length || 0}/${IP_LOGIN_THRESHOLD})`);
        return new Response(
          JSON.stringify({ rateLimit: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Otherwise, check for rate limits
    const tableName = 'auth_rate_limits';
    
    console.log('Checking for failed attempts since', fiveMinutesAgo.toISOString());
    
    // 1. Check for email-based rate limiting (skip if IP-only check)
    let emailAttempts = [];
    let emailFetchError = null;
    
    if (!checkIpOnly) {
      const emailResult = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('email', email)
        .eq('action', action)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .order('created_at', { ascending: false });
      
      emailAttempts = emailResult.data || [];
      emailFetchError = emailResult.error;
      
      if (emailFetchError) {
        console.error('Error fetching email rate limit data:', emailFetchError);
        return new Response(
          JSON.stringify({ error: 'Error checking email rate limits', details: emailFetchError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // 2. Check for IP-based rate limiting
    const { data: ipAttempts, error: ipFetchError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('ip_address', clientIp)
      .eq('action', action)
      .gte('created_at', fiveMinutesAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (ipFetchError) {
      console.error('Error fetching IP rate limit data:', ipFetchError);
      return new Response(
        JSON.stringify({ error: 'Error checking IP rate limits', details: ipFetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${!checkIpOnly ? (emailAttempts?.length || 0) + ' recent attempts for email ' + email : 'IP-only check, skipping email check'}`);
    console.log(`Found ${ipAttempts?.length || 0} recent attempts for IP ${clientIp}`);
    
    // Determine thresholds based on action type
    const emailThreshold = action === 'signup' ? EMAIL_SIGNUP_THRESHOLD : EMAIL_LOGIN_THRESHOLD;
    const ipThreshold = action === 'signup' ? IP_SIGNUP_THRESHOLD : IP_LOGIN_THRESHOLD;
    
    // Check if rate limited by email (skip if IP-only check)
    const isEmailRateLimited = !checkIpOnly && emailAttempts && emailAttempts.length >= emailThreshold;
    
    // Check if rate limited by IP
    const isIpRateLimited = ipAttempts && ipAttempts.length >= ipThreshold;
    
    // Debug logging
    if (action === 'login') {
      console.log(`Login rate limit check: IP attempts=${ipAttempts?.length}, threshold=${ipThreshold}, limited=${isIpRateLimited}`);
    } else if (action === 'signup') {
      console.log(`Signup rate limit check: IP attempts=${ipAttempts?.length}, threshold=${ipThreshold}, limited=${isIpRateLimited}`);
    }
    
    // If either email or IP is rate limited, return 429
    if (isEmailRateLimited || isIpRateLimited) {
      let rateLimitReason = '';
      if (isEmailRateLimited) {
        rateLimitReason = `email address (${emailAttempts.length} attempts)`;
        console.log(`Rate limiting ${email} after ${emailAttempts.length} ${action === 'signup' ? '' : 'failed '}attempts`);
      } else {
        rateLimitReason = `IP address (${ipAttempts.length} attempts)`;
        if (action === 'signup') {
          console.log(`Rate limiting IP ${clientIp} after ${ipAttempts.length} signup attempts (limit: ${IP_SIGNUP_THRESHOLD})`);
        } else {
          console.log(`Rate limiting IP ${clientIp} after ${ipAttempts.length} failed login attempts`);
        }
      }
      
      console.log(`Returning 429 response due to ${rateLimitReason}`);
      
      // Make sure we specify the proper headers for the 429 response
      return new Response(
        JSON.stringify({ 
          rateLimit: true, 
          message: action === 'signup' 
            ? `Maximum of ${IP_SIGNUP_THRESHOLD} signup attempts per IP address allowed every 5 minutes.` 
            : isIpRateLimited 
              ? `Maximum of ${IP_LOGIN_THRESHOLD} failed login attempts per IP address allowed every 5 minutes.`
              : `Maximum of ${EMAIL_LOGIN_THRESHOLD} failed login attempts per email allowed every 5 minutes.`,
          reason: rateLimitReason,
          attemptsCount: isEmailRateLimited ? emailAttempts.length : ipAttempts.length,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '300' // 5 minutes in seconds
          } 
        }
      );
    }
    
    console.log(`User ${email} from IP ${clientIp} is not rate limited, returning 200 response`);
    return new Response(
      JSON.stringify({ rateLimit: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 