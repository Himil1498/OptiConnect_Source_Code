import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { loginStart, loginSuccess, loginFailure, logout, clearError } from '../store/slices/authSlice';
import type { User, LoginCredentials } from '../types/auth.types';
import { apiService } from '../services/apiService';
import { sessionManager } from '../utils/sessionManager';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error, token } = useAppSelector((state) => state.auth);

  // Initialize session manager for auto-logout on browser close
  useEffect(() => {
    if (isAuthenticated) {
      // Start session tracking
      sessionManager.initSession();

      // Register logout callback
      sessionManager.onLogout(() => {
        console.log('⏱️ Auto-logout triggered by session manager');
        handleLogout();
      });

      return () => {
        // Cleanup on unmount (but session continues in other tabs)
        sessionManager.destroy();
      };
    }
  }, [isAuthenticated]);

  // Check session validity on mount
  useEffect(() => {
    if (isAuthenticated && !sessionManager.isSessionValid()) {
      console.warn('⚠️ Session invalid - logging out');
      handleLogout();
    }
  }, []);

  // Background token verification - DISABLED for now to ensure session persistence
  // Token is only invalidated on explicit logout or 401/403 from API
  useEffect(() => {
    // Optional: Verify token in background but NEVER logout automatically
    // This can be used for logging/monitoring only
    const verifyAuth = async () => {
      if (isAuthenticated && token) {
        try {
          const isValid = await apiService.verifyToken(token);
          if (!isValid) {
            console.warn('⚠️ Token verification failed, but session remains active');
            // IMPORTANT: Do NOT logout here - session stays active until explicit logout
          }
        } catch (error) {
          console.warn('Token verification error (ignoring):', error);
          // IMPORTANT: Do NOT logout on network errors
        }
      }
    };

    // Comment out to completely disable background verification
    // verifyAuth();
  }, [isAuthenticated, token]);

  // Set up token refresh interval - DISABLED to prevent auto-logout
  useEffect(() => {
    if (isAuthenticated && token) {
      const refreshInterval = setInterval(async () => {
        try {
          const refreshedToken = await apiService.refreshToken(token);
          if (refreshedToken && user) {
            dispatch(loginSuccess({ user, token: refreshedToken }));
            console.log('✅ Token refreshed successfully');
          }
        } catch (error) {
          console.warn('Token refresh failed (non-critical):', error);
          // IMPORTANT: Do NOT logout on refresh failure
          // Session remains active until explicit logout
        }
      }, 15 * 60 * 1000); // Refresh every 15 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated, token, user, dispatch]);

  const handleLogin = async (credentials: LoginCredentials): Promise<void> => {
    dispatch(loginStart());

    try {
      // Always use real backend - mock mode is disabled
      console.log('🔄 Using real backend authentication');
      const response = await apiService.login(credentials);
      dispatch(loginSuccess({ user: response.user, token: response.token }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch(loginFailure(errorMessage));
      throw error; // Re-throw to allow login form to handle it
    }
  };

  const handleLogout = (): void => {
    dispatch(logout());

    // In production, also notify the backend
    if (process.env.NODE_ENV === 'production' && token) {
      apiService.logout(token).catch(console.error);
    }
  };

  const handleClearError = (): void => {
    dispatch(clearError());
  };

  const checkAuthStatus = async (): Promise<void> => {
    if (token) {
      try {
        const isValid = await apiService.verifyToken(token);
        if (!isValid) {
          handleLogout();
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        handleLogout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    clearError: handleClearError,
    checkAuthStatus,
  };

  // No loading screen needed - Redux restores state synchronously from localStorage
  // This provides instant access to authenticated routes on refresh
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};