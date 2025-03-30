import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LogDayLogo } from '../LogDayLogo';
import { AuthFooter } from './AuthFooter';
import { checkRateLimit, recordFailedAttempt, isRateLimited } from '../../utils/rateLimiting';

// Key for storing rate limit data in localStorage
const RATE_LIMIT_KEY = 'logday_rate_limit_data';

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
  
  // Load rate limit data from localStorage on component mount
  useEffect(() => {
    const loadRateLimitData = () => {
      try {
        const savedEmail = localStorage.getItem('lastLoginEmail') || '';
        if (savedEmail) {
          // If we have a saved email and current email is empty, use the saved one
          if (!email) {
            setEmail(savedEmail);
          }
          
          // Check for stored rate limit info
          const rateLimitData = localStorage.getItem(RATE_LIMIT_KEY);
          if (rateLimitData) {
            const { limited, email: limitedEmail, until } = JSON.parse(rateLimitData);
            
            // If this email is rate limited and the timeout hasn't expired
            if (limited && limitedEmail === savedEmail && until > Date.now()) {
              setIsRateLimitActive(true);
              setError(`Too many failed attempts. Please try again after ${new Date(until).toLocaleTimeString()}.`);
              return;
            } else if (until < Date.now()) {
              // Clear expired rate limit
              localStorage.removeItem(RATE_LIMIT_KEY);
            }
          }
          
          // Double-check with the server
          checkEmailRateLimit(savedEmail);
        }
      } catch (err) {
        console.error('Error loading rate limit data:', err);
      }
    };
    
    loadRateLimitData();
  }, []);
  
  // Save rate limit state to localStorage
  const setRateLimited = (emailToLimit: string, limitActive: boolean) => {
    setIsRateLimitActive(limitActive);
    
    if (limitActive) {
      // Set rate limit for 5 minutes
      const until = Date.now() + (5 * 60 * 1000);
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
        limited: true,
        email: emailToLimit,
        until
      }));
      
      setError(`Too many failed attempts. Please try again after ${new Date(until).toLocaleTimeString()}.`);
    } else {
      localStorage.removeItem(RATE_LIMIT_KEY);
    }
  };
  
  // Check if an email is rate limited with the server
  const checkEmailRateLimit = async (emailToCheck: string) => {
    if (!emailToCheck) return;
    
    try {
      console.log(`Checking rate limit for ${emailToCheck}`);
      const { rateLimit, message } = await checkRateLimit(emailToCheck, 'login');
      
      if (rateLimit) {
        console.log(`${emailToCheck} is rate limited!`);
        setRateLimited(emailToCheck, true);
      }
      
      return rateLimit;
    } catch (err) {
      console.error('Error checking rate limit:', err);
      return false;
    }
  };
  
  // Handle email changes - check for rate limits
  useEffect(() => {
    if (email) {
      // Check if this email is already known to be rate limited
      const rateLimitData = localStorage.getItem(RATE_LIMIT_KEY);
      if (rateLimitData) {
        const { limited, email: limitedEmail, until } = JSON.parse(rateLimitData);
        
        if (limited && limitedEmail === email && until > Date.now()) {
          // This email is already known to be rate limited
          setIsRateLimitActive(true);
          setError(`Too many failed attempts. Please try again after ${new Date(until).toLocaleTimeString()}.`);
          return;
        }
      }
      
      // Otherwise check with the server
      checkEmailRateLimit(email);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Block submission if rate limited
    if (isRateLimitActive) {
      console.log('Login blocked: Rate limit is active');
      return;
    }
    
    // Save email for rate limit checks
    localStorage.setItem('lastLoginEmail', email);
    
    try {
      setLoading(true);
      setError('');

      // Final check for rate limiting before attempting login
      const isLimited = await checkEmailRateLimit(email);
      if (isLimited) {
        setLoading(false);
        return; // Stop here if rate limited
      }

      // Attempt to sign in
      await signIn(email, password);
      
      // Redirect to the originally requested URL or default to home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Record failed login attempt and update rate limit status
      try {
        console.log('Login failed, recording attempt');
        await recordFailedAttempt(email, 'login');
        
        // Check if we are now rate limited after this failed attempt
        const { rateLimit } = await checkRateLimit(email, 'login');
        if (rateLimit) {
          console.log('Rate limit activated after failed attempt');
          setRateLimited(email, true);
        } else {
          if (err?.name === 'AuthApiError' && err?.status === 400) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError('Failed to sign in. Please check your credentials and try again.');
          }
        }
      } catch (recordError) {
        console.error('Error handling failed attempt:', recordError);
        setError('An error occurred. Please try again later.');
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