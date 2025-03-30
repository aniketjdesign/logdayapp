import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { LogDayLogo } from '../LogDayLogo';
import { AuthFooter } from './AuthFooter';
import { checkRateLimit, recordFailedAttempt, isRateLimited } from '../../utils/rateLimiting';

// Key for storing rate limit data in localStorage
const RATE_LIMIT_KEY = 'logday_rate_limit_data';
const RATE_LIMIT_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRateLimitActive, setIsRateLimitActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Format time remaining as MM:SS
  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return '00:00';
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Start countdown timer for rate limit
  const startRateLimitCountdown = (endTimeMs: number) => {
    // Clear any existing timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    // Calculate initial time remaining
    const updateTimeRemaining = () => {
      const remaining = endTimeMs - Date.now();
      if (remaining <= 0) {
        // Time's up, clear rate limit
        setIsRateLimitActive(false);
        setTimeRemaining(0);
        setError('');
        localStorage.removeItem(RATE_LIMIT_KEY);
        window.clearInterval(timerRef.current!);
        timerRef.current = null;
      } else {
        setTimeRemaining(remaining);
      }
    };
    
    // Set initial value
    updateTimeRemaining();
    
    // Update every second
    timerRef.current = window.setInterval(updateTimeRemaining, 1000);
  };
  
  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);
  
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
              startRateLimitCountdown(until);
              return;
            } else if (until < Date.now()) {
              // Clear expired rate limit
              localStorage.removeItem(RATE_LIMIT_KEY);
            }
          }
          
          // Only check with server if no valid localStorage data exists
          // Remove this check to prevent unnecessary API calls on mount
          // checkEmailRateLimit(savedEmail);
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
      const until = Date.now() + RATE_LIMIT_DURATION_MS;
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
        limited: true,
        email: emailToLimit,
        until
      }));
      
      // Start countdown timer
      startRateLimitCountdown(until);
    } else {
      localStorage.removeItem(RATE_LIMIT_KEY);
      // Clear timer if exists
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeRemaining(0);
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
  
  // Track failed login attempts
  const [failedAttempts, setFailedAttempts] = useState(0);

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

      // Only check rate limiting once at login time
      const isLimited = await checkEmailRateLimit(email);
      if (isLimited) {
        setLoading(false);
        return; // Stop here if rate limited
      }

      // Attempt to sign in
      await signIn(email, password);
      
      // Reset failed attempts counter on successful login
      setFailedAttempts(0);
      localStorage.removeItem('failedLoginAttempts');
      
      // Redirect to the originally requested URL or default to home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Increment failed attempts counter
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      localStorage.setItem('failedLoginAttempts', newFailedAttempts.toString());
      
      // Record failed login attempt and update rate limit status
      try {
        console.log('Login failed, recording attempt');
        await recordFailedAttempt(email, 'login');
        
        // Check if we are now rate limited after this failed attempt
        const { rateLimit } = await checkRateLimit(email, 'login');
        if (rateLimit || newFailedAttempts >= 3) {
          console.log('Rate limit activated after failed attempt');
          setRateLimited(email, true);
        } else {
          if (err?.name === 'AuthApiError' && err?.status === 400) {
            setError(`Invalid email or password. Please try again. (${3 - newFailedAttempts} attempts remaining)`);
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

        {(error || isRateLimitActive) && (
          <div className={`${isRateLimitActive ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 rounded relative flex items-center`} role="alert">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="block sm:inline">
              {isRateLimitActive 
                ? `Too many failed login attempts. Please try again in ${formatTimeRemaining(timeRemaining)}.` 
                : error}
            </span>
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
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${isRateLimitActive ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'} placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="ronnie@coleman.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isRateLimitActive}
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
                  className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${isRateLimitActive ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'} placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Make sure nobody is looking"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isRateLimitActive}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isRateLimitActive}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/reset-password" className={`font-medium ${isRateLimitActive ? 'text-yellow-600 hover:text-yellow-500' : 'text-blue-600 hover:text-blue-500'}`}>
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isRateLimitActive}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : isRateLimitActive
                    ? 'bg-yellow-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Signing in...' : (
                isRateLimitActive ? (
                  <span className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Try again in {formatTimeRemaining(timeRemaining)}
                  </span>
                ) : 'Sign in'
              )}
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