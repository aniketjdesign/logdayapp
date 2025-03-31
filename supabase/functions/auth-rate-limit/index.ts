import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Deno type declarations to fix linter errors
declare namespace Deno {
  interface Kv {
    get(key: unknown): Promise<unknown>;
    set(key: unknown, value: unknown): Promise<unknown>;
    delete(key: unknown): Promise<unknown>;
    list(options?: { prefix: unknown[] }): AsyncIterable<{ key: unknown; value: unknown }>;
    atomic(): {
      set(key: unknown, value: unknown): { commit(): Promise<unknown> };
    };
  }
  
  function openKv(): Promise<Kv>;
  
  namespace env {
    function get(key: string): string | undefined;
  }
}

// Optional KV store for caching rate limit data
// This provides an additional layer of persistence even if the edge function restarts
let kv: Deno.Kv | null = null;
try {
  kv = await Deno.openKv();
  console.log('Successfully opened Deno KV store');
} catch (error) {
  console.warn('Could not open Deno KV store, falling back to database only:', error);
}

// Type definitions for rate limiting data
interface RateLimitAttempt {
  created_at: string;
  [key: string]: any;
}

interface KvEntry {
  key: unknown;
  value: {
    timestamp: number;
    expiry: number;
  };
}

interface RateLimitResult {
  count: number;
  attempts: RateLimitAttempt[];
  mostRecentTimestamp: number | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-record-failed-attempt, x-real-ip, x-forwarded-for',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Rate limit thresholds
const EMAIL_LOGIN_THRESHOLD = 3;  // 3 failed login attempts per email
const EMAIL_SIGNUP_THRESHOLD = 3; // 3 failed signup attempts per email (for existing emails)
const IP_LOGIN_THRESHOLD = 10;    // 10 failed login attempts per IP
const IP_SIGNUP_THRESHOLD = 2;    // 2 signup attempts (failed or successful) per IP every 5 minutes
const RATE_LIMIT_WINDOW_MINUTES = 5; // Rate limit window in minutes

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Add health check endpoint to monitor function status
  const url = new URL(req.url);
  if (url.pathname === "/health") {
    return new Response(
      JSON.stringify({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        kvStore: kv ? "available" : "unavailable"
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse the request body
    const requestBody = await req.json().catch(err => {
      console.error('Error parsing request body:', err);
      return {};
    });
    
    const { email, action, checkIpOnly } = requestBody;
    
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

    if (!action) {
      console.log('Error: Action is required');
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
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
      
      try {
        // Store in KV store if available (for redundancy)
        if (kv) {
          const emailKey = `rate_limit:${action}:email:${email}`;
          const ipKey = `rate_limit:${action}:ip:${clientIp}`;
          const expiry = Date.now() + (RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
          
          // We store these in parallel for efficiency
          const kvPromises: Promise<unknown>[] = [];
          
          if (email) {
            kvPromises.push(
              kv.atomic()
                .set([emailKey, Date.now()], { timestamp: Date.now(), expiry })
                .commit()
            );
          }
          
          kvPromises.push(
            kv.atomic()
              .set([ipKey, Date.now()], { timestamp: Date.now(), expiry })
              .commit()
          );
          
          await Promise.all(kvPromises);
          console.log('Stored rate limit data in KV store');
        }
        
        // Also store in the database (primary storage)
        const { error: insertError } = await supabaseAdmin
          .from('auth_rate_limits')
          .insert({ 
            email, 
            action,
            ip_address: clientIp 
          });
          
        if (insertError) {
          console.error('Error recording failed attempt in database:', insertError);
          
          // If we have KV store, we can still continue since we have that data
          if (!kv) {
            return new Response(
              JSON.stringify({ error: 'Error recording failed attempt', details: insertError }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        
        console.log('Successfully recorded failed attempt');
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error recording failed attempt:', error);
        return new Response(
          JSON.stringify({ error: 'Error recording failed attempt', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Get current timestamp minus rate limit window
    const windowStartTime = new Date();
    windowStartTime.setMinutes(windowStartTime.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);
    
    // Calculate time remaining for rate limited users
    const calculateTimeRemaining = (attempts: RateLimitAttempt[], mostRecentTimestamp: number | null = null) => {
      if ((!attempts || attempts.length === 0) && !mostRecentTimestamp) return RATE_LIMIT_WINDOW_MINUTES * 60; // Default
      
      let mostRecentTime: Date;
      
      if (mostRecentTimestamp) {
        mostRecentTime = new Date(mostRecentTimestamp);
      } else {
        // Find the most recent attempt from database records
        const mostRecent = attempts.reduce((latest, current) => {
          const latestDate = new Date(latest.created_at);
          const currentDate = new Date(current.created_at);
          return currentDate > latestDate ? current : latest;
        }, attempts[0]);
        
        mostRecentTime = new Date(mostRecent.created_at);
      }
      
      const resetTime = new Date(mostRecentTime);
      resetTime.setMinutes(resetTime.getMinutes() + RATE_LIMIT_WINDOW_MINUTES);
      
      const now = new Date();
      const remainingMs = resetTime.getTime() - now.getTime();
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      
      return remainingSeconds;
    };
    
    // Function to get rate limit attempts combining KV and database
    const getRateLimitAttempts = async (type: string, value: string, action: string): Promise<RateLimitResult> => {
      let kvAttempts: KvEntry[] = [];
      let kvMostRecent: number | null = null;
      
      // First check KV store if available
      if (kv) {
        try {
          const key = `rate_limit:${action}:${type}:${value}`;
          const entries = kv.list({ prefix: [key] });
          
          let validEntries: KvEntry[] = [];
          for await (const entry of entries) {
            // Type assertion to access the entry value properties safely
            const entryValue = entry.value as { timestamp: number; expiry: number };
            // Check if entry is expired
            if (entryValue.expiry > Date.now()) {
              validEntries.push({
                key: entry.key,
                value: entryValue
              });
            }
          }
          
          kvAttempts = validEntries;
          
          // Find most recent timestamp
          if (validEntries.length > 0) {
            kvMostRecent = Math.max(...validEntries.map(entry => entry.value.timestamp));
          }
          
          console.log(`Found ${validEntries.length} valid entries in KV store for ${type}:${value}`);
        } catch (error) {
          console.error(`Error fetching KV store data for ${type}:${value}:`, error);
          // Continue with database lookup
        }
      }
      
      // Then check database
      const field = type === 'email' ? 'email' : 'ip_address';
      const { data: dbAttempts, error: fetchError } = await supabaseAdmin
        .from('auth_rate_limits')
        .select('*')
        .eq(field, value)
        .eq('action', action)
        .gte('created_at', windowStartTime.toISOString())
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error(`Error fetching ${type} rate limit data from database:`, fetchError);
        
        // If we have KV data, we can still use that
        if (kvAttempts.length > 0) {
          return { 
            count: kvAttempts.length,
            attempts: [],
            mostRecentTimestamp: kvMostRecent
          };
        }
        
        throw fetchError;
      }
      
      // Combine counts, with database as source of truth but KV as backup
      const dbCount = dbAttempts?.length || 0;
      const kvCount = kvAttempts.length;
      
      // Use the higher of the two counts to be safe
      const combinedCount = Math.max(dbCount, kvCount);
      
      console.log(`${type} attempts - DB: ${dbCount}, KV: ${kvCount}, Combined: ${combinedCount}`);
      
      return {
        count: combinedCount,
        attempts: dbAttempts || [],
        mostRecentTimestamp: kvMostRecent
      };
    };
    
    // If this is a request to check IP-only rate limiting, only check IP-based limits
    if (checkIpOnly) {
      console.log(`IP-only check requested for ${action}, checking IP ${clientIp} only`);
      
      try {
        const threshold = action === 'signup' ? IP_SIGNUP_THRESHOLD : IP_LOGIN_THRESHOLD;
        
        // Get IP-based attempts
        const { count: ipAttemptsCount, attempts: ipAttempts, mostRecentTimestamp } = 
          await getRateLimitAttempts('ip', clientIp, action);
        
        console.log(`Found ${ipAttemptsCount} ${action} attempts for IP ${clientIp} in the last ${RATE_LIMIT_WINDOW_MINUTES} minutes`);
        const isAtLimit = ipAttemptsCount >= threshold;
        
        if (isAtLimit) {
          console.log(`IP ${clientIp} is at the ${action} limit with ${ipAttemptsCount} attempts (threshold: ${threshold})`);
          const timeRemaining = calculateTimeRemaining(ipAttempts, mostRecentTimestamp);
          return new Response(
            JSON.stringify({ 
              rateLimit: true, 
              message: `Maximum of ${threshold} ${action === 'login' ? 'failed login' : 'signup'} attempts per IP address allowed every ${RATE_LIMIT_WINDOW_MINUTES} minutes.`,
              reason: `IP address (${ipAttemptsCount} attempts)`,
              attemptsCount: ipAttemptsCount,
              timeRemaining
            }),
            { 
              status: 429, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': timeRemaining.toString() } 
            }
          );
        }
        
        console.log(`IP ${clientIp} is not at the ${action} limit (${ipAttemptsCount}/${threshold})`);
        return new Response(
          JSON.stringify({ rateLimit: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error checking IP rate limits:', error);
        return new Response(
          JSON.stringify({ error: 'Error checking IP rate limits', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // For non-IP-only checks, check both email and IP limits
    try {
      console.log('Checking for failed attempts since', windowStartTime.toISOString());
      
      // 1. Check for email-based rate limiting
      let emailAttemptsData: RateLimitResult;
      try {
        emailAttemptsData = await getRateLimitAttempts('email', email, action);
      } catch (error) {
        console.error('Error fetching email rate limit data:', error);
        emailAttemptsData = { count: 0, attempts: [], mostRecentTimestamp: null };
      }
      
      // 2. Check for IP-based rate limiting
      let ipAttemptsData: RateLimitResult;
      try {
        ipAttemptsData = await getRateLimitAttempts('ip', clientIp, action);
      } catch (error) {
        console.error('Error fetching IP rate limit data:', error);
        ipAttemptsData = { count: 0, attempts: [], mostRecentTimestamp: null };
      }
      
      const emailAttemptsCount = emailAttemptsData.count;
      const ipAttemptsCount = ipAttemptsData.count;
      
      console.log(`Found ${emailAttemptsCount} recent attempts for email ${email}`);
      console.log(`Found ${ipAttemptsCount} recent attempts for IP ${clientIp}`);
      
      // Determine thresholds based on action type
      const emailThreshold = action === 'signup' ? EMAIL_SIGNUP_THRESHOLD : EMAIL_LOGIN_THRESHOLD;
      const ipThreshold = action === 'signup' ? IP_SIGNUP_THRESHOLD : IP_LOGIN_THRESHOLD;
      
      // Check if rate limited by email
      const isEmailRateLimited = emailAttemptsCount >= emailThreshold;
      
      // Check if rate limited by IP
      const isIpRateLimited = ipAttemptsCount >= ipThreshold;
      
      // Debug logging
      if (action === 'login') {
        console.log(`Login rate limit check: IP attempts=${ipAttemptsCount}, threshold=${ipThreshold}, limited=${isIpRateLimited}`);
        console.log(`Login rate limit check: Email attempts=${emailAttemptsCount}, threshold=${emailThreshold}, limited=${isEmailRateLimited}`);
      } else if (action === 'signup') {
        console.log(`Signup rate limit check: IP attempts=${ipAttemptsCount}, threshold=${ipThreshold}, limited=${isIpRateLimited}`);
        console.log(`Signup rate limit check: Email attempts=${emailAttemptsCount}, threshold=${emailThreshold}, limited=${isEmailRateLimited}`);
      }
      
      // If either email or IP is rate limited, return 429
      if (isEmailRateLimited || isIpRateLimited) {
        let rateLimitReason = '';
        let attemptsCount = 0;
        let timeRemaining = RATE_LIMIT_WINDOW_MINUTES * 60;
        
        if (isEmailRateLimited) {
          rateLimitReason = `email address (${emailAttemptsCount} attempts)`;
          attemptsCount = emailAttemptsCount;
          timeRemaining = calculateTimeRemaining(
            emailAttemptsData.attempts, 
            emailAttemptsData.mostRecentTimestamp
          );
          console.log(`Rate limiting ${email} after ${emailAttemptsCount} ${action === 'signup' ? '' : 'failed '}attempts`);
        } else {
          rateLimitReason = `IP address (${ipAttemptsCount} attempts)`;
          attemptsCount = ipAttemptsCount;
          timeRemaining = calculateTimeRemaining(
            ipAttemptsData.attempts,
            ipAttemptsData.mostRecentTimestamp
          );
          if (action === 'signup') {
            console.log(`Rate limiting IP ${clientIp} after ${ipAttemptsCount} signup attempts (limit: ${IP_SIGNUP_THRESHOLD})`);
          } else {
            console.log(`Rate limiting IP ${clientIp} after ${ipAttemptsCount} failed login attempts`);
          }
        }
        
        console.log(`Returning 429 response due to ${rateLimitReason}`);
        
        // Make sure we specify the proper headers for the 429 response
        return new Response(
          JSON.stringify({ 
            rateLimit: true, 
            message: action === 'signup' 
              ? `Maximum of ${IP_SIGNUP_THRESHOLD} signup attempts per IP address allowed every ${RATE_LIMIT_WINDOW_MINUTES} minutes.` 
              : isIpRateLimited 
                ? `Maximum of ${IP_LOGIN_THRESHOLD} failed login attempts per IP address allowed every ${RATE_LIMIT_WINDOW_MINUTES} minutes.`
                : `Maximum of ${EMAIL_LOGIN_THRESHOLD} failed login attempts per email allowed every ${RATE_LIMIT_WINDOW_MINUTES} minutes.`,
            reason: rateLimitReason,
            attemptsCount,
            timeRemaining
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': timeRemaining.toString()
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
      console.error('Error processing rate limit check:', error);
      return new Response(
        JSON.stringify({ error: 'Error checking rate limits', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 