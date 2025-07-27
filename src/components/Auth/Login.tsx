import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { LogDayLogo } from '../others/LogDayLogo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Add fade-in animation effect
    setFadeIn(true);
  }, []);

  // Function to check rate limits
  const checkRateLimits = async (email: string) => {
    try {
      // Check rate limits before login
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-ratelimit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'check_login_limits',
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limit error
          return { allowed: false, reason: data.reason };
        }
        
        return { allowed: false, reason: 'unknown' };
      }

      return { allowed: true };
    } catch (error) {
      // Allow on error to prevent blocking legitimate users
      return { allowed: true };
    }
  };

  // Function to record failed login attempt
  const recordFailedLogin = async (email: string) => {
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
            action: 'record_failed_login',
            email,
          }),
        }
      );

      await response.json();
    } catch (error) {
      // Silent fail - we don't want to block login if recording fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);

      // Check rate limits before attempting login
      const rateLimitCheck = await checkRateLimits(email);
      if (!rateLimitCheck.allowed) {
        if (rateLimitCheck.reason === 'ip_limit') {
          setError('Too many login attempts. Please try again in a few minutes.');
        } else if (rateLimitCheck.reason === 'email_limit') {
          setError('Too many failed login attempts for this email. Please try again later or reset your password.');
        } else {
          setError('Login temporarily unavailable. Please try again later.');
        }
        return;
      }

      // Attempt to sign in
      await signIn(email, password);
      
      // Redirect to the originally requested URL or default to home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Record failed login attempt
      await recordFailedLogin(email);
      
      // Set appropriate error message based on error type
      if (err?.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (err?.name === 'AuthApiError' && err?.status === 400) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('Failed to sign in: ' + (err?.message || 'Please check your credentials and try again.'));
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
          <h2 className="mt-4 text-2xl font-semibold text-gray-800 tracking-tighter">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500">
            Time to lock in your progress
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-center animate-pulse-once" role="alert">
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block pl-0.5 text-sm text-gray-600">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
            <div className="text-sm !mt-3 pl-0.5">
                  <Link to="/reset-password" className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                    Forgot password?
                  </Link>
                </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || error.includes('Too many login attempts') || error.includes('Too many failed login attempts')}
              className={`group relative w-full flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-xl text-white transition-all duration-200 ${
                loading || error.includes('Too many login attempts') || error.includes('Too many failed login attempts') 
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
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center">
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              )}
            </button>
          </div>

          <div className="text-sm text-center">
            <span className="text-gray-600">
              Don't have an account?{" "}
            </span>
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
              Sign up
            </Link>
          </div>
        </form>
      </div>
      
    </div>
  );
};