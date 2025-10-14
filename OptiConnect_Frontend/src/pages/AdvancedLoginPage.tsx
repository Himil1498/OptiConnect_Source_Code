import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAdvancedAuth } from '../contexts/AdvancedAuthContext';
import { advancedAuthService } from '../services/advancedAuthService';

// Icons
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { 
  UserIcon, 
  LockClosedIcon, 
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

const AdvancedLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError, isOnline } = useAdvancedAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Session debug info (development only)
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const preferences = advancedAuthService.getUserPreferences();
    if (preferences.lastUsername) {
      setFormData(prev => ({ ...prev, email: preferences.lastUsername }));
      setRememberMe(true);
    }
  }, []);

  // Clear errors when form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData.email, formData.password, error, clearError]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !isOnline) return;

    // Client-side validation
    if (!formData.email.trim() || !formData.password) {
      toast.error('Please enter both email/username and password');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Success - user will be redirected automatically via auth state change
      toast.success('Login successful! Redirecting...');
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Error handling with specific messages
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      
      // Don't show toast here - it's handled by AdvancedAuthContext
      
      // Focus back to email field for retry
      const emailField = document.getElementById('email') as HTMLInputElement;
      if (emailField) {
        emailField.focus();
      }
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSessionDebugInfo = () => {
    const debugInfo = advancedAuthService.getSessionInfo();
    return debugInfo;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <ComputerDesktopIcon className="h-12 w-12 text-violet-200" />
              <span className="ml-3 text-3xl font-bold">OptiConnect GIS</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Industry-Level
              <br />
              <span className="text-violet-200">Authentication</span>
            </h1>
            <p className="text-xl text-violet-100 leading-relaxed">
              Secure session management with automatic logout, cross-tab synchronization, 
              and enterprise-grade security features.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-300 mr-3" />
              <span className="text-violet-100">Automatic session cleanup on browser close</span>
            </div>
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-300 mr-3" />
              <span className="text-violet-100">Cross-tab authentication synchronization</span>
            </div>
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-300 mr-3" />
              <span className="text-violet-100">Idle timeout protection</span>
            </div>
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-300 mr-3" />
              <span className="text-violet-100">Refresh token rotation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-12 bg-white dark:bg-gray-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <ComputerDesktopIcon className="h-10 w-10 text-violet-600" />
            <span className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">
              OptiConnect GIS
            </span>
          </div>

          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Access the advanced GIS platform with secure authentication
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Offline Warning */}
            {!isOnline && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-red-600 dark:text-red-400">
                    You are offline. Login will be attempted when connection is restored.
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email/Username Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email or Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    placeholder="Enter your email or username"
                    disabled={isSubmitting || !isOnline}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    placeholder="Enter your password"
                    disabled={isSubmitting || !isOnline}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 dark:border-gray-600 rounded"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !isOnline}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {isSubmitting ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <LockClosedIcon className="h-5 w-5 text-violet-500 group-hover:text-violet-400" />
                    )}
                  </span>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Development Debug Panel */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showDebugInfo ? 'Hide' : 'Show'} Debug Info
                </button>
                
                {showDebugInfo && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    <pre className="text-gray-600 dark:text-gray-400 overflow-auto">
                      {JSON.stringify(getSessionDebugInfo(), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Contact your administrator
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Protected by industry-standard authentication
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Development Mode • Advanced Auth Enabled
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedLoginPage;