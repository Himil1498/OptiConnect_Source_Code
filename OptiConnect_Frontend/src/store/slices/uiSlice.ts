import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppMode } from '../../types/common.types';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  autoClose?: boolean;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: any;
}

export interface PanelState {
  id: string;
  isVisible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

interface UIState {
  // App Mode and Environment
  appMode: AppMode;
  isFullscreen: boolean;

  // Theme
  isDarkMode: boolean;
  theme: 'light' | 'dark' | 'auto';

  // Layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Loading States
  isGlobalLoading: boolean;
  loadingMessage: string;

  // Notifications
  notifications: Notification[];

  // Modals
  modal: ModalState;

  // Panels (Draggable/Resizable)
  panels: PanelState[];

  // Navigation
  activeTab: string;
  breadcrumbs: Array<{ label: string; path: string }>;

  // Mobile
  isMobileMenuOpen: boolean;

  // Performance
  showFPS: boolean;
  showDebugInfo: boolean;
}

// Helper function to determine initial dark mode state
const getInitialDarkMode = (): boolean => {
  const savedTheme = localStorage.getItem('opti_connect_theme');

  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;

  // If 'auto' or not set, check system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const initialState: UIState = {
  appMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  isFullscreen: false,

  isDarkMode: getInitialDarkMode(),
  theme: (localStorage.getItem('opti_connect_theme') as 'light' | 'dark' | 'auto') || 'auto',

  sidebarOpen: true,
  sidebarCollapsed: false,

  isGlobalLoading: false,
  loadingMessage: '',

  notifications: [],

  modal: {
    isOpen: false,
    type: null,
  },

  panels: [],

  activeTab: 'dashboard',
  breadcrumbs: [{ label: 'Dashboard', path: '/dashboard' }],

  isMobileMenuOpen: false,

  showFPS: false,
  showDebugInfo: false,
};

let notificationIdCounter = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // App Mode
    setAppMode: (state, action: PayloadAction<AppMode>) => {
      state.appMode = action.payload;
    },

    // Fullscreen
    toggleFullscreen: (state) => {
      state.isFullscreen = !state.isFullscreen;
    },

    setFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload;
    },

    // Theme
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      state.theme = state.isDarkMode ? 'dark' : 'light';
      localStorage.setItem('opti_connect_theme', state.theme);
    },

    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
      if (action.payload === 'auto') {
        state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        state.isDarkMode = action.payload === 'dark';
      }
      localStorage.setItem('opti_connect_theme', action.payload);
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    // Loading
    setGlobalLoading: (state, action: PayloadAction<{ loading: boolean; message?: string }>) => {
      state.isGlobalLoading = action.payload.loading;
      state.loadingMessage = action.payload.message || '';
    },

    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notification_${notificationIdCounter++}`,
        timestamp: Date.now(),
        autoClose: action.payload.autoClose ?? true,
        duration: action.payload.duration ?? 5000,
      };
      state.notifications.push(notification);
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Modals
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data,
      };
    },

    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: undefined,
      };
    },

    // Panels
    addPanel: (state, action: PayloadAction<Omit<PanelState, 'id'>>) => {
      const panel: PanelState = {
        ...action.payload,
        id: `panel_${Date.now()}`,
      };
      state.panels.push(panel);
    },

    updatePanel: (state, action: PayloadAction<{ id: string; updates: Partial<PanelState> }>) => {
      const index = state.panels.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.panels[index] = { ...state.panels[index], ...action.payload.updates };
      }
    },

    removePanel: (state, action: PayloadAction<string>) => {
      state.panels = state.panels.filter(p => p.id !== action.payload);
    },

    // Navigation
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },

    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path: string }>>) => {
      state.breadcrumbs = action.payload;
    },

    // Mobile
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },

    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },

    // Debug
    toggleFPS: (state) => {
      state.showFPS = !state.showFPS;
    },

    toggleDebugInfo: (state) => {
      state.showDebugInfo = !state.showDebugInfo;
    },
  },
});

export const {
  setAppMode,
  toggleFullscreen,
  setFullscreen,
  toggleDarkMode,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setGlobalLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  addPanel,
  updatePanel,
  removePanel,
  setActiveTab,
  setBreadcrumbs,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleFPS,
  toggleDebugInfo,
} = uiSlice.actions;

export default uiSlice.reducer;