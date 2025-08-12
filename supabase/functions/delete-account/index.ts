import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user's JWT token
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the request body
    const { password }: RequestBody = await req.json()
    
    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify password by attempting to sign in (double-check security)
    const { error: passwordError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: password,
    })

    if (passwordError) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the account deletion attempt for audit purposes
    console.log(`Account deletion initiated for user: ${user.id} (${user.email})`)

    try {
      // Step 1: Delete all user data from custom tables
      // Delete workout logs and related data
      const { error: workoutError } = await supabaseAdmin
        .from('workout_logs')
        .delete()
        .eq('user_id', user.id)

      if (workoutError) {
        console.error('Error deleting workout logs:', workoutError)
        // Continue with deletion even if this fails
      }

      // Delete routines
      const { error: routinesError } = await supabaseAdmin
        .from('routines')
        .delete()
        .eq('user_id', user.id)

      if (routinesError) {
        console.error('Error deleting routines:', routinesError)
        // Continue with deletion even if this fails
      }

      // Delete custom exercises
      const { error: exercisesError } = await supabaseAdmin
        .from('custom_exercises')
        .delete()
        .eq('user_id', user.id)

      if (exercisesError) {
        console.error('Error deleting custom exercises:', exercisesError)
        // Continue with deletion even if this fails
      }

      // Delete user settings/preferences
      const { error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)

      if (settingsError) {
        console.error('Error deleting user settings:', settingsError)
        // Continue with deletion even if this fails
      }

      // Step 2: Delete the user account from auth.users
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

      if (deleteUserError) {
        console.error('Error deleting user from auth:', deleteUserError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to delete account. Please contact support.',
            details: deleteUserError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`Account successfully deleted for user: ${user.id} (${user.email})`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account deleted successfully' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } catch (dataError) {
      console.error('Error during data deletion:', dataError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete account data. Please contact support.',
          details: dataError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error in delete-account function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error. Please contact support.',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To deploy this function:
 * 1. Make sure you have the Supabase CLI installed
 * 2. Run: supabase functions deploy delete-account
 * 3. Set up the required environment variables:
 *    - SUPABASE_URL (should be automatically available)
 *    - SUPABASE_SERVICE_ROLE_KEY (should be automatically available)
 */