/**
 * User Service
 * Handles all user-related API calls and data transformations
 * Maps between frontend User model and backend user model
 */

import axios from 'axios';
import type { User } from '../types/auth.types';

// Create axios instance for user APIs
const BACKEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization header interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('opti_connect_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend user model (from MySQL database)
interface BackendUser {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  full_name: string;
  gender?: string;
  phone?: string;
  department?: string;
  office_location?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  role: string; // 'admin' | 'manager' | 'engineer' | 'viewer'
  is_active: boolean;
  assignedRegions?: string[]; // Array of region names
  regions?: Array<{id: number; name: string; code: string; type: string; access_level: string}> | string; // Array of region objects or JSON string (for backward compatibility)
  created_at?: string;
  updated_at?: string;
}

// Backend API response formats
interface BackendUserResponse {
  success: boolean;
  user: BackendUser;
  message?: string;
}

interface BackendUsersListResponse {
  success: boolean;
  users: BackendUser[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}

interface BulkOperationResponse {
  success: boolean;
  count: number;
  message?: string;
}

/**
 * Extract numeric ID from OCGID format (OCGID001 -> 1)
 */
function extractNumericId(id: string): string {
  if (id.startsWith('OCGID')) {
    return id.replace('OCGID', '').replace(/^0+/, '') || '0';
  }
  return id;
}

/**
 * Map backend role to frontend role
 */
function mapBackendRole(backendRole: string): 'Admin' | 'Manager' | 'Technician' | 'User' {
  const role = backendRole?.toLowerCase();
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Manager';
    case 'engineer':
    case 'technician':
      return 'Technician';
    case 'viewer':
    case 'user':
    default:
      return 'User';
  }
}

/**
 * Map frontend role to backend role
 */
function mapFrontendRole(frontendRole: 'Admin' | 'Manager' | 'Technician' | 'User'): string {
  switch (frontendRole) {
    case 'Admin':
      return 'admin';
    case 'Manager':
      return 'manager';
    case 'Technician':
      return 'engineer';
    case 'User':
    default:
      return 'viewer';
  }
}

/**
 * Transform backend user to frontend user model
 */
function transformBackendUser(backendUser: BackendUser): User {
  // Parse regions - handle multiple formats
  let regions: string[] = [];

  // Priority 1: Use assignedRegions if it's a simple array of strings
  if (backendUser.assignedRegions && Array.isArray(backendUser.assignedRegions)) {
    regions = backendUser.assignedRegions;
  }
  // Priority 2: Parse regions field (for backward compatibility)
  else if (backendUser.regions) {
    try {
      if (typeof backendUser.regions === 'string') {
        // Parse JSON string
        regions = JSON.parse(backendUser.regions);
      } else if (Array.isArray(backendUser.regions)) {
        // Extract region names from array of objects
        regions = backendUser.regions.map(r => r.name);
      }
    } catch (e) {
      console.error('Error parsing regions:', e);
      regions = [];
    }
  }

  return {
    id: `OCGID${String(backendUser.id).padStart(3, '0')}`, // Format numeric ID as OCGID001
    username: backendUser.username,
    name: backendUser.full_name,
    email: backendUser.email,
    password: '********', // Never expose password hash
    gender: (backendUser.gender || 'Other') as 'Male' | 'Female' | 'Other',
    phoneNumber: backendUser.phone || '',
    address: {
      street: backendUser.street || '',
      city: backendUser.city || '',
      state: backendUser.state || '',
      pincode: backendUser.pincode || ''
    },
    officeLocation: backendUser.office_location || '',
    assignedUnder: [], // Not directly mapped, would need additional API
    role: mapBackendRole(backendUser.role),
    assignedRegions: regions,
    groups: [],
    status: backendUser.is_active ? 'Active' : 'Inactive',
    loginHistory: [],
    company: 'Opti Telemedia', // Default company
    permissions: [], // Would need additional API call
    lastLogin: backendUser.updated_at || new Date().toISOString()
  };
}

/**
 * Transform frontend user to backend user format for create/update
 */
function transformFrontendUser(frontendUser: Partial<User>): any {
  return {
    username: frontendUser.username,
    email: frontendUser.email,
    full_name: frontendUser.name,
    gender: frontendUser.gender,
    phone: frontendUser.phoneNumber,
    department: frontendUser.department,
    office_location: frontendUser.officeLocation,
    street: frontendUser.address?.street,
    city: frontendUser.address?.city,
    state: frontendUser.address?.state,
    pincode: frontendUser.address?.pincode,
    role: frontendUser.role ? mapFrontendRole(frontendUser.role) : 'viewer',
    is_active: frontendUser.status === 'Active',
    // Send assignedRegions as array of region names (not stringified)
    assignedRegions: frontendUser.assignedRegions || []
  };
}

/**
 * Get all users from backend
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await apiClient.get<BackendUsersListResponse>('/users');

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch users');
    }

    return response.data.users.map(transformBackendUser);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch users');
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  try {
    const numericId = extractNumericId(id);
    const response = await apiClient.get<BackendUserResponse>(`/users/${numericId}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch user');
    }

    return transformBackendUser(response.data.user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user');
  }
}

/**
 * Create new user
 */
export async function createUser(userData: Partial<User>): Promise<User> {
  try {
    // Transform to backend format
    const backendData = transformFrontendUser(userData);

    // Add password if provided (only for create)
    const createData = {
      ...backendData,
      password: userData.password || 'ChangeMe@123' // Default password if not provided
    };

    // DEBUG: Log what we're sending
    console.log('=== FRONTEND CREATE USER DEBUG ===');
    console.log('Original userData:', userData);
    console.log('Transformed backendData:', backendData);
    console.log('Final createData:', createData);
    console.log('assignedRegions:', createData.assignedRegions);
    console.log('=================================');

    const response = await apiClient.post<BackendUserResponse>('/users', createData);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create user');
    }

    return transformBackendUser(response.data.user);
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to create user');
  }
}

/**
 * Update existing user
 */
export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  try {
    const numericId = extractNumericId(id);
    // Transform to backend format
    const backendData = transformFrontendUser(userData);

    const response = await apiClient.put<BackendUserResponse>(`/users/${numericId}`, backendData);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update user');
    }

    return transformBackendUser(response.data.user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update user');
  }
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    const numericId = extractNumericId(id);
    const response = await apiClient.delete<{ success: boolean; message?: string }>(`/users/${numericId}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete user');
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to delete user');
  }
}

/**
 * Update user status (Active/Inactive)
 */
export async function updateUserStatus(id: string, status: 'Active' | 'Inactive'): Promise<User> {
  try {
    const response = await apiClient.patch<BackendUserResponse>(`/users/${id}/status`, {
      is_active: status === 'Active'
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update user status');
    }

    return transformBackendUser(response.data.user);
  } catch (error: any) {
    console.error('Error updating user status:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update user status');
  }
}

/**
 * Bulk create users
 */
export async function bulkCreateUsers(users: Partial<User>[]): Promise<BulkOperationResponse> {
  try {
    // Transform all users to backend format
    const backendUsers = users.map(user => ({
      ...transformFrontendUser(user),
      password: user.password || 'ChangeMe@123'
    }));

    const response = await apiClient.post<BulkOperationResponse>('/users/bulk-create', {
      users: backendUsers
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create users');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error bulk creating users:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to create users');
  }
}

/**
 * Bulk delete users
 */
export async function bulkDeleteUsers(ids: string[]): Promise<BulkOperationResponse> {
  try {
    const numericIds = ids.map(id => parseInt(extractNumericId(id)));
    const response = await apiClient.request<BulkOperationResponse>({
      method: 'DELETE',
      url: '/users/bulk-delete',
      data: { user_ids: numericIds } as any
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete users');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error bulk deleting users:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to delete users');
  }
}

/**
 * Bulk update user status
 */
export async function bulkUpdateStatus(ids: string[], status: 'Active' | 'Inactive'): Promise<BulkOperationResponse> {
  try {
    const numericIds = ids.map(id => parseInt(extractNumericId(id)));
    const response = await apiClient.patch<BulkOperationResponse>('/users/bulk-status', {
      user_ids: numericIds,
      is_active: status === 'Active'
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update user status');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error bulk updating status:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update user status');
  }
}

/**
 * Search users (if search API exists)
 */
export async function searchUsers(query: string): Promise<User[]> {
  try {
    // If backend has search API, use it
    // Otherwise, get all and filter on frontend
    const allUsers = await getAllUsers();

    const lowerQuery = query.toLowerCase();
    return allUsers.filter(user =>
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.username.toLowerCase().includes(lowerQuery)
    );
  } catch (error: any) {
    console.error('Error searching users:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to search users');
  }
}
