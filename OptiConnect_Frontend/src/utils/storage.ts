import { config } from './environment';

// Storage interface for consistent API across different storage backends
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string, ttl?: number): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  getSize(): Promise<number>;
}

// LocalStorage adapter for development
class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;
  private ttlPrefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
    this.ttlPrefix = `${prefix}ttl_`;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const prefixedKey = this.prefix + key;
      const ttlKey = this.ttlPrefix + key;

      // Check if item has expired
      const ttlValue = localStorage.getItem(ttlKey);
      if (ttlValue) {
        const expiryTime = parseInt(ttlValue, 10);
        if (Date.now() > expiryTime) {
          // Item has expired, remove it
          localStorage.removeItem(prefixedKey);
          localStorage.removeItem(ttlKey);
          return null;
        }
      }

      const value = localStorage.getItem(prefixedKey);

      // Decrypt if encryption is enabled
      if (value && config.storage.enableEncryption) {
        return this.decrypt(value);
      }

      return value;
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const prefixedKey = this.prefix + key;
      const ttlKey = this.ttlPrefix + key;

      // Encrypt if encryption is enabled
      const finalValue = config.storage.enableEncryption ? this.encrypt(value) : value;

      localStorage.setItem(prefixedKey, finalValue);

      // Set TTL if provided
      const expiryTime = ttl || config.storage.ttl;
      if (expiryTime > 0) {
        localStorage.setItem(ttlKey, (Date.now() + expiryTime).toString());
      }
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const prefixedKey = this.prefix + key;
      const ttlKey = this.ttlPrefix + key;

      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(ttlKey);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix) || key.startsWith(this.ttlPrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.prefix) && !key.startsWith(this.ttlPrefix))
        .map(key => key.substring(this.prefix.length));
    } catch (error) {
      console.error('Error getting all keys from localStorage:', error);
      return [];
    }
  }

  async getSize(): Promise<number> {
    try {
      let size = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          size += localStorage.getItem(key)?.length || 0;
        }
      });
      return size;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
      return 0;
    }
  }

  private encrypt(value: string): string {
    // Simple base64 encoding for demo (use proper encryption in production)
    try {
      return btoa(encodeURIComponent(value));
    } catch {
      return value;
    }
  }

  private decrypt(value: string): string {
    // Simple base64 decoding for demo (use proper decryption in production)
    try {
      return decodeURIComponent(atob(value));
    } catch {
      return value;
    }
  }
}

// API-based storage adapter for production
class ApiStorageAdapter implements StorageAdapter {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/${key}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error('Error getting item from API storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          ttl: ttl || config.storage.ttl,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error setting item in API storage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing item from API storage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/storage`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error clearing API storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/keys`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.keys;
    } catch (error) {
      console.error('Error getting all keys from API storage:', error);
      return [];
    }
  }

  async getSize(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/storage/size`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.size;
    } catch (error) {
      console.error('Error getting storage size from API:', error);
      return 0;
    }
  }
}

// Hybrid storage adapter that falls back to localStorage if API is unavailable
class HybridStorageAdapter implements StorageAdapter {
  private apiAdapter: ApiStorageAdapter;
  private localAdapter: LocalStorageAdapter;
  private useApi: boolean = true;

  constructor(apiBaseUrl: string, localPrefix: string) {
    this.apiAdapter = new ApiStorageAdapter(apiBaseUrl);
    this.localAdapter = new LocalStorageAdapter(localPrefix);
  }

  setAuthToken(token: string) {
    this.apiAdapter.setAuthToken(token);
  }

  async getItem(key: string): Promise<string | null> {
    if (this.useApi) {
      try {
        const value = await this.apiAdapter.getItem(key);
        return value;
      } catch (error) {
        console.warn('API storage failed, falling back to localStorage:', error);
        this.useApi = false;
      }
    }

    return this.localAdapter.getItem(key);
  }

  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    // Always store locally for immediate access
    await this.localAdapter.setItem(key, value, ttl);

    if (this.useApi) {
      try {
        await this.apiAdapter.setItem(key, value, ttl);
      } catch (error) {
        console.warn('API storage failed, using localStorage only:', error);
        this.useApi = false;
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    await this.localAdapter.removeItem(key);

    if (this.useApi) {
      try {
        await this.apiAdapter.removeItem(key);
      } catch (error) {
        console.warn('API storage failed for remove operation:', error);
      }
    }
  }

  async clear(): Promise<void> {
    await this.localAdapter.clear();

    if (this.useApi) {
      try {
        await this.apiAdapter.clear();
      } catch (error) {
        console.warn('API storage failed for clear operation:', error);
      }
    }
  }

  async getAllKeys(): Promise<string[]> {
    if (this.useApi) {
      try {
        return await this.apiAdapter.getAllKeys();
      } catch (error) {
        console.warn('API storage failed, using localStorage keys:', error);
      }
    }

    return this.localAdapter.getAllKeys();
  }

  async getSize(): Promise<number> {
    if (this.useApi) {
      try {
        return await this.apiAdapter.getSize();
      } catch (error) {
        console.warn('API storage failed, using localStorage size:', error);
      }
    }

    return this.localAdapter.getSize();
  }
}

// Storage factory
export const createStorageAdapter = (): StorageAdapter => {
  switch (config.app.environment) {
    case 'development':
    case 'testing':
      return new LocalStorageAdapter(config.storage.prefix);

    case 'production':
      return new HybridStorageAdapter(config.api.baseUrl, config.storage.prefix);

    default:
      return new LocalStorageAdapter(config.storage.prefix);
  }
};

// Storage service with typed methods
export class StorageService {
  private adapter: StorageAdapter;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  // Generic methods
  async getString(key: string): Promise<string | null> {
    return this.adapter.getItem(key);
  }

  async setString(key: string, value: string, ttl?: number): Promise<void> {
    return this.adapter.setItem(key, value, ttl);
  }

  // Typed methods
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await this.adapter.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error parsing JSON from storage:', error);
      return null;
    }
  }

  async setObject<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      return this.adapter.setItem(key, serialized, ttl);
    } catch (error) {
      console.error('Error serializing object to storage:', error);
      throw error;
    }
  }

  async getNumber(key: string): Promise<number | null> {
    const value = await this.adapter.getItem(key);
    return value ? parseFloat(value) : null;
  }

  async setNumber(key: string, value: number, ttl?: number): Promise<void> {
    return this.adapter.setItem(key, value.toString(), ttl);
  }

  async getBoolean(key: string): Promise<boolean | null> {
    const value = await this.adapter.getItem(key);
    return value ? value === 'true' : null;
  }

  async setBoolean(key: string, value: boolean, ttl?: number): Promise<void> {
    return this.adapter.setItem(key, value.toString(), ttl);
  }

  // Utility methods
  async remove(key: string): Promise<void> {
    return this.adapter.removeItem(key);
  }

  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  async getAllKeys(): Promise<string[]> {
    return this.adapter.getAllKeys();
  }

  async getSize(): Promise<number> {
    return this.adapter.getSize();
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.adapter.getItem(key);
    return value !== null;
  }

  // Batch operations
  async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};

    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.adapter.getItem(key);
      })
    );

    return result;
  }

  async setMultiple(items: Record<string, string>, ttl?: number): Promise<void> {
    await Promise.all(
      Object.entries(items).map(([key, value]) =>
        this.adapter.setItem(key, value, ttl)
      )
    );
  }

  async removeMultiple(keys: string[]): Promise<void> {
    await Promise.all(
      keys.map(key => this.adapter.removeItem(key))
    );
  }
}

// Create and export the storage service instance
export const storageService = new StorageService(createStorageAdapter());

// Convenience methods for common storage operations
export const storage = {
  // User preferences
  getUserPreferences: () => storageService.getObject('user_preferences'),
  setUserPreferences: (prefs: any) => storageService.setObject('user_preferences', prefs),

  // Authentication
  getAuthToken: () => storageService.getString('auth_token'),
  setAuthToken: (token: string) => storageService.setString('auth_token', token),
  removeAuthToken: () => storageService.remove('auth_token'),

  // User data
  getUserData: () => storageService.getObject('user_data'),
  setUserData: (data: any) => storageService.setObject('user_data', data),

  // Map settings
  getMapSettings: () => storageService.getObject('map_settings'),
  setMapSettings: (settings: any) => storageService.setObject('map_settings', settings),

  // Cache management
  getCacheItem: (key: string) => storageService.getObject(`cache_${key}`),
  setCacheItem: (key: string, data: any, ttl?: number) =>
    storageService.setObject(`cache_${key}`, data, ttl),
  clearCache: async () => {
    const keys = await storageService.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    await storageService.removeMultiple(cacheKeys);
  },

  // Application state
  getAppState: () => storageService.getObject('app_state'),
  setAppState: (state: any) => storageService.setObject('app_state', state),

  // Session data
  getSessionData: () => storageService.getObject('session_data'),
  setSessionData: (data: any) => storageService.setObject('session_data', data),
  clearSessionData: () => storageService.remove('session_data'),
};