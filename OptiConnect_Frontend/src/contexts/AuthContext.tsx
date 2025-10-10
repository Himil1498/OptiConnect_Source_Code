import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { loginStart, loginSuccess, loginFailure, logout, clearError } from '../store/slices/authSlice';
import type { User, LoginCredentials } from '../types/auth.types';
import { apiService } from '../services/apiService';

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

  // Check authentication status on app initialization
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('opti_connect_token');
      const storedUser = localStorage.getItem('opti_connect_user');
      const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === 'true';

      if (storedToken && storedUser) {
        try {
          // If backend is disabled, always restore session from localStorage
          if (!USE_BACKEND) {
            const userData = JSON.parse(storedUser);
            dispatch(loginSuccess({ user: userData, token: storedToken }));
            return;
          }

          // If backend is enabled, verify token is still valid
          const isValid = await apiService.verifyToken(storedToken);

          if (isValid) {
            const userData = JSON.parse(storedUser);
            dispatch(loginSuccess({ user: userData, token: storedToken }));
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('opti_connect_token');
            localStorage.removeItem('opti_connect_user');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // If backend mode but error, still try to restore from localStorage
          if (!USE_BACKEND) {
            try {
              const userData = JSON.parse(storedUser);
              dispatch(loginSuccess({ user: userData, token: storedToken }));
            } catch {
              localStorage.removeItem('opti_connect_token');
              localStorage.removeItem('opti_connect_user');
            }
          } else {
            localStorage.removeItem('opti_connect_token');
            localStorage.removeItem('opti_connect_user');
          }
        }
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Set up token refresh interval
  useEffect(() => {
    if (isAuthenticated && token) {
      const refreshInterval = setInterval(async () => {
        try {
          const refreshedToken = await apiService.refreshToken(token);
          if (refreshedToken && user) {
            dispatch(loginSuccess({ user, token: refreshedToken }));
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails, logout user
          handleLogout();
        }
      }, 15 * 60 * 1000); // Refresh every 15 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated, token, user, dispatch]);

  const handleLogin = async (credentials: LoginCredentials): Promise<void> => {
    dispatch(loginStart());

    try {
      // Check if we should use backend
      const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === 'true';

      if (!USE_BACKEND) {
        // Mock mode - use development mock data
        console.log('🔄 Using mock authentication (backend disabled)');
        await new Promise(resolve => setTimeout(resolve, 1000));

        let mockUser: User;
        switch (credentials.email.toLowerCase()) {
          case 'admin@example.com':
            mockUser = {
              id: 'admin_001',
              email: credentials.email,
              name: 'Admin User',
              role: 'Admin',
              company: credentials.company || 'Opti Telemedia',
              permissions: ['all'],
              lastLogin: new Date().toISOString(),
              username: 'admin',
              password: '********',
              gender: 'Male',
              phoneNumber: '+91-9876543210',
              address: {
                street: 'Admin Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
              },
              officeLocation: 'Mumbai HQ',
              assignedUnder: [],
              assignedRegions: [],
              groups: [],
              status: 'Active',
              loginHistory: [],
            };
            break;

          case 'field@example.com':
            mockUser = {
              id: 'field_001',
              email: credentials.email,
              name: 'Field Engineer',
              role: 'Manager',
              company: credentials.company || 'Opti Telemedia',
              permissions: ['read', 'write'],
              lastLogin: new Date().toISOString(),
              username: 'field',
              password: '********',
              gender: 'Male',
              phoneNumber: '+91-9876543211',
              address: {
                street: 'Field Street',
                city: 'Pune',
                state: 'Maharashtra',
                pincode: '411001'
              },
              officeLocation: 'Pune Office',
              assignedUnder: ['admin_001'],
              assignedRegions: ['Maharashtra', 'Karnataka'],
              groups: [],
              status: 'Active',
              loginHistory: [],
            };
            break;

          default:
            mockUser = {
              id: 'dev_user_1',
              email: credentials.email,
              name: 'Development User',
              role: 'Manager',
              company: credentials.company || 'Opti Telemedia',
              permissions: ['read', 'write'],
              lastLogin: new Date().toISOString(),
              username: credentials.email.split('@')[0],
              password: '********',
              gender: 'Other',
              phoneNumber: '+91-0000000000',
              address: {
                street: 'Dev Street',
                city: 'Dev City',
                state: 'Maharashtra',
                pincode: '000000'
              },
              officeLocation: 'Dev Office',
              assignedUnder: [],
              assignedRegions: ['Maharashtra'],
              groups: [],
              status: 'Active',
              loginHistory: [],
            };
        }

        const mockToken = 'dev_token_' + Date.now();
        dispatch(loginSuccess({ user: mockUser, token: mockToken }));
      } else {
        // Backend mode - real authentication
        console.log('🔄 Using real backend authentication');
        const response = await apiService.login(credentials);
        dispatch(loginSuccess({ user: response.user, token: response.token }));
      }
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