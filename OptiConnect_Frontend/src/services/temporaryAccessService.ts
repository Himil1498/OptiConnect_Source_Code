// Temporary Region Access Service

import type {
  TemporaryRegionAccess,
  TemporaryAccessFilter,
  TemporaryAccessStats
} from '../types/temporaryAccess.types';
import type { User } from '../types/auth.types';
import { logAuditEvent } from './auditService';

const STORAGE_KEY = 'gis_temporary_access';

/**
 * Grant temporary access to a region
 */
export const grantTemporaryAccess = (
  targetUser: User,
  region: string,
  expiresAt: Date,
  reason: string,
  grantedBy: User
): TemporaryRegionAccess => {
  const grant: TemporaryRegionAccess = {
    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: targetUser.id,
    userName: targetUser.name,
    userEmail: targetUser.email,
    region,
    grantedBy: grantedBy.id,
    grantedByName: grantedBy.name,
    grantedAt: new Date(),
    expiresAt,
    reason,
    isActive: true
  };

  // Get existing grants
  const grants = getTemporaryAccess();

  // Add new grant
  grants.unshift(grant);

  // Save to localStorage
  saveGrants(grants);

  // Log audit event
  logAuditEvent(grantedBy, 'REGION_ASSIGNED', `Granted temporary access to ${region} for ${targetUser.name}`, {
    severity: 'info',
    region,
    details: {
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      expiresAt: expiresAt.toISOString(),
      reason
    },
    success: true
  });

  return grant;
};

/**
 * Get all temporary access grants
 */
export const getTemporaryAccess = (): TemporaryRegionAccess[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const grants = JSON.parse(data);
    // Convert date strings back to Date objects
    return grants.map((grant: any) => ({
      ...grant,
      grantedAt: new Date(grant.grantedAt),
      expiresAt: new Date(grant.expiresAt),
      revokedAt: grant.revokedAt ? new Date(grant.revokedAt) : undefined
    }));
  } catch (error) {
    console.error('Failed to load temporary access grants:', error);
    return [];
  }
};

/**
 * Get active temporary access for a user
 */
export const getActiveTemporaryAccess = (userId: string): TemporaryRegionAccess[] => {
  const grants = getTemporaryAccess();
  const now = new Date();

  return grants.filter(
    grant =>
      grant.userId === userId &&
      grant.isActive &&
      grant.expiresAt > now &&
      !grant.revokedAt
  );
};

/**
 * Get all regions a user has temporary access to (including expired/revoked for history)
 */
export const getUserTemporaryRegions = (userId: string): string[] => {
  const activeGrants = getActiveTemporaryAccess(userId);
  return activeGrants.map(grant => grant.region);
};

/**
 * Check if user has temporary access to a region
 */
export const hasTemporaryAccess = (userId: string, region: string): boolean => {
  const grants = getActiveTemporaryAccess(userId);
  return grants.some(grant => grant.region === region);
};

/**
 * Get filtered temporary access grants
 */
export const getFilteredTemporaryAccess = (
  filter: TemporaryAccessFilter
): TemporaryRegionAccess[] => {
  const grants = getTemporaryAccess();
  const now = new Date();

  return grants.filter(grant => {
    // Filter by user
    if (filter.userId && grant.userId !== filter.userId) {
      return false;
    }

    // Filter by region
    if (filter.region && grant.region !== filter.region) {
      return false;
    }

    // Filter by granted by
    if (filter.grantedBy && grant.grantedBy !== filter.grantedBy) {
      return false;
    }

    // Filter by active status
    if (filter.isActive !== undefined) {
      const isCurrentlyActive =
        grant.isActive && grant.expiresAt > now && !grant.revokedAt;
      if (filter.isActive !== isCurrentlyActive) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Revoke temporary access
 */
export const revokeTemporaryAccess = (
  grantId: string,
  revokedBy: User,
  reason?: string
): TemporaryRegionAccess | null => {
  const grants = getTemporaryAccess();
  const grant = grants.find(g => g.id === grantId);

  if (!grant) {
    return null;
  }

  // Update grant
  grant.isActive = false;
  grant.revokedAt = new Date();
  grant.revokedBy = revokedBy.id;
  grant.revokedByName = revokedBy.name;
  grant.revokedReason = reason;

  // Save updated grants
  saveGrants(grants);

  // Log audit event
  logAuditEvent(revokedBy, 'REGION_REVOKED', `Revoked temporary access to ${grant.region} for ${grant.userName}`, {
    severity: 'warning',
    region: grant.region,
    details: {
      targetUserId: grant.userId,
      targetUserName: grant.userName,
      grantId,
      reason
    },
    success: true
  });

  return grant;
};

/**
 * Clean up expired grants (mark as inactive)
 */
export const cleanupExpiredGrants = (): number => {
  const grants = getTemporaryAccess();
  const now = new Date();
  let cleanedCount = 0;

  grants.forEach(grant => {
    if (grant.isActive && grant.expiresAt < now && !grant.revokedAt) {
      grant.isActive = false;
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    saveGrants(grants);
  }

  return cleanedCount;
};

/**
 * Get temporary access statistics
 */
export const getTemporaryAccessStats = (
  filter?: TemporaryAccessFilter
): TemporaryAccessStats => {
  const grants = filter ? getFilteredTemporaryAccess(filter) : getTemporaryAccess();
  const now = new Date();

  const grantsByRegion: Record<string, number> = {};
  const grantsByUser: Record<string, number> = {};

  let activeGrants = 0;
  let expiredGrants = 0;
  let revokedGrants = 0;

  grants.forEach(grant => {
    // Count by region
    grantsByRegion[grant.region] = (grantsByRegion[grant.region] || 0) + 1;

    // Count by user
    const userKey = `${grant.userName} (${grant.userEmail})`;
    grantsByUser[userKey] = (grantsByUser[userKey] || 0) + 1;

    // Count by status
    if (grant.revokedAt) {
      revokedGrants++;
    } else if (grant.expiresAt < now) {
      expiredGrants++;
    } else if (grant.isActive) {
      activeGrants++;
    }
  });

  return {
    totalGrants: grants.length,
    activeGrants,
    expiredGrants,
    revokedGrants,
    grantsByRegion,
    grantsByUser
  };
};

/**
 * Extend temporary access expiration
 */
export const extendTemporaryAccess = (
  grantId: string,
  newExpirationDate: Date,
  extendedBy: User
): TemporaryRegionAccess | null => {
  const grants = getTemporaryAccess();
  const grant = grants.find(g => g.id === grantId);

  if (!grant || !grant.isActive || grant.revokedAt) {
    return null;
  }

  const oldExpiration = grant.expiresAt;
  grant.expiresAt = newExpirationDate;

  // Save updated grants
  saveGrants(grants);

  // Log audit event
  logAuditEvent(extendedBy, 'REGION_ASSIGNED', `Extended temporary access to ${grant.region} for ${grant.userName}`, {
    severity: 'info',
    region: grant.region,
    details: {
      targetUserId: grant.userId,
      targetUserName: grant.userName,
      grantId,
      oldExpiration: oldExpiration.toISOString(),
      newExpiration: newExpirationDate.toISOString()
    },
    success: true
  });

  return grant;
};

/**
 * Save grants to localStorage
 */
const saveGrants = (grants: TemporaryRegionAccess[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
  } catch (error) {
    console.error('Failed to save temporary access grants:', error);
  }
};

/**
 * Delete a temporary access grant
 */
export const deleteTemporaryGrant = (grantId: string, user: User): boolean => {
  const grants = getTemporaryAccess();
  const index = grants.findIndex(g => g.id === grantId);

  if (index === -1) {
    return false;
  }

  const grant = grants[index];

  // Only admin can delete grants
  if (user.role !== 'Admin') {
    return false;
  }

  grants.splice(index, 1);
  saveGrants(grants);

  // Log audit event
  logAuditEvent(user, 'REGION_REVOKED', `Deleted temporary access grant for ${grant.userName}`, {
    severity: 'warning',
    region: grant.region,
    details: {
      targetUserId: grant.userId,
      targetUserName: grant.userName,
      grantId
    },
    success: true
  });

  return true;
};

/**
 * Get expiring grants (within next N days)
 */
export const getExpiringGrants = (daysAhead: number = 7): TemporaryRegionAccess[] => {
  const grants = getTemporaryAccess();
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return grants.filter(
    grant =>
      grant.isActive &&
      !grant.revokedAt &&
      grant.expiresAt > now &&
      grant.expiresAt <= futureDate
  );
};
