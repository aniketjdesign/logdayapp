import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Redis } from 'https://deno.land/x/upstash_redis@v1.20.6/mod.ts';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client with Upstash
let redis;
try {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  
  console.log('Redis URL:', redisUrl ? 'Set (length: ' + redisUrl.length + ')' : 'Not set');
  console.log('Redis token:', redisToken ? 'Set (length: ' + redisToken.length + ')' : 'Not set');
  
  if (!redisUrl || !redisToken) {
    throw new Error('Redis credentials are missing. Please check the environment variables.');
  }
  
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
  
  // Test the connection
  console.log('Testing Redis connection...');
  redis.set('connection_test', 'ok').then(() => {
    console.log('Redis connection successful!');
  }).catch((error) => {
    console.error('Redis connection test failed:', error);
  });
} catch (error) {
  console.error('Redis initialization error:', error);
  redis = null; // Set to null so we can check later if Redis is available
}

// Define rate limiters - use sliding window for both for consistency
const ipLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, '5 m'), // 2 signup attempts per IP every 5 minutes
  analytics: true,
  prefix: '@logday/signup-ip',
}) : null;

const emailLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'), // 3 failed attempts per email in 60 minutes
  analytics: true,
  prefix: '@logday/signup-email',
}) : null;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if Redis is initialized
    if (!redis || !ipLimiter || !emailLimiter) {
      console.error('Redis is not properly initialized, bypassing rate limiting');
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          message: 'Rate limiting service unavailable', 
          error: 'Redis connection failed' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { action, email, testIdentifier } = body;
    
    // Get client IP address (with Supabase handling)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    console.log('Client IP:', clientIP);

    // Check rate limit based on action
    if (action === 'check_signup_limits') {
      // Use testIdentifier if provided (for testing), otherwise use client IP
      const ipIdentifier = testIdentifier || clientIP;
      console.log(`Checking IP limit for: ${ipIdentifier}`);
      
      // Check IP-based rate limit first
      const ipRateLimit = await ipLimiter.limit(ipIdentifier);
      console.log('IP rate limit result:', JSON.stringify(ipRateLimit));
      
      if (!ipRateLimit.success) {
        console.log(`IP rate limit exceeded for ${ipIdentifier}`);
        return new Response(
          JSON.stringify({ 
            allowed: false,
            reason: 'ip_limit',
            remaining: ipRateLimit.remaining,
            reset: ipRateLimit.reset,
            limit: ipRateLimit.limit
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Email limits are only checked when an email is provided
      if (email) {
        const emailHash = await digestMessage(email.toLowerCase());
        console.log(`Checking email limit for hash: ${emailHash}`);
        const emailRateLimit = await emailLimiter.limit(emailHash);
        console.log('Email rate limit result:', JSON.stringify(emailRateLimit));

        if (!emailRateLimit.success) {
          console.log(`Email rate limit exceeded for ${email} (${emailHash})`);
          return new Response(
            JSON.stringify({ 
              allowed: false,
              reason: 'email_limit',
              remaining: emailRateLimit.remaining,
              reset: emailRateLimit.reset,
              limit: emailRateLimit.limit
            }),
            { 
              status: 429, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // If we get here, rate limit checks passed
      return new Response(
        JSON.stringify({ allowed: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } 
    else if (action === 'record_failed_signup') {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Hash the email for privacy
      const emailHash = await digestMessage(email.toLowerCase());
      console.log(`Recording failed signup for hash: ${emailHash}`);

      // Record a failed signup attempt for this email
      // Use consume() instead of limit() to ensure it counts against the limit without checking
      const rateLimitResult = await emailLimiter.limit(emailHash);
      console.log('Email record result:', JSON.stringify(rateLimitResult));

      return new Response(
        JSON.stringify({ 
          success: true,
          remaining: rateLimitResult.remaining,
          limit: rateLimitResult.limit
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    else if (action === 'reset_limits') {
      // Only for testing/debugging - allow resetting limits
      if (email) {
        const emailHash = await digestMessage(email.toLowerCase());
        await redis.del(`@logday/signup-email:${emailHash}`);
      }
      if (testIdentifier) {
        await redis.del(`@logday/signup-ip:${testIdentifier}`);
      } else {
        await redis.del(`@logday/signup-ip:${clientIP}`);
      }
      return new Response(
        JSON.stringify({ success: true, message: 'Limits reset' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Rate limit error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to hash the email for privacy reasons
async function digestMessage(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
} 