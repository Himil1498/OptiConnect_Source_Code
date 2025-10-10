import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * API Response Types
 */
interface ResendVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Resend Verification Email Page
 * Allows users to request a new verification email
 */
const ResendVerificationPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const BACKEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.post<ResendVerificationResponse>(`${BACKEND_API_URL}/auth/resend-verification`, { email });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message || 'Verification email sent! Please check your inbox.');
      } else {
        setStatus('error');
        setMessage(response.data.error || 'Failed to send verification email');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.error ||
        'Failed to send verification email. Please try again.'
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
            Resend Verification Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email to receive a new verification link
          </p>
        </div>

        {/* Success Message */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 dark:text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Email Sent Successfully!
                </h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  {message}
                </p>
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  Please check your email inbox (and spam folder) for the verification link.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-500 dark:text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                disabled={status === 'loading'}
                required
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Verification Email'
              )}
            </button>
          </form>
        )}

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 border-2 border-blue-500 text-blue-500 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
          >
            Back to Login
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            💡 Helpful Tips
          </h3>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Check your spam/junk folder if you don't see the email</li>
            <li>Verification links expire after 24 hours</li>
            <li>You can request a new link as many times as needed</li>
            <li>Make sure you entered the correct email address</li>
          </ul>
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

export default ResendVerificationPage;
