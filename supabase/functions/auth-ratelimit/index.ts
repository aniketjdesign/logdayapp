import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Redis } from 'https://deno.land/x/upstash_redis@v1.20.6/mod.ts';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client with Upstash
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
});

// Define rate limiters
const ipLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, '5 m'), // 2 signup attempts per IP every 5 minutes
  analytics: true,
  prefix: '@logday/signup-ip',
});

const emailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, '1 h'), // 3 failed attempts per email in 1 hour
  analytics: true,
  prefix: '@logday/signup-email',
});

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

    // Parse request body
    const body = await req.json();
    const { action, email } = body;
    
    // Get client IP address (with Supabase handling)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Check rate limit based on action
    if (action === 'check_signup_limits') {
      // Check IP-based rate limit first
      const ipRateLimit = await ipLimiter.limit(clientIP);
      
      if (!ipRateLimit.success) {
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
        const emailRateLimit = await emailLimiter.limit(emailHash);

        if (!emailRateLimit.success) {
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

      // Record a failed signup attempt for this email
      await emailLimiter.limit(emailHash);

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
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
      JSON.stringify({ error: 'Internal server error' }),
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