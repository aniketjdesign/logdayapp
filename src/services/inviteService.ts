import { supabase } from '../config/supabase';

interface InviteCode {
  code: string;
  max_uses: number;
  remaining_uses: number;
  created_at: string;
}

export const validateInviteCode = async (code: string): Promise<{ 
  valid: boolean; 
  message: string;
}> => {
  try {
    if (!code) {
      return { 
        valid: false, 
        message: 'Invite code is required' 
      };
    }

    const { data, error } = await supabase
      .from('invite_codes')
      .select('code, remaining_uses, max_uses, created_at')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (error) {
      throw new Error('Error validating invite code');
    }

    if (!data) {
      return { 
        valid: false, 
        message: 'Invalid invite code' 
      };
    }

    if (data.remaining_uses <= 0) {
      return { 
        valid: false, 
        message: 'This invite code has reached its usage limit' 
      };
    }

    return { 
      valid: true, 
      message: 'Valid invite code' 
    };
  } catch (error) {
    return { 
      valid: false, 
      message: 'Error validating invite code. Please try again.' 
    };
  }
};

export const markInviteCodeAsUsed = async (code: string, userId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    if (!code) {
      return {
        success: false,
        message: 'Invite code is required'
      };
    }

    if (!userId) {
      return {
        success: false,
        message: 'User ID is required'
      };
    }

    // First, get the current state of the invite code
    const { data: inviteCode, error: fetchError } = await supabase
      .from('invite_codes')
      .select('code, remaining_uses')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!inviteCode) throw new Error('Invite code not found');
    
    if (inviteCode.remaining_uses <= 0) {
      return {
        success: false,
        message: 'This invite code has reached its usage limit'
      };
    }

    // Update the invite code
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ 
        remaining_uses: inviteCode.remaining_uses - 1
      })
      .eq('code', code.toUpperCase());

    if (updateError) throw updateError;

    return {
      success: true,
      message: 'Invite code successfully used'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error processing invite code. Please try again.'
    };
  }
};