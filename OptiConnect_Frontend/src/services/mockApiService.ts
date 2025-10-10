/**
 * Mock API Service
 * Simulates backend API responses for offline development
 */

import {
  mockUsers,
  mockRegions,
  mockGroups,
  getMockUserByCredentials,
  getMockUserById,
  generateMockToken
} from './mockData';
import type { User } from '../types/auth.types';

/**
 * Simulate API delay
 */
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock API Service
 */
export const mockApiService = {
  /**
   * Mock Login
   */
  login: async (email: string, password: string) => {
    await delay(800);

    const user = getMockUserByCredentials(email, password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status === 'Inactive') {
      throw new Error('Account is deactivated. Please contact administrator.');
    }

    const token = generateMockToken(user.id);

    // Store mock token in localStorage
    localStorage.setItem('opti_connect_token', token);
    localStorage.setItem('opti_connect_user', JSON.stringify(user));

    return {
      success: true,
      token,
      user
    };
  },

  /**
   * Mock Register
   */
  register: async (userData: Partial<User>) => {
    await delay(800);

    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new mock user
    const newUser: User = {
      id: `OCGID${String(mockUsers.length + 1).padStart(3, '0')}`,
      username: userData.username || '',
      name: userData.name || '',
      email: userData.email || '',
      password: userData.password || 'ChangeMe@123',
      gender: userData.gender || 'Other',
      phoneNumber: userData.phoneNumber || '',
      address: userData.address || { street: '', city: '', state: '', pincode: '' },
      officeLocation: userData.officeLocation || '',
      assignedUnder: [],
      role: userData.role || 'User',
      assignedRegions: userData.assignedRegions || [],
      groups: [],
      status: 'Active',
      loginHistory: [],
      company: 'Opti Telemedia',
      permissions: ['read'],
      lastLogin: new Date().toISOString()
    };

    mockUsers.push(newUser);
    const token = generateMockToken(newUser.id);

    return {
      success: true,
      token,
      user: newUser
    };
  },

  /**
   * Mock Get Current User
   */
  getCurrentUser: async () => {
    await delay(300);

    const token = localStorage.getItem('opti_connect_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const userStr = localStorage.getItem('opti_connect_user');
    if (!userStr) {
      throw new Error('User not found');
    }

    const user = JSON.parse(userStr) as User;
    return {
      success: true,
      user
    };
  },

  /**
   * Mock Get All Users
   */
  getAllUsers: async () => {
    await delay(500);
    return {
      success: true,
      users: mockUsers
    };
  },

  /**
   * Mock Get User By ID
   */
  getUserById: async (id: string) => {
    await delay(300);
    const user = getMockUserById(id);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user
    };
  },

  /**
   * Mock Create User
   */
  createUser: async (userData: Partial<User>) => {
    await delay(800);

    // Check if username or email already exists
    const existingUser = mockUsers.find(
      u => u.email === userData.email || u.username === userData.username
    );

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Create new user
    const newUser: User = {
      id: `OCGID${String(mockUsers.length + 1).padStart(3, '0')}`,
      username: userData.username || '',
      name: userData.name || '',
      email: userData.email || '',
      password: 'ChangeMe@123',
      gender: userData.gender || 'Other',
      phoneNumber: userData.phoneNumber || '',
      address: userData.address || { street: '', city: '', state: '', pincode: '' },
      officeLocation: userData.officeLocation || '',
      assignedUnder: [],
      role: userData.role || 'User',
      assignedRegions: userData.assignedRegions || [],
      groups: [],
      status: 'Active',
      loginHistory: [],
      company: 'Opti Telemedia',
      permissions: ['read'],
      lastLogin: new Date().toISOString()
    };

    mockUsers.push(newUser);

    return {
      success: true,
      user: newUser
    };
  },

  /**
   * Mock Update User
   */
  updateUser: async (id: string, userData: Partial<User>) => {
    await delay(600);

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...userData
    };

    return {
      success: true,
      user: mockUsers[userIndex]
    };
  },

  /**
   * Mock Delete User
   */
  deleteUser: async (id: string) => {
    await delay(500);

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockUsers.splice(userIndex, 1);

    return {
      success: true,
      message: 'User deleted successfully'
    };
  },

  /**
   * Mock Get All Regions
   */
  getAllRegions: async () => {
    await delay(400);
    return {
      success: true,
      regions: mockRegions
    };
  },

  /**
   * Mock Get All Groups
   */
  getAllGroups: async () => {
    await delay(400);
    return {
      success: true,
      groups: mockGroups
    };
  },

  /**
   * Mock Logout
   */
  logout: async () => {
    await delay(200);
    localStorage.removeItem('opti_connect_token');
    localStorage.removeItem('opti_connect_user');

    return {
      success: true,
      message: 'Logged out successfully'
    };
  },

  /**
   * Check if using mock mode
   */
  isMockMode: () => {
    return process.env.REACT_APP_USE_MOCK_API === 'true';
  }
};

export default mockApiService;
