// Region Access Request Service

import type {
  RegionAccessRequest,
  RegionRequestStatus,
  RegionAccessRequestFilter,
  RegionRequestStats
} from '../types/regionRequest.types';
import type { User } from '../types/auth.types';
import { logAuditEvent } from './auditService';

const STORAGE_KEY = 'gis_region_requests';

/**
 * Create a new region access request
 */
export const createRegionRequest = (
  user: User,
  requestedRegions: string[],
  reason: string
): RegionAccessRequest => {
  const request: RegionAccessRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    requestedRegions,
    reason,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Get existing requests
  const requests = getRegionRequests();

  // Add new request
  requests.unshift(request);

  // Save to localStorage
  saveRequests(requests);

  // Log audit event
  logAuditEvent(user, 'REGION_ACCESS_DENIED', `Requested access to ${requestedRegions.join(', ')}`, {
    severity: 'info',
    details: { requestedRegions, reason, requestId: request.id },
    success: true
  });

  return request;
};

/**
 * Get all region access requests
 */
export const getRegionRequests = (): RegionAccessRequest[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const requests = JSON.parse(data);
    // Convert date strings back to Date objects
    return requests.map((req: any) => ({
      ...req,
      createdAt: new Date(req.createdAt),
      updatedAt: new Date(req.updatedAt),
      reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined
    }));
  } catch (error) {
    console.error('Failed to load region requests:', error);
    return [];
  }
};

/**
 * Get region requests for a specific user
 */
export const getUserRegionRequests = (userId: string): RegionAccessRequest[] => {
  return getRegionRequests().filter(req => req.userId === userId);
};

/**
 * Get filtered region requests
 */
export const getFilteredRegionRequests = (
  filter: RegionAccessRequestFilter
): RegionAccessRequest[] => {
  const requests = getRegionRequests();

  return requests.filter(req => {
    if (filter.userId && req.userId !== filter.userId) {
      return false;
    }

    if (filter.status && req.status !== filter.status) {
      return false;
    }

    if (filter.region && !req.requestedRegions.includes(filter.region)) {
      return false;
    }

    return true;
  });
};

/**
 * Approve a region access request
 */
export const approveRegionRequest = (
  requestId: string,
  reviewedBy: User,
  reviewNotes?: string
): RegionAccessRequest | null => {
  const requests = getRegionRequests();
  const request = requests.find(req => req.id === requestId);

  if (!request) {
    return null;
  }

  // Update request status
  request.status = 'approved';
  request.reviewedBy = reviewedBy.id;
  request.reviewedByName = reviewedBy.name;
  request.reviewedAt = new Date();
  request.updatedAt = new Date();
  request.reviewNotes = reviewNotes;

  // Save updated requests
  saveRequests(requests);

  // Log audit event
  logAuditEvent(reviewedBy, 'REGION_ASSIGNED', `Approved region request for ${request.userName}`, {
    severity: 'info',
    details: {
      requestId,
      requestedRegions: request.requestedRegions,
      requestedBy: request.userName,
      reviewNotes
    },
    success: true
  });

  return request;
};

/**
 * Reject a region access request
 */
export const rejectRegionRequest = (
  requestId: string,
  reviewedBy: User,
  reviewNotes?: string
): RegionAccessRequest | null => {
  const requests = getRegionRequests();
  const request = requests.find(req => req.id === requestId);

  if (!request) {
    return null;
  }

  // Update request status
  request.status = 'rejected';
  request.reviewedBy = reviewedBy.id;
  request.reviewedByName = reviewedBy.name;
  request.reviewedAt = new Date();
  request.updatedAt = new Date();
  request.reviewNotes = reviewNotes;

  // Save updated requests
  saveRequests(requests);

  // Log audit event
  logAuditEvent(reviewedBy, 'REGION_REVOKED', `Rejected region request for ${request.userName}`, {
    severity: 'warning',
    details: {
      requestId,
      requestedRegions: request.requestedRegions,
      requestedBy: request.userName,
      reviewNotes
    },
    success: true
  });

  return request;
};

/**
 * Cancel a region access request (by the requester)
 */
export const cancelRegionRequest = (
  requestId: string,
  user: User
): RegionAccessRequest | null => {
  const requests = getRegionRequests();
  const request = requests.find(req => req.id === requestId);

  if (!request || request.userId !== user.id) {
    return null;
  }

  // Only allow cancelling pending requests
  if (request.status !== 'pending') {
    return null;
  }

  // Update request status
  request.status = 'cancelled';
  request.updatedAt = new Date();

  // Save updated requests
  saveRequests(requests);

  // Log audit event
  logAuditEvent(user, 'REGION_ACCESS_DENIED', `Cancelled region access request`, {
    severity: 'info',
    details: {
      requestId,
      requestedRegions: request.requestedRegions
    },
    success: true
  });

  return request;
};

/**
 * Get region request statistics
 */
export const getRegionRequestStats = (
  filter?: RegionAccessRequestFilter
): RegionRequestStats => {
  const requests = filter ? getFilteredRegionRequests(filter) : getRegionRequests();

  const requestsByUser: Record<string, number> = {};
  const requestsByRegion: Record<string, number> = {};

  let pendingRequests = 0;
  let approvedRequests = 0;
  let rejectedRequests = 0;

  requests.forEach(req => {
    // Count by user
    const userKey = `${req.userName} (${req.userEmail})`;
    requestsByUser[userKey] = (requestsByUser[userKey] || 0) + 1;

    // Count by region
    req.requestedRegions.forEach(region => {
      requestsByRegion[region] = (requestsByRegion[region] || 0) + 1;
    });

    // Count by status
    if (req.status === 'pending') pendingRequests++;
    else if (req.status === 'approved') approvedRequests++;
    else if (req.status === 'rejected') rejectedRequests++;
  });

  return {
    totalRequests: requests.length,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    requestsByUser,
    requestsByRegion
  };
};

/**
 * Get pending requests count for a user
 */
export const getPendingRequestsCount = (userId: string): number => {
  return getFilteredRegionRequests({ userId, status: 'pending' }).length;
};

/**
 * Check if user has pending request for a region
 */
export const hasPendingRequestForRegion = (
  userId: string,
  region: string
): boolean => {
  const pendingRequests = getFilteredRegionRequests({ userId, status: 'pending' });
  return pendingRequests.some(req => req.requestedRegions.includes(region));
};

/**
 * Save requests to localStorage
 */
const saveRequests = (requests: RegionAccessRequest[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (error) {
    console.error('Failed to save region requests:', error);
  }
};

/**
 * Delete a region request
 */
export const deleteRegionRequest = (requestId: string, user: User): boolean => {
  const requests = getRegionRequests();
  const index = requests.findIndex(req => req.id === requestId);

  if (index === -1) {
    return false;
  }

  const request = requests[index];

  // Only admin can delete requests, or the requester can delete their own
  if (user.role !== 'Admin' && request.userId !== user.id) {
    return false;
  }

  requests.splice(index, 1);
  saveRequests(requests);

  // Log audit event
  logAuditEvent(user, 'REGION_ACCESS_DENIED', `Deleted region access request`, {
    severity: 'info',
    details: {
      requestId,
      requestedRegions: request.requestedRegions,
      requestedBy: request.userName
    },
    success: true
  });

  return true;
};
