import axios from 'axios';
import type { User } from '../types/auth.types';
import type { TelecomTower, NetworkCoverage } from '../store/slices/dataSlice';
import type { AnalyticsMetric, PerformanceData } from '../store/slices/analyticsSlice';

// API Configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3001/api',
    timeout: 10000,
  },
  production: {
    baseURL: process.env.REACT_APP_API_BASE_URL || 'https://api.opticonnect.com',
    timeout: 30000,
  },
};

// Get current environment configuration
const config = process.env.NODE_ENV === 'production'
  ? API_CONFIG.production
  : API_CONFIG.development;

// Create axios instance
const apiClient = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('opti_connect_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    if (config.headers) {
      config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      config.headers['X-Request-Time'] = new Date().toISOString();
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: any) => {
    return response;
  },
  (error: any) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      localStorage.removeItem('opti_connect_token');
      localStorage.removeItem('opti_connect_user');
      window.location.href = '/login';
    }

    if (error.response?.status === 403) {
      // Forbidden - show permission error
      console.error('Access forbidden:', error.response.data);
    }

    if (error.response?.status >= 500) {
      // Server error - show generic error message
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Type definitions for API responses
interface LoginRequest {
  email: string;
  password: string;
  company?: string;
}

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Mock data for development
const MOCK_TOWERS: TelecomTower[] = [
  {
    id: 'tower_001',
    name: 'Delhi Central Tower',
    type: 'cell_tower',
    position: { lat: 28.6139, lng: 77.2090 },
    status: 'active',
    company: 'Jio',
    height: 45,
    frequency: ['1800MHz', '2300MHz'],
    coverage_radius: 2000,
    installation_date: '2020-03-15',
    last_maintenance: '2024-08-15',
    technical_specs: {
      power: '250W',
      antenna_gain: '18dBi',
      technology: '4G/5G',
    },
    metadata: {},
  },
  {
    id: 'tower_002',
    name: 'Mumbai BKC Tower',
    type: 'base_station',
    position: { lat: 19.0760, lng: 72.8777 },
    status: 'active',
    company: 'Airtel',
    height: 60,
    frequency: ['900MHz', '1800MHz', '2100MHz'],
    coverage_radius: 3000,
    installation_date: '2019-11-20',
    last_maintenance: '2024-07-10',
    technical_specs: {
      power: '500W',
      antenna_gain: '20dBi',
      technology: '3G/4G/5G',
    },
    metadata: {},
  },
];

class ApiService {
  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (process.env.NODE_ENV === 'development') {
      // Mock authentication for development
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        user: {
          id: 'user_1',
          email: credentials.email,
          name: 'Demo User',
          role: 'Admin',
          company: credentials.company || 'Demo Company',
          permissions: ['all'],
          lastLogin: new Date().toISOString(),
          username: credentials.email.split('@')[0],
          password: '********',
          gender: 'Other',
          phoneNumber: '+91-0000000000',
          address: {
            street: 'Demo Street',
            city: 'Demo City',
            state: 'Maharashtra',
            pincode: '000000'
          },
          officeLocation: 'Demo Office',
          assignedUnder: [],
          assignedRegions: ['Maharashtra'],
          groups: [],
          status: 'Active',
          loginHistory: [],
        },
        token: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
        expiresIn: 3600,
      };
    }

    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data.data;
  }

  async logout(token: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve();
    }

    await apiClient.post('/auth/logout', { token });
  }

  async refreshToken(token: string): Promise<string> {
    if (process.env.NODE_ENV === 'development') {
      return `refreshed_mock_token_${Date.now()}`;
    }

    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh', { token });
    return response.data.data.token;
  }

  async verifyToken(token: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    try {
      await apiClient.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch {
      return false;
    }
  }

  // Tower Data Management
  async getTowers(filters?: any): Promise<TelecomTower[]> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_TOWERS;
    }

    const response = await apiClient.get<ApiResponse<TelecomTower[]>>('/towers', { params: filters });
    return response.data.data;
  }

  async getTowerById(id: string): Promise<TelecomTower> {
    if (process.env.NODE_ENV === 'development') {
      const tower = MOCK_TOWERS.find(t => t.id === id);
      if (!tower) throw new Error('Tower not found');
      return tower;
    }

    const response = await apiClient.get<ApiResponse<TelecomTower>>(`/towers/${id}`);
    return response.data.data;
  }

  async createTower(tower: Omit<TelecomTower, 'id'>): Promise<TelecomTower> {
    if (process.env.NODE_ENV === 'development') {
      const newTower: TelecomTower = {
        ...tower,
        id: `tower_${Date.now()}`,
      };
      return newTower;
    }

    const response = await apiClient.post<ApiResponse<TelecomTower>>('/towers', tower);
    return response.data.data;
  }

  async updateTower(id: string, updates: Partial<TelecomTower>): Promise<TelecomTower> {
    if (process.env.NODE_ENV === 'development') {
      const existingTower = MOCK_TOWERS.find(t => t.id === id);
      if (!existingTower) throw new Error('Tower not found');
      return { ...existingTower, ...updates };
    }

    const response = await apiClient.put<ApiResponse<TelecomTower>>(`/towers/${id}`, updates);
    return response.data.data;
  }

  async deleteTower(id: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve();
    }

    await apiClient.delete(`/towers/${id}`);
  }

  // Coverage Data
  async getCoverage(towerId?: string): Promise<NetworkCoverage[]> {
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

    const params = towerId ? { towerId } : {};
    const response = await apiClient.get<ApiResponse<NetworkCoverage[]>>('/coverage', { params });
    return response.data.data;
  }

  // Analytics Data
  async getAnalytics(timeRange: { start: string; end: string }): Promise<AnalyticsMetric[]> {
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

    const response = await apiClient.get<ApiResponse<AnalyticsMetric[]>>('/analytics', { params: timeRange });
    return response.data.data;
  }

  async getPerformanceData(timeRange: { start: string; end: string }): Promise<PerformanceData[]> {
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

    const response = await apiClient.get<ApiResponse<PerformanceData[]>>('/analytics/performance', { params: timeRange });
    return response.data.data;
  }

  // File Upload/Import
  async uploadFile(file: File, type: 'towers' | 'coverage' | 'analytics'): Promise<{ jobId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    if (process.env.NODE_ENV === 'development') {
      return { jobId: `job_${Date.now()}` };
    }

    const response = await apiClient.post<ApiResponse<{ jobId: string }>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  // Export Data
  async exportData(type: 'towers' | 'coverage' | 'analytics', format: 'csv' | 'excel' | 'json', filters?: any): Promise<Blob> {
    if (process.env.NODE_ENV === 'development') {
      return new Blob(['mock,data\n1,test'], { type: 'text/csv' });
    }

    const response = await apiClient.post(`/export/${type}`,
      { format, filters },
      { responseType: 'blob' }
    );

    return response.data as Blob;
  }

  // User Management APIs
  async getUsers(filters?: any): Promise<User[]> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock users data
      return [
        {
          id: 'USER001',
          username: 'admin_raj',
          name: 'Rajesh Kumar',
          email: 'rajesh.kumar@jio.com',
          password: '********',
          gender: 'Male',
          phoneNumber: '+91-9876543210',
          address: {
            street: '123 Tech Park',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          },
          officeLocation: 'Mumbai HQ',
          assignedUnder: [],
          role: 'Admin',
          assignedRegions: ['Maharashtra', 'Gujarat'],
          groups: [],
          status: 'Active',
          loginHistory: [
            { timestamp: new Date('2024-01-15T10:30:00'), location: 'Mumbai, India' }
          ],
          company: 'Jio',
          permissions: ['all'],
        },
        {
          id: 'USER002',
          username: 'manager_priya',
          name: 'Priya Sharma',
          email: 'priya.sharma@airtel.com',
          password: '********',
          gender: 'Female',
          phoneNumber: '+91-9876543211',
          address: {
            street: '456 Business District',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          officeLocation: 'Delhi Regional Office',
          assignedUnder: ['USER001'],
          role: 'Manager',
          assignedRegions: ['Delhi', 'Punjab', 'Haryana'],
          groups: [],
          status: 'Active',
          loginHistory: [
            { timestamp: new Date('2024-01-15T09:45:00'), location: 'Delhi, India' }
          ],
          company: 'Airtel',
          permissions: ['read', 'write', 'manage_team'],
        },
      ];
    }

    const response = await apiClient.get<ApiResponse<User[]>>('/users', { params: filters });
    return response.data.data;
  }

  async getUserById(id: string): Promise<User> {
    if (process.env.NODE_ENV === 'development') {
      throw new Error('User not found');
    }

    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  }

  async createUser(user: Omit<User, 'id' | 'loginHistory'>): Promise<User> {
    if (process.env.NODE_ENV === 'development') {
      const newUser: User = {
        ...user,
        id: `USER${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        loginHistory: [],
      };
      return newUser;
    }

    const response = await apiClient.post<ApiResponse<User>>('/users', user);
    return response.data.data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (process.env.NODE_ENV === 'development') {
      return { id, ...updates } as User;
    }

    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, updates);
    return response.data.data;
  }

  async deleteUser(id: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve();
    }

    await apiClient.delete(`/users/${id}`);
  }

  async bulkUpdateUsers(userIds: string[], updates: Partial<User>): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve();
    }

    await apiClient.post('/users/bulk-update', { userIds, updates });
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve();
    }

    await apiClient.post('/users/bulk-delete', { userIds });
  }

  async exportUsers(format: 'csv' | 'excel' | 'json', filters?: any): Promise<Blob> {
    if (process.env.NODE_ENV === 'development') {
      return new Blob(['user,email\nTest User,test@example.com'], { type: 'text/csv' });
    }

    const response = await apiClient.post(`/users/export`,
      { format, filters },
      { responseType: 'blob' }
    );

    return response.data as Blob;
  }

  async importUsers(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    if (process.env.NODE_ENV === 'development') {
      return { success: 10, failed: 0, errors: [] };
    }

    const response = await apiClient.post<ApiResponse<{ success: number; failed: number; errors: string[] }>>(
      '/users/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  async resetPassword(userId: string, newPassword?: string): Promise<{ temporaryPassword?: string }> {
    if (process.env.NODE_ENV === 'development') {
      return { temporaryPassword: 'Temp123!' };
    }

    const response = await apiClient.post<ApiResponse<{ temporaryPassword?: string }>>(
      `/users/${userId}/reset-password`,
      { newPassword }
    );

    return response.data.data;
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    try {
      const response = await apiClient.get<{ status: string; timestamp: string; version: string }>('/health');
      return response.data;
    } catch {
      return {
        status: process.env.NODE_ENV === 'development' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export individual methods for convenience
export const {
  login,
  logout,
  refreshToken,
  verifyToken,
  getTowers,
  getTowerById,
  createTower,
  updateTower,
  deleteTower,
  getCoverage,
  getAnalytics,
  getPerformanceData,
  uploadFile,
  exportData,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  bulkDeleteUsers,
  exportUsers,
  importUsers,
  resetPassword,
  healthCheck,
} = apiService;