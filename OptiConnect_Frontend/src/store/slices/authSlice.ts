import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state - redux-persist will handle restoration
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  token: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      // Keep localStorage for backward compatibility and immediate access
      localStorage.setItem('opti_connect_token', action.payload.token);
      localStorage.setItem('opti_connect_user', JSON.stringify(action.payload.user));
      console.log('✅ User logged in:', action.payload.user.username);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      // Clear localStorage
      localStorage.removeItem('opti_connect_token');
      localStorage.removeItem('opti_connect_user');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      // Clear localStorage
      localStorage.removeItem('opti_connect_token');
      localStorage.removeItem('opti_connect_user');
      console.log('✅ User logged out');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Sync with localStorage
        localStorage.setItem('opti_connect_user', JSON.stringify(state.user));
        console.log('✅ User updated:', state.user.username);
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;