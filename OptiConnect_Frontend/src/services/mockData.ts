/**
 * Mock Data for Development Mode
 * Use this when backend server is not accessible (e.g., working from home)
 */

import type { User } from '../types/auth.types';

/**
 * Mock Users
 */
export const mockUsers: User[] = [
  {
    id: 'OCGID001',
    username: 'admin',
    name: 'Admin User',
    email: 'admin@opticonnect.com',
    password: 'Admin@123',
    gender: 'Male',
    phoneNumber: '+91 98765 43210',
    address: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    officeLocation: 'Mumbai HQ',
    assignedUnder: [],
    role: 'Admin',
    assignedRegions: ['Maharashtra', 'Gujarat', 'Rajasthan'],
    groups: ['Admin Group', 'Management'],
    status: 'Active',
    loginHistory: [
      {
        timestamp: new Date(),
        location: 'Mumbai, India'
      }
    ],
    company: 'Opti Telemedia',
    permissions: ['all'],
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OCGID002',
    username: 'manager1',
    name: 'John Manager',
    email: 'john.manager@opticonnect.com',
    password: 'Manager@123',
    gender: 'Male',
    phoneNumber: '+91 98765 43211',
    address: {
      street: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    officeLocation: 'Delhi Office',
    assignedUnder: ['OCGID001'],
    role: 'Manager',
    assignedRegions: ['Delhi', 'Haryana', 'Punjab'],
    groups: ['North Zone Team'],
    status: 'Active',
    loginHistory: [],
    company: 'Opti Telemedia',
    permissions: ['read', 'write', 'manage_users', 'manage_team'],
    lastLogin: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'OCGID003',
    username: 'tech1',
    name: 'Sarah Technician',
    email: 'sarah.tech@opticonnect.com',
    password: 'Tech@123',
    gender: 'Female',
    phoneNumber: '+91 98765 43212',
    address: {
      street: '789 Tech Park',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    officeLocation: 'Bangalore Tech Hub',
    assignedUnder: ['OCGID002'],
    role: 'Technician',
    assignedRegions: ['Karnataka', 'Tamil Nadu'],
    groups: ['South Zone Team', 'Field Engineers'],
    status: 'Active',
    loginHistory: [],
    company: 'Opti Telemedia',
    permissions: ['read', 'write', 'manage_towers'],
    lastLogin: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'OCGID004',
    username: 'user1',
    name: 'Mike User',
    email: 'mike.user@opticonnect.com',
    password: 'User@123',
    gender: 'Male',
    phoneNumber: '+91 98765 43213',
    address: {
      street: '321 Residential Area',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001'
    },
    officeLocation: 'Pune Branch',
    assignedUnder: ['OCGID001'],
    role: 'User',
    assignedRegions: ['Maharashtra'],
    groups: ['West Zone Team'],
    status: 'Active',
    loginHistory: [],
    company: 'Opti Telemedia',
    permissions: ['read', 'view_reports'],
    lastLogin: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 'OCGID005',
    username: 'inactive1',
    name: 'Inactive User',
    email: 'inactive@opticonnect.com',
    password: 'Inactive@123',
    gender: 'Other',
    phoneNumber: '+91 98765 43214',
    address: {
      street: '555 Old Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001'
    },
    officeLocation: 'Chennai Office',
    assignedUnder: [],
    role: 'User',
    assignedRegions: ['Tamil Nadu'],
    groups: [],
    status: 'Inactive',
    loginHistory: [],
    company: 'Opti Telemedia',
    permissions: ['read'],
    lastLogin: new Date(Date.now() - 2592000000).toISOString()
  }
];

/**
 * Mock Regions
 */
export const mockRegions = [
  { id: 1, name: 'Maharashtra', code: 'MH', type: 'state', userCount: 15 },
  { id: 2, name: 'Gujarat', code: 'GJ', type: 'state', userCount: 12 },
  { id: 3, name: 'Rajasthan', code: 'RJ', type: 'state', userCount: 8 },
  { id: 4, name: 'Delhi', code: 'DL', type: 'state', userCount: 10 },
  { id: 5, name: 'Haryana', code: 'HR', type: 'state', userCount: 7 },
  { id: 6, name: 'Punjab', code: 'PB', type: 'state', userCount: 6 },
  { id: 7, name: 'Karnataka', code: 'KA', type: 'state', userCount: 14 },
  { id: 8, name: 'Tamil Nadu', code: 'TN', type: 'state', userCount: 11 },
];

/**
 * Mock Groups
 */
export const mockGroups = [
  {
    id: 'GRP001',
    name: 'Admin Group',
    description: 'Administrative users with full access',
    members: ['OCGID001'],
    permissions: ['all'],
    createdBy: 'OCGID001',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'GRP002',
    name: 'North Zone Team',
    description: 'Team managing northern regions',
    members: ['OCGID002'],
    permissions: ['view_users', 'manage_regions'],
    createdBy: 'OCGID001',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'GRP003',
    name: 'South Zone Team',
    description: 'Team managing southern regions',
    members: ['OCGID003'],
    permissions: ['view_map', 'edit_infrastructure'],
    createdBy: 'OCGID001',
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'GRP004',
    name: 'Field Engineers',
    description: 'Field technicians and engineers',
    members: ['OCGID003'],
    permissions: ['view_map', 'edit_infrastructure'],
    createdBy: 'OCGID002',
    createdAt: '2024-02-15T00:00:00Z'
  }
];

/**
 * Get mock user by email and password
 */
export const getMockUserByCredentials = (email: string, password: string): User | null => {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  return user || null;
};

/**
 * Get mock user by ID
 */
export const getMockUserById = (id: string): User | null => {
  return mockUsers.find(u => u.id === id) || null;
};

/**
 * Generate mock token
 */
export const generateMockToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};
