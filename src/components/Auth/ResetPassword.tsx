import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { LogDayLogo } from '../others/LogDayLogo';

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const { resetPassword } = useAuth();

  useEffect(() => {
    // Add fade-in animation effect
    setFadeIn(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to send password reset email. Please check your email address and try again.');
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
            Reset your password
          </h2>
          <p className="text-sm text-gray-500">
            Enter your email and we'll send you a <br/> link to reset your password
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-center animate-pulse-once" role="alert">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="block sm:inline text-sm">{error}</span>
          </div>
        )}

        {success ? (
          <div className="mt-8">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative flex items-center mb-4" role="alert">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="block sm:inline text-sm">
                Password reset link sent to your email!.
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
            </p>
            <p className="text-sm text-gray-600">
              If you don't see the email, check your spam folder or try again.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="group relative w-full flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="flex items-center">
                  Back to Sign in
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email-address" className="block pl-0.5 text-sm font-medium text-gray-700 mb-1">
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
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-xl text-white transition-all duration-200 ${
                  loading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending email...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Send reset link
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                )}
              </button>
              {loading && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  This may take a few seconds. Please wait...
                </p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
