import React, { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LogDayLogo } from '../LogDayLogo';
import { AuthFooter } from './AuthFooter';
import { validateInviteCode, markInviteCodeAsUsed } from '../../services/inviteService';

export const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  // Create refs for the invite code inputs
  const inviteInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Function to check rate limits
  const checkRateLimits = async (email: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-ratelimit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'check_signup_limits',
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limit error
          if (data.reason === 'ip_limit') {
            const minutes = Math.ceil((data.reset - Date.now()) / 60000);
            return {
              allowed: false,
              message: `Too many signup attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
            };
          } else if (data.reason === 'email_limit') {
            return {
              allowed: false,
              message: 'Too many failed attempts for this email. Please try again later or use a different email.',
            };
          }
        }
        
        return {
          allowed: false,
          message: data.error || 'Rate limit check failed. Please try again later.',
        };
      }

      return { allowed: true };
    } catch (error) {
      return {
        allowed: true, // Allow on error to prevent blocking legitimate users
        message: 'Rate limit service unavailable. Proceeding with signup.',
      };
    }
  };

  // Function to record failed signup attempt
  const recordFailedSignup = async (email: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-ratelimit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'record_failed_signup',
            email,
          }),
        }
      );

      await response.json();
    } catch (error) {
      // Silent fail - we don't want to block signup if recording fails
    }
  };

  // Function to handle invite code input changes
  const handleInviteCodeChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Update the invite code state
    const newInviteCode = [...inviteCode];
    newInviteCode[index] = sanitizedValue.slice(0, 1); // Only take the first character
    setInviteCode(newInviteCode);
    
    // If we have a value and it's not the last input, move to the next input
    if (sanitizedValue && index < 5) {
      inviteInputRefs[index + 1].current?.focus();
    }
  };

  // Function to handle backspace key
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // If backspace is pressed and the current input is empty, move to the previous input
    if (e.key === 'Backspace' && !inviteCode[index] && index > 0) {
      inviteInputRefs[index - 1].current?.focus();
    }
  };

  // Function to handle paste event
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    
    if (pastedData) {
      const newInviteCode = [...inviteCode];
      for (let i = 0; i < pastedData.length; i++) {
        if (i < 6) {
          newInviteCode[i] = pastedData[i];
        }
      }
      setInviteCode(newInviteCode);
      
      // Focus the appropriate input after paste
      if (pastedData.length < 6) {
        inviteInputRefs[pastedData.length].current?.focus();
      } else {
        inviteInputRefs[5].current?.blur();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError('Please accept the Terms of Use and Privacy Policy');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Check if all invite code fields are filled
    const combinedInviteCode = inviteCode.join('');
    if (combinedInviteCode.length !== 6) {
      setError('Please enter a valid 6-digit invite code');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Validate invite code
      const inviteCodeValidation = await validateInviteCode(combinedInviteCode);
      if (!inviteCodeValidation.valid) {
        setError(inviteCodeValidation.message);
        return;
      }

      // Check rate limits before attempting signup
      const rateLimitCheck = await checkRateLimits(email);
      
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message || 'Rate limit exceeded. Please try again later.');
        return;
      }

      // Create user account
      const response = await signUp(email, password);

      if (response.error) {
        // Record the failed signup attempt
        await recordFailedSignup(email);
        
        throw response.error;
      }

      // Mark invite code as used if user was created
      if (response.data.user?.id) {
        const { success, message } = await markInviteCodeAsUsed(combinedInviteCode, response.data.user.id);
        if (!success) {
          console.error('Failed to mark invite code as used:', message);
          // We don't want to block signup if this fails, so just log it
        }
      }

      // Navigate to login
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please check your email to verify your account before logging in.' 
        } 
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Set appropriate error message
      if (err?.message?.includes('User already registered')) {
        setError('This email is already registered. Please use another email or try to log in.');
      } else {
        setError('Failed to sign up: ' + (err.message || 'Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 safe-area-inset-top safe-area-inset-bottom">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <LogDayLogo className="h-16 w-16" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Your Account
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Join Logday today
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-normal text-gray-500 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="ronnie@coleman.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-normal text-gray-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10"
                  placeholder="•••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-normal text-gray-500 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10"
                  placeholder="•••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="invite-code" className="block text-sm font-normal text-gray-500 mb-1">
                Invite Code
              </label>
              <div className="flex space-x-2">
                {inviteCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={inviteInputRefs[index]}
                    type="text"
                    maxLength={1}
                    required
                    className="appearance-none rounded-lg relative block w-full px-0 py-2 border border-gray-300 text-center text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    value={digit}
                    onChange={(e) => handleInviteCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-600">
                  I accept the <a href="/terms" className="text-blue-600 hover:text-blue-500">Terms of Use</a> and <a href="/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || error.includes('Too many signup attempts') || error.includes('Too many failed attempts')}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading || error.includes('Too many signup attempts') || error.includes('Too many failed attempts') 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>

          <div className="text-sm text-center">
            <span className="text-gray-600">
              Already have an account?{" "}
            </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </form>

        <AuthFooter />
      </div>
    </div>
  );
};