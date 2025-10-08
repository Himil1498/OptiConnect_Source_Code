/**
 * Permission Checking Utilities
 * Handles permission validation with wildcard support and ownership checks
 */

import type { User } from '../types/auth.types';
import type {
  PermissionCheckResult,
  EffectivePermissions,
  UserGroup
} from '../types/permissions.types';
import { DEFAULT_ROLE_PERMISSIONS } from '../types/permissions.types';

/**
 * Get user's effective permissions (role + direct + groups)
 */
export function getEffectivePermissions(user: User | null): EffectivePermissions {
  if (!user) {
    return {
      direct: [],
      fromGroups: [],
      all: new Set()
    };
  }

  const allPermissions = new Set<string>();

  // 1. Admin has ALL permissions
  if (user.role === 'Admin') {
    allPermissions.add('*');
    return {
      direct: ['*'],
      fromGroups: [],
      all: allPermissions
    };
  }

  // 2. Get role-based default permissions
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  rolePermissions.forEach(p => allPermissions.add(p));

  // 3. Get direct user permissions
  const directPermissions = user.directPermissions || [];
  directPermissions.forEach(p => allPermissions.add(p));

  // 4. Legacy permissions field support
  const legacyPermissions = user.permissions || [];
  legacyPermissions.forEach(p => allPermissions.add(p));

  // 5. Get permissions from user groups
  const groupPermissions = getGroupPermissions(user);
  groupPermissions.forEach(p => allPermissions.add(p));

  return {
    direct: [...rolePermissions, ...directPermissions, ...legacyPermissions],
    fromGroups: groupPermissions,
    all: allPermissions
  };
}

/**
 * Get permissions from all user groups
 */
function getGroupPermissions(user: User): string[] {
  const groups = getUserGroups(user);
  const permissions = new Set<string>();

  groups.forEach(group => {
    if (group.isActive) {
      group.permissions.forEach(p => permissions.add(p));
    }
  });

  return Array.from(permissions);
}

/**
 * Get all groups a user belongs to
 */
function getUserGroups(user: User): UserGroup[] {
  if (!user.groups || user.groups.length === 0) {
    return [];
  }

  try {
    const storedGroups = localStorage.getItem('user_groups');
    if (!storedGroups) return [];

    const allGroups: UserGroup[] = JSON.parse(storedGroups);
    return allGroups.filter(group => user.groups.includes(group.id));
  } catch (error) {
    console.error('Failed to load user groups:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 * Supports wildcards: gis.*, gis.distance.*, *
 */
export function hasPermission(
  user: User | null,
  permission: string
): boolean {
  if (!user) return false;

  const effectivePerms = getEffectivePermissions(user);

  // Admin has all permissions
  if (effectivePerms.all.has('*')) return true;

  // Exact match
  if (effectivePerms.all.has(permission)) return true;

  // Check wildcards
  const parts = permission.split('.');

  // Check each wildcard level
  // Example: "gis.distance.use" checks:
  // - gis.*
  // - gis.distance.*
  for (let i = 1; i < parts.length; i++) {
    const wildcardPerm = parts.slice(0, i).join('.') + '.*';
    if (effectivePerms.all.has(wildcardPerm)) return true;
  }

  return false;
}

/**
 * Check permission with ownership validation
 * Used for operations like delete.own vs delete.any
 */
export function checkPermissionWithOwnership(
  user: User | null,
  basePermission: string,  // e.g., "gis.distance.delete"
  resourceOwnerId?: string,
  options?: {
    allowTeam?: boolean;
    teamMemberIds?: string[];
  }
): PermissionCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
      missingPermission: basePermission
    };
  }

  // Check if user has .any permission (can act on any resource)
  const anyPermission = `${basePermission}.any`;
  if (hasPermission(user, anyPermission)) {
    return { allowed: true };
  }

  // Check if user has .own permission and owns the resource
  const ownPermission = `${basePermission}.own`;
  if (hasPermission(user, ownPermission)) {
    // If no owner specified, assume user owns it (for creating new resources)
    if (!resourceOwnerId) {
      return { allowed: true };
    }

    // Check ownership
    if (resourceOwnerId === user.id) {
      return { allowed: true };
    }

    // Check team membership (if enabled)
    if (options?.allowTeam && options?.teamMemberIds) {
      if (options.teamMemberIds.includes(user.id)) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: 'You can only perform this action on your own resources',
      missingPermission: anyPermission
    };
  }

  return {
    allowed: false,
    reason: `Missing permission: ${basePermission}`,
    missingPermission: anyPermission
  };
}

/**
 * Check multiple permissions (user must have ALL)
 */
export function hasAllPermissions(
  user: User | null,
  permissions: string[]
): boolean {
  return permissions.every(p => hasPermission(user, p));
}

/**
 * Check multiple permissions (user must have AT LEAST ONE)
 */
export function hasAnyPermission(
  user: User | null,
  permissions: string[]
): boolean {
  return permissions.some(p => hasPermission(user, p));
}

/**
 * Get all permissions for a category
 */
export function getPermissionsByCategory(
  category: string,
  allPermissions: Set<string>
): string[] {
  return Array.from(allPermissions).filter(p => p.startsWith(category));
}

/**
 * Check if a permission ID is valid (exists in system or follows pattern)
 */
export function isValidPermissionId(permissionId: string): boolean {
  // Check format: module.resource.action or module.resource.action.scope
  const parts = permissionId.split('.');

  // Must have at least 2 parts (module.action) or wildcard
  if (parts.length < 2 && permissionId !== '*') {
    return false;
  }

  // Check for invalid characters
  const validPattern = /^[a-z0-9_.]+$/i;
  return validPattern.test(permissionId);
}

/**
 * Expand wildcard permissions to actual permission list
 * Example: "gis.*" expands to all gis.* permissions
 */
export function expandWildcardPermission(
  wildcardPerm: string,
  availablePermissions: string[]
): string[] {
  if (wildcardPerm === '*') {
    return availablePermissions;
  }

  if (!wildcardPerm.endsWith('.*')) {
    return [wildcardPerm];
  }

  const prefix = wildcardPerm.slice(0, -2); // Remove .*
  return availablePermissions.filter(p => p.startsWith(prefix + '.'));
}

/**
 * Check if resource belongs to user's team
 * (Helper for team-based permissions)
 */
export function isTeamMember(
  userId: string,
  teamMemberIds: string[]
): boolean {
  return teamMemberIds.includes(userId);
}

/**
 * Get user's team members (users under same manager)
 */
export function getTeamMembers(user: User): string[] {
  try {
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return [];

    const allUsers: User[] = JSON.parse(storedUsers);

    // Users with same manager (assignedUnder) are considered team members
    const managers = user.assignedUnder;
    if (!managers || managers.length === 0) return [];

    return allUsers
      .filter(u =>
        u.id !== user.id &&
        u.assignedUnder.some(m => managers.includes(m))
      )
      .map(u => u.id);
  } catch (error) {
    console.error('Failed to get team members:', error);
    return [];
  }
}
