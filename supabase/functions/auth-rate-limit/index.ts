import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, action } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Check for rate limits in a Supabase table
    const tableName = 'auth_rate_limits';
    
    // Get current timestamp minus 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
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
        JSON.stringify({ error: 'Error checking rate limits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if rate limited
    if (attempts && attempts.length >= 3) {
      return new Response(
        JSON.stringify({ 
          rateLimit: true, 
          message: 'Too many failed attempts. Please try again after 5 minutes.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For "recordFailedAttempt" action, record the attempt
    if (req.method === 'POST' && req.url.includes('recordFailedAttempt')) {
      const { error: insertError } = await supabaseAdmin
        .from(tableName)
        .insert({ email, action });
        
      if (insertError) {
        console.error('Error recording failed attempt:', insertError);
        return new Response(
          JSON.stringify({ error: 'Error recording failed attempt' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ rateLimit: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 