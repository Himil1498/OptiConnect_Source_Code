import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

/**
 * API Response Types
 */
interface VerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  alreadyVerified?: boolean;
}

/**
 * Email Verification Page
 * Handles email verification when user clicks the link from their email
 */
const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'already-verified'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    verifyEmail();
  }, []);

  // Countdown timer for redirect
  useEffect(() => {
    if (status === 'success' || status === 'already-verified') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        navigate('/login');
      }
    }
  }, [countdown, status, navigate]);

  const verifyEmail = async () => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token found.');
      return;
    }

    try {
      const BACKEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get<VerificationResponse>(`${BACKEND_API_URL}/auth/verify-email/${token}`);

      if (response.data.success) {
        if (response.data.alreadyVerified) {
          setStatus('already-verified');
          setMessage('Your email is already verified!');
        } else {
          setStatus('success');
          setMessage('Email verified successfully!');
        }
      } else {
        setStatus('error');
        setMessage(response.data.error || 'Email verification failed.');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.error ||
        'Email verification failed. The link may have expired or is invalid.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Email Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            OptiConnect GIS
          </p>
        </div>

        {/* Status Content */}
        <div className="text-center">
          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300">{message}</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                  <svg className="w-16 h-16 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {message}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your account is now fully activated. You can now log in and start using OptiConnect GIS.
              </p>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Redirecting to login page in <span className="font-bold">{countdown}</span> seconds...
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                Go to Login Now
              </button>
            </div>
          )}

          {/* Already Verified State */}
          {status === 'already-verified' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-4">
                  <svg className="w-16 h-16 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {message}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your account was already verified. You can proceed to login.
              </p>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Redirecting to login page in <span className="font-bold">{countdown}</span> seconds...
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                Go to Login Now
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
                  <svg className="w-16 h-16 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                Verification Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => navigate('/resend-verification')}
                  className="w-full px-6 py-3 border-2 border-blue-500 text-blue-500 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                >
                  Request New Verification Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 OptiConnect GIS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
