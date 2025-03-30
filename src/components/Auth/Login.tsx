import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LogDayLogo } from '../LogDayLogo';
import { AuthFooter } from './AuthFooter';
import { checkRateLimit, recordFailedAttempt, isRateLimited } from '../../utils/rateLimiting';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRateLimitActive, setIsRateLimitActive] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for rate limits when email changes
  useEffect(() => {
    // First, check if we have a saved email from previous login attempts
    const savedEmail = localStorage.getItem('lastLoginEmail') || '';
    
    if (savedEmail) {
      // If we have a saved email and current email is empty, use the saved one
      if (!email && savedEmail) {
        setEmail(savedEmail);
      }
      
      // Check for rate limits on the saved email
      const checkSavedEmailRateLimit = async () => {
        try {
          const isLimited = await isRateLimited(savedEmail, 'login');
          setIsRateLimitActive(isLimited);
          
          if (isLimited) {
            setError('Too many failed attempts. Please try again after 5 minutes.');
          }
        } catch (err) {
          console.error('Error checking initial rate limit:', err);
        }
      };
      
      checkSavedEmailRateLimit();
    }
  }, []);
  
  // Check for rate limits when the email changes
  useEffect(() => {
    if (email) {
      const checkCurrentEmailRateLimit = async () => {
        try {
          const isLimited = await isRateLimited(email, 'login');
          setIsRateLimitActive(isLimited);
          
          if (isLimited && !error) {
            setError('Too many failed attempts. Please try again after 5 minutes.');
          } else if (!isLimited && error === 'Too many failed attempts. Please try again after 5 minutes.') {
            setError('');
          }
        } catch (err) {
          console.error('Error checking rate limit on email change:', err);
        }
      };
      
      checkCurrentEmailRateLimit();
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save email for rate limit checks
    localStorage.setItem('lastLoginEmail', email);
    
    try {
      setError('');
      setLoading(true);

      // Check if user is rate limited
      console.log('Checking rate limit before login attempt');
      const { rateLimit, message } = await checkRateLimit(email, 'login');
      console.log('Rate limit check result:', { rateLimit, message });
      
      if (rateLimit) {
        setIsRateLimitActive(true);
        setError(message || 'Too many failed attempts. Please try again after 5 minutes.');
        setLoading(false);
        return;
      }

      // Attempt to sign in
      await signIn(email, password);
      
      // Redirect to the originally requested URL or default to home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      // Record failed login attempt
      console.log('Login failed, recording attempt');
      await recordFailedAttempt(email, 'login');
      
      // Check if we are now rate limited after this failed attempt
      const { rateLimit, message } = await checkRateLimit(email, 'login');
      if (rateLimit) {
        setIsRateLimitActive(true);
        setError(message || 'Too many failed attempts. Please try again after 5 minutes.');
      } else {
        if (err?.name === 'AuthApiError' && err?.status === 400) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError('Failed to sign in. Please check your credentials and try again.');
        }
      }
      
      console.error('Sign in error:', err);
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
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Make sure nobody is looking"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isRateLimitActive}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || isRateLimitActive
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Signing in...' : (isRateLimitActive ? 'Too many attempts' : 'Sign in')}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};