import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LogDayLogo } from '../LogDayLogo';
import { AuthFooter } from './AuthFooter';
import { checkRateLimit, recordFailedAttempt, isRateLimited } from '../../utils/rateLimiting';

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

  // Check for rate limits when email changes
  useEffect(() => {
    if (email) {
      const checkCurrentEmailRateLimit = async () => {
        try {
          const isLimited = await isRateLimited(email, 'signup');
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

      // Check if user is rate limited
      console.log('Checking rate limit before signup attempt for:', email);
      const { rateLimit, message, reason } = await checkRateLimit(email, 'signup');
      console.log('Rate limit check result:', { rateLimit, message, reason });
      
      if (rateLimit) {
        setIsRateLimitActive(true);
        const displayMessage = reason 
          ? `Too many attempts from your ${reason}. Please try again after 5 minutes.`
          : message || 'Too many attempts. Please try again after 5 minutes.';
        setError(displayMessage);
        setLoading(false);
        return;
      }

      // Record signup attempt (track all attempts, not just failures)
      console.log('Recording signup attempt for:', email);
      await recordFailedAttempt(email, 'signup');

      // Create user account
      console.log('Attempting to sign up with email:', email);
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) throw signUpError;

      console.log('Signup successful, checking if rate limited for future attempts');
      // Check if we're now rate limited for future attempts
      const postSignupCheck = await checkRateLimit(email, 'signup');
      if (postSignupCheck.rateLimit) {
        console.log('Rate limited after successful signup, displaying message');
        setIsRateLimitActive(true);
        const displayMessage = postSignupCheck.reason 
          ? `Account created successfully. However, ${postSignupCheck.message}`
          : `Account created successfully. However, ${postSignupCheck.message || 'Maximum signup attempts reached. Please try again after 5 minutes.'}`;
        setError(displayMessage);
        setLoading(false);
        return;
      }

      console.log('Signup successful, navigating to login');
      // Navigate to login
      navigate('/login');
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Check if we are now rate limited after this failed attempt
      console.log('Checking if now rate limited after failed attempt');
      const { rateLimit, message, reason } = await checkRateLimit(email, 'signup');
      console.log('Post-failure rate limit check:', { rateLimit, message, reason });
      
      if (rateLimit) {
        setIsRateLimitActive(true);
        const displayMessage = reason 
          ? `Too many attempts from your ${reason}. Please try again after 5 minutes.`
          : message || 'Too many attempts. Please try again after 5 minutes.';
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