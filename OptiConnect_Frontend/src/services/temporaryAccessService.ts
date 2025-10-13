// Temporary Region Access Service

import axios from "axios";
import type {
  TemporaryRegionAccess,
  TemporaryAccessFilter,
  TemporaryAccessStats
} from "../types/temporaryAccess.types";
import type { User } from "../types/auth.types";
import { logAuditEvent } from "./auditService";

const BACKEND_API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "gis_temporary_access"; // Keep for localStorage functions

// Create axios instance for temporary access APIs
const apiClient = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add authorization header interceptor
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("opti_connect_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Grant temporary access to a region
 */
export const grantTemporaryAccess = async (
  targetUser: User,
  region: string,
  expiresAt: Date,
  reason: string,
  grantedBy: User
): Promise<TemporaryRegionAccess> => {
  try {
    // Extract numeric ID
    const numericUserId =
      targetUser.id.replace("OCGID", "").replace(/^0+/, "") || "0";

    const response = await apiClient.post<{
      success: boolean;
      message?: string;
      grant: any;
    }>("/temporary-access", {
      user_id: parseInt(numericUserId),
      region_name: region,
      expires_at: expiresAt.toISOString(),
      reason
    });

    const data = response.data as { success: boolean; message?: string; grant: any };
    if (!data.success) {
      throw new Error(
        data.message || "Failed to grant temporary access"
      );
    }

    const backendGrant = data.grant;

    // Transform backend response to frontend format
    const grant: TemporaryRegionAccess = {
      id: backendGrant.id.toString(),
      userId: targetUser.id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      region,
      grantedBy: grantedBy.id,
      grantedByName: grantedBy.name,
      grantedAt: new Date(backendGrant.granted_at),
      expiresAt: new Date(backendGrant.expires_at),
      reason: backendGrant.reason,
      isActive: backendGrant.status === "active"
    };

    // Log audit event
    logAuditEvent(
      grantedBy,
      "REGION_ASSIGNED",
      `Granted temporary access to ${region} for ${targetUser.name}`,
      {
        severity: "info",
        region,
        details: {
          targetUserId: targetUser.id,
          targetUserName: targetUser.name,
          expiresAt: expiresAt.toISOString(),
          reason
        },
        success: true
      }
    );

    return grant;
  } catch (error: any) {
    console.error("Error granting temporary access from backend:", error);
    // Extract meaningful error message from backend response
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to grant temporary access";
    throw new Error(errorMessage);
  }
};

/**
 * Get all temporary access grants from localStorage (helper function)
 */
const getTemporaryAccessFromLocal = (): TemporaryRegionAccess[] => {
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
    console.error("Failed to load temporary access grants:", error);
    return [];
  }
};

/**
 * Get all temporary access grants
 */
export const getTemporaryAccess = async (): Promise<
  TemporaryRegionAccess[]
> => {
  try {
    const response = await apiClient.get<{
      success: boolean;
      message?: string;
      access: any[];
    }>("/temporary-access");

    const data = response.data as { success: boolean; message?: string; access: any[] };
    if (!data.success) {
      throw new Error(
        data.message || "Failed to fetch temporary access"
      );
    }

    console.log('📥 Fetched temporary access from backend:', data.access);

    const grants = data.access.map((grant: any) => {
      // Determine if grant is active
      const isActive = !grant.revoked_at && new Date(grant.expires_at) > new Date();

      return {
        id: grant.id.toString(),
        userId: `OCGID${String(grant.user_id).padStart(3, "0")}`,
        userName: grant.full_name || grant.user_name || "",
        userEmail: grant.email || grant.user_email || "",
        region: grant.region_name,
        grantedBy: `OCGID${String(grant.granted_by).padStart(3, "0")}`,
        grantedByName: grant.granted_by_username || grant.granted_by_name || "",
        grantedAt: new Date(grant.granted_at),
        expiresAt: new Date(grant.expires_at),
        reason: grant.reason || "",
        isActive,
        revokedAt: grant.revoked_at ? new Date(grant.revoked_at) : undefined,
        revokedBy: grant.revoked_by
          ? `OCGID${String(grant.revoked_by).padStart(3, "0")}`
          : undefined,
        revokedByName: grant.revoked_by_name || undefined,
        revokedReason: grant.revoked_reason || undefined,
        timeRemaining: grant.time_remaining || null
      };
    });

    console.log('📊 Transformed grants:', grants);
    return grants;
  } catch (error: any) {
    console.error("Error fetching temporary access from backend:", error);
    throw error;
  }
};

/**
 * Get current user's active temporary access (from their perspective)
 */
export const getMyActiveTemporaryAccess = async (): Promise<TemporaryRegionAccess[]> => {
  try {
    const response = await apiClient.get<{
      success: boolean;
      message?: string;
      access: any[];
      count: number;
    }>("/temporary-access/my-access");

    const data = response.data;
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch your temporary access");
    }

    console.log('📥 Fetched my temporary access from backend:', data.access);

    const grants = data.access.map((grant: any) => ({
      id: grant.id.toString(),
      userId: `OCGID${String(grant.user_id).padStart(3, "0")}`,
      userName: grant.full_name || "",
      userEmail: grant.email || "",
      region: grant.region_name,
      grantedBy: `OCGID${String(grant.granted_by).padStart(3, "0")}`,
      grantedByName: grant.granted_by_name || grant.granted_by_username || "",
      grantedAt: new Date(grant.granted_at),
      expiresAt: new Date(grant.expires_at),
      reason: grant.reason || "",
      isActive: true, // This endpoint only returns active grants
      timeRemaining: grant.time_remaining || null
    }));

    return grants;
  } catch (error: any) {
    console.error("Error fetching my temporary access from backend:", error);
    return [];
  }
};

/**
 * Get active temporary access for a user
 */
export const getActiveTemporaryAccess = async (
  userId: string
): Promise<TemporaryRegionAccess[]> => {
  const grants = await getTemporaryAccess();
  const now = new Date();

  return grants.filter(
    (grant) =>
      grant.userId === userId &&
      grant.isActive &&
      grant.expiresAt > now &&
      !grant.revokedAt
  );
};

/**
 * Get all regions a user has temporary access to (including expired/revoked for history)
 */
export const getUserTemporaryRegions = async (
  userId: string
): Promise<string[]> => {
  const activeGrants = await getActiveTemporaryAccess(userId);
  return activeGrants.map((grant) => grant.region);
};

/**
 * Check if user has temporary access to a region
 */
export const hasTemporaryAccess = async (
  userId: string,
  region: string
): Promise<boolean> => {
  try {
    // Use user-specific endpoint (works for all roles)
    const grants = await getMyActiveTemporaryAccess();
    return grants.some((grant) => grant.region === region);
  } catch (error) {
    console.error('Error checking temporary access:', error);
    return false; // Return false on error instead of throwing
  }
};

/**
 * Get filtered temporary access grants
 */
export const getFilteredTemporaryAccess = async (
  filter: TemporaryAccessFilter
): Promise<TemporaryRegionAccess[]> => {
  const grants = await getTemporaryAccess();
  const now = new Date();

  return grants.filter((grant) => {
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
export const revokeTemporaryAccess = async (
  grantId: string,
  revokedBy: User,
  reason?: string
): Promise<TemporaryRegionAccess | null> => {
  try {
    const response = await apiClient.request({
      method: "DELETE",
      url: `/temporary-access/${grantId}`,
      data: { reason }
    });

    const data = response.data as unknown as { success: boolean; message?: string };
    if (!data.success) {
      throw new Error(
        data.message || "Failed to revoke temporary access"
      );
    }

    // Backend only returns success message, need to fetch updated grant
    const allGrants = await getTemporaryAccess();
    const updatedGrant = allGrants.find(g => g.id === grantId);

    if (updatedGrant) {
      // Log audit event
      logAuditEvent(
        revokedBy,
        "REGION_REVOKED",
        `Revoked temporary access to ${updatedGrant.region} for ${updatedGrant.userName}`,
        {
          severity: "warning",
          region: updatedGrant.region,
          details: {
            targetUserId: updatedGrant.userId,
            targetUserName: updatedGrant.userName,
            grantId,
            reason
          },
          success: true
        }
      );

      return updatedGrant;
    }

    // If not found in backend, return null
    return null;
  } catch (error: any) {
    console.error("Error revoking temporary access from backend:", error);
    throw error;
  }
};

/**
 * Clean up expired grants (mark as inactive)
 */
export const cleanupExpiredGrants = async (): Promise<number> => {
  const grants = await getTemporaryAccess();
  const now = new Date();
  let cleanedCount = 0;

  grants.forEach((grant) => {
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
export const getTemporaryAccessStats = async (
  filter?: TemporaryAccessFilter
): Promise<TemporaryAccessStats> => {
  const grants = filter
    ? await getFilteredTemporaryAccess(filter)
    : await getTemporaryAccess();
  const now = new Date();

  const grantsByRegion: Record<string, number> = {};
  const grantsByUser: Record<string, number> = {};

  let activeGrants = 0;
  let expiredGrants = 0;
  let revokedGrants = 0;

  grants.forEach((grant) => {
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
export const extendTemporaryAccess = async (
  grantId: string,
  newExpirationDate: Date,
  extendedBy: User
): Promise<TemporaryRegionAccess | null> => {
  const grants = await getTemporaryAccess();
  const grant = grants.find((g) => g.id === grantId);

  if (!grant || !grant.isActive || grant.revokedAt) {
    return null;
  }

  const oldExpiration = grant.expiresAt;
  grant.expiresAt = newExpirationDate;

  // Save updated grants
  saveGrants(grants);

  // Log audit event
  logAuditEvent(
    extendedBy,
    "REGION_ASSIGNED",
    `Extended temporary access to ${grant.region} for ${grant.userName}`,
    {
      severity: "info",
      region: grant.region,
      details: {
        targetUserId: grant.userId,
        targetUserName: grant.userName,
        grantId,
        oldExpiration: oldExpiration.toISOString(),
        newExpiration: newExpirationDate.toISOString()
      },
      success: true
    }
  );

  return grant;
};

/**
 * Save grants to localStorage
 */
const saveGrants = (grants: TemporaryRegionAccess[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
  } catch (error) {
    console.error("Failed to save temporary access grants:", error);
  }
};

/**
 * Delete a temporary access grant
 */
export const deleteTemporaryGrant = async (
  grantId: string,
  user: User
): Promise<boolean> => {
  const grants = await getTemporaryAccess();
  const index = grants.findIndex((g) => g.id === grantId);

  if (index === -1) {
    return false;
  }

  const grant = grants[index];

  // Only admin can delete grants
  if (user.role !== "Admin") {
    return false;
  }

  grants.splice(index, 1);
  saveGrants(grants);

  // Log audit event
  logAuditEvent(
    user,
    "REGION_REVOKED",
    `Deleted temporary access grant for ${grant.userName}`,
    {
      severity: "warning",
      region: grant.region,
      details: {
        targetUserId: grant.userId,
        targetUserName: grant.userName,
        grantId
      },
      success: true
    }
  );

  return true;
};

/**
 * Get expiring grants (within next N days)
 */
export const getExpiringGrants = async (
  daysAhead: number = 7
): Promise<TemporaryRegionAccess[]> => {
  const grants = await getTemporaryAccess();
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return grants.filter(
    (grant) =>
      grant.isActive &&
      !grant.revokedAt &&
      grant.expiresAt > now &&
      grant.expiresAt <= futureDate
  );
};
