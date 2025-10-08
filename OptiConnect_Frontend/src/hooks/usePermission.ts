/**
 * usePermission Hook
 * Provides permission checking functionality for React components
 */

import { useMemo } from 'react';
import { useAppSelector } from '../store';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  checkPermissionWithOwnership,
  getEffectivePermissions
} from '../utils/permissionUtils';
import type { PermissionCheckResult } from '../types/permissions.types';

interface UsePermissionReturn {
  /**
   * Check if user has a specific permission
   */
  can: (permission: string) => boolean;

  /**
   * Check if user has all specified permissions
   */
  canAll: (permissions: string[]) => boolean;

  /**
   * Check if user has at least one of specified permissions
   */
  canAny: (permissions: string[]) => boolean;

  /**
   * Check permission with ownership validation
   */
  canWithOwnership: (
    basePermission: string,
    resourceOwnerId?: string,
    options?: {
      allowTeam?: boolean;
      teamMemberIds?: string[];
    }
  ) => PermissionCheckResult;

  /**
   * Check if user is admin
   */
  isAdmin: boolean;

  /**
   * Check if user is manager or above
   */
  isManager: boolean;

  /**
   * Get all effective permissions
   */
  permissions: Set<string>;
}

/**
 * Hook for checking user permissions
 *
 * @example
 * const { can, canAll, isAdmin } = usePermission();
 *
 * if (can('gis.distance.use')) {
 *   // Show distance tool
 * }
 *
 * if (canAll(['users.create', 'users.edit'])) {
 *   // Show user management
 * }
 */
export function usePermission(): UsePermissionReturn {
  const { user } = useAppSelector((state) => state.auth);

  const effectivePermissions = useMemo(() => {
    return getEffectivePermissions(user);
  }, [user]);

  const can = (permission: string) => {
    return hasPermission(user, permission);
  };

  const canAll = (permissions: string[]) => {
    return hasAllPermissions(user, permissions);
  };

  const canAny = (permissions: string[]) => {
    return hasAnyPermission(user, permissions);
  };

  const canWithOwnership = (
    basePermission: string,
    resourceOwnerId?: string,
    options?: {
      allowTeam?: boolean;
      teamMemberIds?: string[];
    }
  ) => {
    return checkPermissionWithOwnership(
      user,
      basePermission,
      resourceOwnerId,
      options
    );
  };

  return {
    can,
    canAll,
    canAny,
    canWithOwnership,
    isAdmin: user?.role === 'Admin',
    isManager: user?.role === 'Admin' || user?.role === 'Manager',
    permissions: effectivePermissions.all
  };
}
