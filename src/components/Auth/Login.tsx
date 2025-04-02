import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LogDayLogo } from '../LogDayLogo';
import { AuthFooter } from './AuthFooter';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Function to check rate limits
  const checkRateLimits = async (email: string) => {
    try {
      console.log('Checking rate limits for login...');
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

      if (response.status === 429) {
        const data = await response.json();
        console.log('Rate limit exceeded:', data);
        return { allowed: false, reason: data.reason };
      }

      const data = await response.json();
      console.log('Rate limit check response:', data);
      return data;
    } catch (error) {
      console.error('Error checking rate limits:', error);
      // Gracefully degrade - if rate limiting fails, allow the login
      return { allowed: true, error: 'Rate limiting service unavailable' };
    }
  };

  // Function to record failed login attempts
  const recordFailedLogin = async (email: string) => {
    try {
      console.log('Recording failed login attempt...');
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

      const data = await response.json();
      console.log('Record failed login response:', data);
      return data;
    } catch (error) {
      console.error('Error recording failed login:', error);
      return { success: false, error: 'Failed to record login attempt' };
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
      console.log('Attempting to sign in with email:', email);
      await signIn(email, password);
      console.log('Sign in successful, navigating...');
      
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 safe-area-inset-top safe-area-inset-bottom">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <LogDayLogo className="h-16 w-16" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome to Logday
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Never skip log day
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
                  autoComplete="current-password"
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
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-sm text-center">
            <span className="text-gray-600">
              Don't have an account?{" "}
            </span>
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>
        </form>

        <AuthFooter />
      </div>
    </div>
  );
};