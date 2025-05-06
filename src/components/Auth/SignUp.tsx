import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { LogDayLogo } from '../LogDayLogo';

export const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Add fade-in animation effect
    setFadeIn(true);
  }, []);

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

    try {
      setError('');
      setLoading(true);

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
    <div className="pb-20 h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 safe-area-inset-top safe-area-inset-bottom">
      <div 
        className={`max-w-md w-full space-y-8 bg-white px-4 py-6 md:p-8 rounded-2xl shadow-sm transition-opacity duration-500 ease-in-out ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="text-center">
          <div className="flex justify-center">
            <LogDayLogo className="h-16 w-16 text-blue-600" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tighter text-gray-800">
            Create your account
          </h2>
          <p className="text-sm text-gray-500">
            Commit to your fitness journey with Logday
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative flex items-center animate-pulse-once" role="alert">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="block sm:inline text-sm">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email-address" className="block pl-0.5 text-sm text-gray-600 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="ronnie@coleman.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block pl-0.5 text-sm text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors duration-200 pr-10"
                  placeholder="•••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block pl-0.5 text-sm text-gray-600 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors duration-200 pr-10"
                  placeholder="•••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border !border-gray-300 rounded-xl transition-colors duration-200"
                />
              </div>
              <div className="ml-2 text-sm">
                <label htmlFor="terms" className="text-gray-500">
                  I accept the <a href="/terms" className="text-gray-600 font-medium hover:text-blue-500 transition-colors duration-200">Terms of Use</a> and <a href="/privacy" className="text-gray-600 font-medium hover:text-blue-500 transition-colors duration-200">Privacy Policy</a>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || error.includes('Too many signup attempts') || error.includes('Too many failed attempts')}
              className={`group relative w-full flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-xl text-white transition-all duration-200 ${
                loading || error.includes('Too many signup attempts') || error.includes('Too many failed attempts') 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center">
                  Sign up
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              )}
            </button>
          </div>

          <div className="text-sm text-center">
            <span className="text-gray-600">
              Already have an account?{" "}
            </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};