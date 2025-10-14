import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { advancedAuthService } from '../services/advancedAuthService';
import type { User, LoginCredentials } from '../types/auth.types';

interface AdvancedAuthContextType {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Session info
  sessionInfo: any;
  isOnline: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
  
  // Utilities
  getSessionDebugInfo: () => any;
  forceLogout: (reason?: string) => void;
}

const AdvancedAuthContext = createContext<AdvancedAuthContextType | undefined>(undefined);

interface AdvancedAuthProviderProps {
  children: ReactNode;
}

export const AdvancedAuthProvider: React.FC<AdvancedAuthProviderProps> = ({ children }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Session end handler
  const handleSessionEnd = useCallback((reason: string) => {
    console.log(`🔚 Session ended: ${reason}`);
    
    // Show appropriate message to user
    switch (reason) {
      case 'idle_timeout':
        toast.error('Session expired due to inactivity. Please login again.');
        break;
      case 'token_expired':
        toast.error('Your session has expired. Please login again.');
        break;
      case 'manual_logout':
        toast.success('Logged out successfully');
        break;
      case 'cross_tab_logout':
        toast.error('You have been logged out from another tab');
        break;
      case 'server_invalidation':
        toast.error('Session invalidated by server. Please login again.');
        break;
      case 'refresh_failed':
        toast.error('Unable to refresh session. Please login again.');
        break;
      case 'focus_validation_failed':
        toast.error('Session validation failed. Please login again.');
        break;
      case 'forced':
        toast.error('Session terminated. Please login again.');
        break;
      default:
        toast.error('Session ended. Please login again.');
    }
    
    // Clear local state
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    setSessionInfo(null);
    setIsLoading(false);
    
    // Redirect to login if needed
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }, []);

  // Auth state change handler
  const handleAuthStateChange = useCallback((authenticated: boolean, userData: User | null) => {
    console.log(`🔄 Auth state changed: ${authenticated ? 'authenticated' : 'unauthenticated'}`);
    
    setIsAuthenticated(authenticated);
    setUser(userData);
    setSessionInfo(authenticated ? advancedAuthService.getSessionInfo() : null);
    setIsLoading(false);
    
    if (authenticated && userData) {
      toast.success(`Welcome back, ${userData.name || userData.email}!`);
    }
  }, []);

  // Initialize auth service listeners
  useEffect(() => {
    console.log('🚀 Setting up Advanced Auth Context...');
    
    // Add auth state listener
    advancedAuthService.addAuthStateListener(handleAuthStateChange);
    
    // Add session end listener
    advancedAuthService.addSessionEndListener(handleSessionEnd);
    
    // Initial state check
    const initialAuth = advancedAuthService.isAuthenticated();
    const initialUser = advancedAuthService.getCurrentUser();
    const initialSessionInfo = advancedAuthService.getSessionInfo();
    
    setIsAuthenticated(initialAuth);
    setUser(initialUser);
    setSessionInfo(initialSessionInfo);
    setIsLoading(false);
    
    console.log('✅ Advanced Auth Context initialized');
    console.log(`Initial auth state: ${initialAuth ? 'authenticated' : 'unauthenticated'}`);
    
    // Cleanup
    return () => {
      advancedAuthService.removeAuthStateListener(handleAuthStateChange);
      advancedAuthService.removeSessionEndListener(handleSessionEnd);
    };
  }, [handleAuthStateChange, handleSessionEnd]);

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Validating session...');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may not work.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session info updater
  useEffect(() => {
    if (isAuthenticated) {
      const updateSessionInfo = () => {
        setSessionInfo(advancedAuthService.getSessionInfo());
      };
      
      // Update session info every minute
      const interval = setInterval(updateSessionInfo, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Login handler
  const handleLogin = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 Starting advanced login process...');
      
      // Use advanced auth service
      await advancedAuthService.login(credentials);
      
      console.log('✅ Advanced login completed successfully');
      
      // State will be updated via auth state listener
      
    } catch (error: any) {
      console.error('❌ Advanced login failed:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      
      setError(errorMessage);
      setIsLoading(false);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout handler
  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log('🚪 Starting advanced logout process...');
      
      await advancedAuthService.logout(true);
      
      console.log('✅ Advanced logout completed');
      
      // State will be updated via session end listener
      
    } catch (error) {
      console.error('❌ Advanced logout error:', error);
      // Force local cleanup even if server logout fails
      advancedAuthService.forceLogout('logout_error');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error handler
  const handleClearError = (): void => {
    setError(null);
  };

  // Refresh session handler
  const handleRefreshSession = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Force token refresh if authenticated
      if (isAuthenticated) {
        const isValid = advancedAuthService.isAuthenticated();
        if (!isValid) {
          throw new Error('Session is no longer valid');
        }
        
        toast.success('Session refreshed successfully');
      } else {
        throw new Error('Not authenticated');
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      toast.error('Failed to refresh session');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get session debug info
  const getSessionDebugInfo = (): any => {
    return {
      authServiceInfo: advancedAuthService.getSessionInfo(),
      contextState: {
        isAuthenticated,
        isLoading,
        hasError: !!error,
        isOnline,
        userEmail: user?.email,
        sessionExists: !!sessionInfo,
      },
      preferences: advancedAuthService.getUserPreferences(),
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
      timestamp: new Date().toISOString(),
    };
  };

  // Force logout
  const handleForceLogout = (reason: string = 'forced'): void => {
    advancedAuthService.forceLogout(reason);
  };

  // Context value
  const contextValue: AdvancedAuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    sessionInfo,
    isOnline,
    
    // Actions
    login: handleLogin,
    logout: handleLogout,
    clearError: handleClearError,
    refreshSession: handleRefreshSession,
    
    // Utilities
    getSessionDebugInfo,
    forceLogout: handleForceLogout,
  };

  // Show initialization loading
  if (isLoading && !isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Initializing Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Setting up secure session management...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdvancedAuthContext.Provider value={contextValue}>
      {children}
      
      {/* Session Status Indicator (Development Only) */}
      {process.env.NODE_ENV === 'development' && isAuthenticated && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600 dark:text-gray-400">
              Session: {sessionInfo?.sessionId?.slice(-8) || 'N/A'}
            </span>
          </div>
          {sessionInfo && (
            <div className="mt-1 text-gray-500 dark:text-gray-500">
              Expires: {new Date(sessionInfo.expiresAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>You are currently offline</span>
          </div>
        </div>
      )}
    </AdvancedAuthContext.Provider>
  );
};

// Custom hook to use the advanced auth context
export const useAdvancedAuth = (): AdvancedAuthContextType => {
  const context = useContext(AdvancedAuthContext);
  if (context === undefined) {
    throw new Error('useAdvancedAuth must be used within an AdvancedAuthProvider');
  }
  return context;
};

// Export the context for testing purposes
export { AdvancedAuthContext };