import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-record-failed-attempt',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, action } = await req.json();
    
    console.log(`------------------------------`);
    console.log(`Request received for ${email}, action: ${action}`);
    console.log(`Request method: ${req.method}, record failed attempt header: ${req.headers.get('x-record-failed-attempt')}`);
    
    if (!email) {
      console.log('Error: Email is required');
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
      console.log('Recording failed attempt for', email);
      const { error: insertError } = await supabaseAdmin
        .from('auth_rate_limits')
        .insert({ email, action });
        
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
      return new Response(
        JSON.stringify({ error: 'Error checking rate limits', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${attempts?.length || 0} recent failed attempts for ${email}`);
    
    // Check if rate limited
    if (attempts && attempts.length >= 3) {
      console.log(`Rate limiting ${email} after ${attempts.length} failed attempts`);
      console.log(`Returning 429 response`);
      
      // Make sure we specify the proper headers for the 429 response
      return new Response(
        JSON.stringify({ 
          rateLimit: true, 
          message: 'Too many failed attempts. Please try again after 5 minutes.',
          attemptsCount: attempts.length,
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
    
    console.log(`User ${email} is not rate limited, returning 200 response`);
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