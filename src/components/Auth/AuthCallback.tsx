import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { LogDayLogo } from '../others/LogDayLogo';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Analytics } from '../../services/analytics';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code and other params from the URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No verification code found');
          return;
        }

        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('Session exchange error:', exchangeError);
          setStatus('error');
          setMessage('Failed to verify email. Please try again.');
          return;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');
          
          // Track signup completion now that email is verified
          if (data.user.email) {
            Analytics.userSignedUp({
              userId: data.user.id,
              email: data.user.email,
              createdAt: data.user.created_at
            });
          }
          
          // Redirect to home after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        }
      } catch (err: unknown) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  const handleReturnToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white px-4 py-6 md:p-8 rounded-2xl shadow-sm">
        <div className="text-center">
          <div className="flex justify-center">
            <LogDayLogo className="h-16 w-16 text-blue-600" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tighter text-gray-800">
            Email Verification
          </h2>
        </div>

        <div className="text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-green-700 font-medium">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-red-700 font-medium">{message}</p>
              <button
                onClick={handleReturnToLogin}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-colors duration-200"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};