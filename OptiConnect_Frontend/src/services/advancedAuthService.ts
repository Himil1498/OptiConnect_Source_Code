import { apiService } from './apiService';
import type { User, LoginCredentials } from '../types/auth.types';

// Advanced Authentication Configuration
const AUTH_CONFIG = {
  ACCESS_TOKEN_KEY: 'opti_access_token',
  REFRESH_TOKEN_KEY: 'opti_refresh_token',
  USER_KEY: 'opti_user_data',
  SESSION_KEY: 'opti_session_id',
  PREFERENCES_KEY: 'opti_user_preferences',
  
  // Token lifetimes
  ACCESS_TOKEN_LIFETIME: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_LIFETIME: 7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION_CHECK_INTERVAL: 60 * 1000, // 1 minute
  
  // Security settings
  MAX_IDLE_TIME: 30 * 60 * 1000, // 30 minutes of inactivity
  HEARTBEAT_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

interface AuthSession {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
  refreshExpiresAt: number;
  lastActivity: number;
  deviceInfo: string;
}

interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

interface PersistentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class AdvancedAuthService {
  private session: AuthSession | null = null;
  private sessionCheckTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  
  // Storage interfaces - using sessionStorage for sensitive data, localStorage for preferences
  private sessionStorage: SessionStorage = window.sessionStorage;
  private persistentStorage: PersistentStorage = window.localStorage;
  
  // Event listeners
  private authStateListeners: Array<(isAuthenticated: boolean, user: User | null) => void> = [];
  private sessionEndListeners: Array<(reason: string) => void> = [];

  constructor() {
    this.initializeAuthService();
  }

  /**
   * Initialize the authentication service with all necessary setup
   */
  private initializeAuthService(): void {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing Advanced Authentication Service...');
    
    // Setup browser event listeners
    this.setupBrowserEventListeners();
    
    // Setup activity tracking
    this.setupActivityTracking();
    
    // Attempt to restore session
    this.restoreSession();
    
    // Start background processes
    this.startSessionMonitoring();
    this.startHeartbeat();
    
    this.isInitialized = true;
    console.log('✅ Advanced Authentication Service initialized');
  }

  /**
   * Setup browser event listeners for tab/window management
   */
  private setupBrowserEventListeners(): void {
    // Handle tab/browser close
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Handle window focus/blur
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    
    // Handle storage events (cross-tab communication)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Handle page unload
    window.addEventListener('unload', this.handleUnload.bind(this));
    
    // Handle network status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Setup user activity tracking
   */
  private setupActivityTracking(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      if (this.session) {
        this.session.lastActivity = Date.now();
        this.updateSessionStorage();
      }
    };

    // Throttled activity update
    let activityThrottle: NodeJS.Timeout | null = null;
    const throttledUpdate = () => {
      if (activityThrottle) return;
      activityThrottle = setTimeout(() => {
        updateActivity();
        activityThrottle = null;
      }, 5000); // Update max once every 5 seconds
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });
  }

  /**
   * Login user with enhanced session management
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; accessToken: string }> {
    try {
      console.log('🔐 Attempting advanced login...');
      
      // Clear any existing session first
      await this.logout(false);
      
      // Perform login via API
      const response = await apiService.login(credentials);
      
      // Create new session
      const sessionId = this.generateSessionId();
      const now = Date.now();
      const deviceInfo = this.getDeviceInfo();
      
      this.session = {
        sessionId,
        accessToken: response.token,
        refreshToken: response.refreshToken || response.token, // Fallback if no refresh token
        user: response.user,
        expiresAt: now + AUTH_CONFIG.ACCESS_TOKEN_LIFETIME,
        refreshExpiresAt: now + AUTH_CONFIG.REFRESH_TOKEN_LIFETIME,
        lastActivity: now,
        deviceInfo,
      };
      
      // Store session data
      this.updateSessionStorage();
      this.updatePersistentStorage();
      
      // Start monitoring
      this.startSessionMonitoring();
      this.startHeartbeat();
      
      // Notify listeners
      this.notifyAuthStateListeners(true, response.user);
      
      console.log('✅ Advanced login successful');
      
      // Return the expected format
      return {
        user: response.user,
        accessToken: response.token
      };
      
    } catch (error) {
      console.error('❌ Advanced login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user with complete cleanup
   */
  async logout(notifyServer: boolean = true): Promise<void> {
    try {
      console.log('🚪 Performing advanced logout...');
      
      // Notify server if requested
      if (notifyServer && this.session?.accessToken) {
        try {
          await apiService.logout(this.session.accessToken);
        } catch (error) {
          console.warn('Failed to notify server of logout:', error);
        }
      }
      
      // Clear all timers
      this.clearTimers();
      
      // Clear session data
      this.clearSessionData();
      
      // Notify listeners
      this.notifyAuthStateListeners(false, null);
      this.notifySessionEndListeners('manual_logout');
      
      console.log('✅ Advanced logout completed');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local data even if server notification fails
      this.clearSessionData();
      this.notifyAuthStateListeners(false, null);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.session) return false;
    
    const now = Date.now();
    
    // Check if access token is expired and refresh token is still valid
    if (now > this.session.expiresAt) {
      if (now < this.session.refreshExpiresAt) {
        // Access token expired but refresh token is valid - try refresh
        this.refreshTokenSilently();
        return true; // Optimistically return true while refresh is in progress
      } else {
        // Both tokens expired
        this.handleSessionExpiry('token_expired');
        return false;
      }
    }
    
    // Check for idle timeout
    if (now - this.session.lastActivity > AUTH_CONFIG.MAX_IDLE_TIME) {
      this.handleSessionExpiry('idle_timeout');
      return false;
    }
    
    return true;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.session?.user || null;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (!this.isAuthenticated()) return null;
    return this.session?.accessToken || null;
  }

  /**
   * Refresh access token silently
   */
  private async refreshTokenSilently(): Promise<void> {
    if (!this.session?.refreshToken) return;
    
    try {
      console.log('🔄 Refreshing access token...');
      
      const newToken = await apiService.refreshToken(this.session.refreshToken);
      
      if (newToken && this.session) {
        this.session.accessToken = newToken;
        this.session.expiresAt = Date.now() + AUTH_CONFIG.ACCESS_TOKEN_LIFETIME;
        this.updateSessionStorage();
        
        console.log('✅ Token refreshed successfully');
      }
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.handleSessionExpiry('refresh_failed');
    }
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    if (this.sessionCheckTimer) return;
    
    this.sessionCheckTimer = setInterval(() => {
      if (!this.isAuthenticated()) {
        this.clearTimers();
      }
    }, AUTH_CONFIG.SESSION_CHECK_INTERVAL);
  }

  /**
   * Start heartbeat to keep session alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    
    this.heartbeatTimer = setInterval(async () => {
      if (this.session && this.isAuthenticated()) {
        try {
          // Send heartbeat to server
          await this.sendHeartbeat();
        } catch (error) {
          console.warn('Heartbeat failed:', error);
        }
      }
    }, AUTH_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Send heartbeat to server
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.session?.accessToken) return;
    
    try {
      // Use token verification as heartbeat
      const isValid = await apiService.verifyToken(this.session.accessToken);
      if (!isValid) {
        this.handleSessionExpiry('server_invalidation');
      }
    } catch (error) {
      // Don't immediately logout on heartbeat failure - could be network issue
      console.warn('Heartbeat verification failed:', error);
    }
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpiry(reason: string): void {
    console.log(`⏰ Session expired: ${reason}`);
    
    this.clearSessionData();
    this.clearTimers();
    
    this.notifyAuthStateListeners(false, null);
    this.notifySessionEndListeners(reason);
  }

  /**
   * Restore session from storage
   */
  private restoreSession(): void {
    try {
      const sessionData = this.sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
      const userData = this.sessionStorage.getItem(AUTH_CONFIG.USER_KEY);
      const accessToken = this.sessionStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
      const refreshToken = this.persistentStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      
      if (sessionData && userData && accessToken) {
        const session: AuthSession = JSON.parse(sessionData);
        session.accessToken = accessToken;
        session.refreshToken = refreshToken || accessToken;
        session.user = JSON.parse(userData);
        
        // Validate session
        const now = Date.now();
        if (now < session.refreshExpiresAt) {
          this.session = session;
          console.log('✅ Session restored from storage');
          
          // Check if tokens need refresh
          if (now > session.expiresAt) {
            this.refreshTokenSilently();
          }
          
          // Notify listeners
          this.notifyAuthStateListeners(true, session.user);
        } else {
          console.log('❌ Stored session expired, clearing...');
          this.clearSessionData();
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSessionData();
    }
  }

  /**
   * Update session storage
   */
  private updateSessionStorage(): void {
    if (!this.session) return;
    
    try {
      // Store session metadata (no tokens)
      const sessionMetadata = {
        sessionId: this.session.sessionId,
        expiresAt: this.session.expiresAt,
        refreshExpiresAt: this.session.refreshExpiresAt,
        lastActivity: this.session.lastActivity,
        deviceInfo: this.session.deviceInfo,
      };
      
      this.sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(sessionMetadata));
      this.sessionStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(this.session.user));
      this.sessionStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, this.session.accessToken);
      
    } catch (error) {
      console.error('Failed to update session storage:', error);
    }
  }

  /**
   * Update persistent storage (preferences only)
   */
  private updatePersistentStorage(): void {
    if (!this.session) return;
    
    try {
      // Only store refresh token in localStorage (encrypted in production)
      this.persistentStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, this.session.refreshToken);
      
      // Store user preferences (non-sensitive data)
      const preferences = {
        lastUsername: this.session.user.email,
        theme: 'auto', // Default theme
        language: 'en',
      };
      
      this.persistentStorage.setItem(AUTH_CONFIG.PREFERENCES_KEY, JSON.stringify(preferences));
      
    } catch (error) {
      console.error('Failed to update persistent storage:', error);
    }
  }

  /**
   * Clear all session data
   */
  private clearSessionData(): void {
    this.session = null;
    
    // Clear session storage
    this.sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    this.sessionStorage.removeItem(AUTH_CONFIG.USER_KEY);
    this.sessionStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    
    // Clear persistent storage (keep preferences)
    this.persistentStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
      this.sessionCheckTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // Event Handlers
  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.session) {
      // Update last activity before unload
      this.session.lastActivity = Date.now();
      this.updateSessionStorage();
      
      // For security, clear access token on unload (refresh token remains)
      this.sessionStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    }
  }

  private handleUnload(): void {
    // Final cleanup on page unload
    this.clearTimers();
    if (this.session) {
      this.sessionStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page hidden - user switched tabs or minimized
      if (this.session) {
        this.session.lastActivity = Date.now();
        this.updateSessionStorage();
      }
    } else {
      // Page visible again - validate session
      if (!this.isAuthenticated()) {
        this.clearSessionData();
        this.notifyAuthStateListeners(false, null);
      }
    }
  }

  private handleWindowFocus(): void {
    // Window gained focus - revalidate session
    if (this.session && !this.isAuthenticated()) {
      this.handleSessionExpiry('focus_validation_failed');
    }
  }

  private handleWindowBlur(): void {
    // Window lost focus - update activity
    if (this.session) {
      this.session.lastActivity = Date.now();
      this.updateSessionStorage();
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    // Handle cross-tab authentication changes
    if (event.key === AUTH_CONFIG.REFRESH_TOKEN_KEY) {
      if (!event.newValue && this.session) {
        // Refresh token removed in another tab - logout
        this.handleSessionExpiry('cross_tab_logout');
      }
    }
  }

  private handleOnline(): void {
    // Back online - validate session
    if (this.session) {
      this.sendHeartbeat();
    }
  }

  private handleOffline(): void {
    console.log('📶 App went offline - sessions will be validated when back online');
  }

  // Utility Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): string {
    return `${navigator.userAgent.split(' ')[0]} | ${navigator.platform}`;
  }

  // Event Listeners Management
  addAuthStateListener(listener: (isAuthenticated: boolean, user: User | null) => void): void {
    this.authStateListeners.push(listener);
  }

  removeAuthStateListener(listener: (isAuthenticated: boolean, user: User | null) => void): void {
    const index = this.authStateListeners.indexOf(listener);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  addSessionEndListener(listener: (reason: string) => void): void {
    this.sessionEndListeners.push(listener);
  }

  removeSessionEndListener(listener: (reason: string) => void): void {
    const index = this.sessionEndListeners.indexOf(listener);
    if (index > -1) {
      this.sessionEndListeners.splice(index, 1);
    }
  }

  private notifyAuthStateListeners(isAuthenticated: boolean, user: User | null): void {
    this.authStateListeners.forEach(listener => {
      try {
        listener(isAuthenticated, user);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  private notifySessionEndListeners(reason: string): void {
    this.sessionEndListeners.forEach(listener => {
      try {
        listener(reason);
      } catch (error) {
        console.error('Session end listener error:', error);
      }
    });
  }

  /**
   * Get user preferences from persistent storage
   */
  getUserPreferences(): any {
    try {
      const prefs = this.persistentStorage.getItem(AUTH_CONFIG.PREFERENCES_KEY);
      return prefs ? JSON.parse(prefs) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Force logout (emergency)
   */
  forceLogout(reason: string = 'forced'): void {
    this.clearSessionData();
    this.clearTimers();
    this.notifyAuthStateListeners(false, null);
    this.notifySessionEndListeners(reason);
  }

  /**
   * Get session info for debugging
   */
  getSessionInfo(): any {
    if (!this.session) return null;
    
    return {
      sessionId: this.session.sessionId,
      isValid: this.isAuthenticated(),
      expiresAt: new Date(this.session.expiresAt).toISOString(),
      refreshExpiresAt: new Date(this.session.refreshExpiresAt).toISOString(),
      lastActivity: new Date(this.session.lastActivity).toISOString(),
      deviceInfo: this.session.deviceInfo,
      user: {
        id: this.session.user.id,
        email: this.session.user.email,
        role: this.session.user.role,
      }
    };
  }
}

// Export singleton instance
export const advancedAuthService = new AdvancedAuthService();
export default advancedAuthService;