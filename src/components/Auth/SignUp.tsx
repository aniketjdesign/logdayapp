import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LogDayLogo } from '../LogDayLogo';
import { AuthFooter } from './AuthFooter';
import { checkRateLimit, recordFailedAttempt, isRateLimited, checkIpRateLimit } from '../../utils/rateLimiting';

export const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isRateLimitActive, setIsRateLimitActive] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Check for IP-based rate limits when the component mounts
  useEffect(() => {
    const checkRateLimitsOnPageLoad = async () => {
      try {
        // First check if we have cached rate limit info in sessionStorage
        const cachedLimit = sessionStorage.getItem('signup_rate_limit');
        if (cachedLimit) {
          const limitData = JSON.parse(cachedLimit);
          
          // Check if cached rate limit is still valid
          if (limitData.expiry > Date.now()) {
            console.log('Using cached rate limit info, expires in:', 
              Math.round((limitData.expiry - Date.now())/1000), 'seconds');
            setIsRateLimitActive(true);
            setError(limitData.message || 'Maximum signup attempts reached. Please try again later.');
            return;
          } else {
            // Clear expired rate limit info
            console.log('Cached rate limit has expired, clearing');
            sessionStorage.removeItem('signup_rate_limit');
          }
        }
        
        console.log('Checking IP-based rate limits on signup page load');
        const { rateLimit, message, timeRemaining } = await checkIpRateLimit('signup');
        
        if (rateLimit) {
          console.log('IP is rate limited on signup page load');
          setIsRateLimitActive(true);
          
          // Calculate expiry time (use timeRemaining if available, otherwise default to 5 minutes)
          const expiry = Date.now() + (timeRemaining ? timeRemaining * 1000 : 300000);
          
          // Store rate limit info in sessionStorage for persistence across navigation/refreshes
          sessionStorage.setItem('signup_rate_limit', JSON.stringify({
            active: true,
            message: message || 'Maximum signup attempts reached. Please try again later.',
            expiry: expiry
          }));
          
          setError(message || 'Maximum signup attempts reached. Please try again later.');
        }
      } catch (err) {
        console.error('Error checking IP rate limit on signup page load:', err);
      }
    };
    
    checkRateLimitsOnPageLoad();
    
    // Set up interval to check if rate limit has expired
    const interval = setInterval(() => {
      const cachedLimit = sessionStorage.getItem('signup_rate_limit');
      if (cachedLimit) {
        const limitData = JSON.parse(cachedLimit);
        if (limitData.expiry <= Date.now()) {
          console.log('Rate limit expired during session, clearing');
          sessionStorage.removeItem('signup_rate_limit');
          setIsRateLimitActive(false);
          setError('');
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

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

      // Check if user is rate limited (one final check before attempting signup)
      console.log('Final check before signup attempt for:', email);
      const { rateLimit, message, reason, timeRemaining } = await checkRateLimit(email, 'signup');
      console.log('Rate limit check result:', { rateLimit, message, reason });
      
      if (rateLimit) {
        setIsRateLimitActive(true);
        
        // Calculate expiry time
        const expiry = Date.now() + (timeRemaining ? timeRemaining * 1000 : 300000);
        
        // Cache the rate limit information
        sessionStorage.setItem('signup_rate_limit', JSON.stringify({
          active: true,
          message: message || `Too many attempts from your ${reason || 'location'}. Please try again later.`,
          expiry: expiry
        }));
        
        const displayMessage = reason 
          ? `Too many attempts from your ${reason}. Please try again later.`
          : message || 'Too many attempts. Please try again later.';
        setError(displayMessage);
        setLoading(false);
        return;
      }

      // Create user account
      console.log('Attempting to sign up with email:', email);
      const { error: signUpError } = await signUp(email, password);
      
      // Record signup attempt (regardless of success or failure)
      console.log('Recording signup attempt for:', email);
      await recordFailedAttempt(email, 'signup');

      if (signUpError) {
        throw signUpError;
      }

      // If signup was successful, clear any cached rate limit info
      sessionStorage.removeItem('signup_rate_limit');

      console.log('Signup successful, navigating to login');
      // Navigate to login
      navigate('/login');
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Record signup attempt if it was an existing email error
      if (err?.message?.includes('User already registered')) {
        console.log('Recording failed signup attempt for existing email:', email);
        await recordFailedAttempt(email, 'signup');
      }
      
      // Check if we are now rate limited after this failed attempt
      console.log('Checking if now rate limited after failed attempt');
      const { rateLimit, message, reason, timeRemaining } = await checkRateLimit(email, 'signup');
      console.log('Post-failure rate limit check:', { rateLimit, message, reason });
      
      if (rateLimit) {
        setIsRateLimitActive(true);
        
        // Calculate expiry time
        const expiry = Date.now() + (timeRemaining ? timeRemaining * 1000 : 300000);
        
        // Cache the rate limit information
        sessionStorage.setItem('signup_rate_limit', JSON.stringify({
          active: true,
          message: message || `Too many attempts from your ${reason || 'location'}. Please try again later.`,
          expiry: expiry
        }));
        
        const displayMessage = reason 
          ? `Too many attempts from your ${reason}. Please try again later.`
          : message || 'Too many attempts. Please try again later.';
        setError(displayMessage);
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50 safe-area-inset-top safe-area-inset-bottom pb-16">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <LogDayLogo className="h-16 w-16" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">
              Get Started
            </h2>
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
                  Email address*
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
                  Password*
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Select a strong password"
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

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-normal text-gray-500 mb-1">
                  Confirm Password*
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600">
                    I agree to the{' '}
                    <a href="https://logday.fit/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                      Terms of Use
                    </a>{' '}
                    and{' '}
                    <a href="https://logday.fit/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </a>
                  </label>
                </div>
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
                {loading ? 'Creating account...' : (isRateLimitActive ? 'Too many attempts' : 'Sign up')}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};