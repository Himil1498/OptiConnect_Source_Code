// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// Default Map Configuration
export const DEFAULT_MAP_CENTER = {
  lat: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LAT || '20.5937'),
  lng: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LNG || '78.9629'),
};

export const DEFAULT_MAP_ZOOM = parseInt(process.env.REACT_APP_DEFAULT_MAP_ZOOM || '5', 10);

// File Upload Configuration
export const MAX_FILE_SIZE = parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '10485760', 10); // 10MB
export const ALLOWED_FILE_TYPES = process.env.REACT_APP_ALLOWED_FILE_TYPES?.split(',') || ['.kml', '.geojson', '.json', '.csv', '.xlsx'];

// Feature Flags
export const FEATURES = {
  ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  OFFLINE_MODE: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
  DEBUG_MODE: process.env.REACT_APP_ENABLE_DEBUG_MODE === 'true',
};

// Application Constants
export const APP_NAME = 'Telecom GIS Platform';
export const APP_VERSION = '0.1.0';

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

// Tower Types
export const TOWER_TYPES = {
  CELL: 'cell',
  FIBER: 'fiber',
  MICROWAVE: 'microwave',
} as const;

// Tower Status
export const TOWER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const;

// Map Types
export const MAP_TYPES = {
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  THEME: 'theme',
  USER_PREFERENCES: 'user_preferences',
  MAP_STATE: 'map_state',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users',
    DELETE: '/users',
  },
  TOWERS: {
    LIST: '/towers',
    CREATE: '/towers',
    UPDATE: '/towers',
    DELETE: '/towers',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PERFORMANCE: '/analytics/performance',
    COVERAGE: '/analytics/coverage',
  },
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: '/files/download',
  },
} as const;