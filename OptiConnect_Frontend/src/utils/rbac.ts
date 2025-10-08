import type { User } from '../types/auth.types';
import type { Permission, UserRole } from '../types/common.types';

// Role-Based Access Control (RBAC) Utilities

// Role hierarchy (higher number = more privileges)
const ROLE_HIERARCHY: Record<string, number> = {
  'User': 1,
  'Technician': 2,
  'Manager': 3,
  'Admin': 4,
};

// Default permissions for each role
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  'Admin': [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'towers:create',
    'towers:read',
    'towers:update',
    'towers:delete',
    'analytics:read',
    'analytics:export',
    'settings:read',
    'settings:update',
    'audit:read',
  ],
  'Manager': [
    'users:read',
    'users:update',
    'towers:create',
    'towers:read',
    'towers:update',
    'analytics:read',
    'analytics:export',
  ],
  'Technician': [
    'towers:create',
    'towers:read',
    'towers:update',
    'analytics:read',
  ],
  'User': [
    'towers:read',
    'analytics:read',
  ],
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;

  // Admin has all permissions
  if (user.role === 'Admin') return true;

  // Check explicit permissions
  if (user.permissions?.includes(permission)) return true;

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if a user has a specific role
 */
export const hasRole = (user: User | null, role: UserRole | string): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * Check if a user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roles: (UserRole | string)[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

/**
 * Check if a user's role is at least the specified level
 */
export const hasMinimumRole = (user: User | null, minimumRole: UserRole | string): boolean => {
  if (!user) return false;

  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

  return userLevel >= requiredLevel;
};

/**
 * Check if a user can manage another user (based on hierarchy)
 */
export const canManageUser = (manager: User | null, targetUser: User): boolean => {
  if (!manager) return false;

  // Admin can manage everyone
  if (manager.role === 'Admin') return true;

  // Can't manage yourself
  if (manager.id === targetUser.id) return false;

  // Manager can manage users in their hierarchy
  if (manager.role === 'Manager') {
    // Check if target user is assigned under the manager
    return targetUser.assignedUnder.includes(manager.id);
  }

  return false;
};

/**
 * Check if a user can access a specific region
 */
export const canAccessRegion = (user: User | null, region: string): boolean => {
  if (!user) return false;

  // Admin can access all regions
  if (user.role === 'Admin') return true;

  // Check if user is assigned to the region
  return user.assignedRegions.includes(region);
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = (user: User | null): Permission[] => {
  if (!user) return [];

  // Admin has all permissions
  if (user.role === 'Admin') {
    return Object.values(ROLE_PERMISSIONS).flat() as Permission[];
  }

  // Combine role-based and explicit permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const userPermissions = user.permissions || [];

  // Merge and deduplicate
  return Array.from(new Set([...rolePermissions, ...userPermissions])) as Permission[];
};

/**
 * Check if a user is active
 */
export const isUserActive = (user: User | null): boolean => {
  if (!user) return false;
  return user.status === 'Active';
};

/**
 * Filter users that the current user can manage
 */
export const filterManageableUsers = (currentUser: User | null, users: User[]): User[] => {
  if (!currentUser) return [];

  // Admin can manage all users
  if (currentUser.role === 'Admin') {
    return users;
  }

  // Filter users based on management hierarchy
  return users.filter(user => canManageUser(currentUser, user));
};

/**
 * Get user's accessible regions
 */
export const getAccessibleRegions = (user: User | null, allRegions: string[]): string[] => {
  if (!user) return [];

  // Admin can access all regions
  if (user.role === 'Admin') {
    return allRegions;
  }

  return user.assignedRegions;
};

/**
 * Validate if an action is allowed for a user
 */
export const canPerformAction = (
  user: User | null,
  action: 'create' | 'read' | 'update' | 'delete',
  resource: 'users' | 'towers' | 'analytics' | 'settings' | 'audit'
): boolean => {
  const permission = `${resource}:${action}` as Permission;
  return hasPermission(user, permission);
};

/**
 * Get role display information
 */
export const getRoleInfo = (role: UserRole | string): {
  name: string;
  level: number;
  color: string;
  permissions: Permission[];
} => {
  return {
    name: role,
    level: ROLE_HIERARCHY[role] || 0,
    color: {
      'Admin': 'purple',
      'Manager': 'blue',
      'Technician': 'green',
      'User': 'gray',
    }[role] || 'gray',
    permissions: ROLE_PERMISSIONS[role] || [],
  };
};

/**
 * Check if user can perform bulk operations
 */
export const canPerformBulkOperations = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['Admin', 'Manager']);
};

/**
 * Check if user can export data
 */
export const canExportData = (user: User | null): boolean => {
  if (!user) return false;
  return hasPermission(user, 'analytics:export');
};

/**
 * Check if user can import data
 */
export const canImportData = (user: User | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ['Admin', 'Manager']);
};