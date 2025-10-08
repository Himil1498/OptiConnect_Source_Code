/**
 * RequirePermission Component
 * Conditionally renders children based on permission checks
 */

import React, { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';

interface RequirePermissionProps {
  /**
   * Required permission(s)
   * Can be a single permission or array of permissions
   */
  permission: string | string[];

  /**
   * Permission matching mode (when array provided)
   * - 'all': User must have ALL permissions (default)
   * - 'any': User must have AT LEAST ONE permission
   */
  mode?: 'all' | 'any';

  /**
   * Content to render when user has permission
   */
  children: ReactNode;

  /**
   * Optional fallback content when user lacks permission
   * If not provided, nothing is rendered
   */
  fallback?: ReactNode;

  /**
   * Invert the check (render when user DOESN'T have permission)
   */
  not?: boolean;
}

/**
 * RequirePermission - Conditionally render based on permissions
 *
 * @example
 * // Single permission
 * <RequirePermission permission="gis.distance.use">
 *   <DistanceToolButton />
 * </RequirePermission>
 *
 * @example
 * // Multiple permissions (all required)
 * <RequirePermission permission={["users.create", "users.edit"]}>
 *   <UserManagementButton />
 * </RequirePermission>
 *
 * @example
 * // Multiple permissions (any required)
 * <RequirePermission permission={["users.create", "users.edit"]} mode="any">
 *   <UserActionButton />
 * </RequirePermission>
 *
 * @example
 * // With fallback
 * <RequirePermission
 *   permission="data.export"
 *   fallback={<div>You don't have export permission</div>}
 * >
 *   <ExportButton />
 * </RequirePermission>
 *
 * @example
 * // Inverted check (show when user DOESN'T have permission)
 * <RequirePermission permission="users.view" not>
 *   <UpgradePrompt />
 * </RequirePermission>
 */
const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  mode = 'all',
  children,
  fallback = null,
  not = false
}) => {
  const { can, canAll, canAny } = usePermission();

  let hasRequiredPermission = false;

  if (typeof permission === 'string') {
    // Single permission
    hasRequiredPermission = can(permission);
  } else if (Array.isArray(permission)) {
    // Multiple permissions
    if (mode === 'all') {
      hasRequiredPermission = canAll(permission);
    } else {
      hasRequiredPermission = canAny(permission);
    }
  }

  // Invert if needed
  const shouldRender = not ? !hasRequiredPermission : hasRequiredPermission;

  if (shouldRender) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default RequirePermission;
