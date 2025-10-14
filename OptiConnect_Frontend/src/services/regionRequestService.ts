// Region Access Request Service

import axios from 'axios';
import type {
  RegionAccessRequest,
  RegionRequestStatus,
  RegionAccessRequestFilter,
  RegionRequestStats
} from '../types/regionRequest.types';
import type { User } from '../types/auth.types';
import { logAuditEvent } from './auditService';

const BACKEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const STORAGE_KEY = 'gis_region_requests';

// Create axios instance for region request APIs
const apiClient = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header interceptor
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('opti_connect_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Create a new region access request
 */
export const createRegionRequest = async (
  user: User,
  requestedRegions: string[],
  reason: string
): Promise<RegionAccessRequest> => {
  try {
    // Backend expects single region per request, so we'll create multiple if needed
    // For now, create just for the first region
    const region = requestedRegions[0];

    const response = await apiClient.post<{
      success: boolean;
      message?: string;
      request: any;
    }>('/region-requests', {
      region_name: region,
      request_type: 'access',
      reason
    });

    const data = response.data;
    if (!data.success) {
      throw new Error(data.message || 'Failed to create region request');
    }

    const backendRequest = data.request;

    const request: RegionAccessRequest = {
      id: backendRequest.id.toString(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      requestedRegions,
      reason: backendRequest.reason,
      status: backendRequest.status,
      createdAt: new Date(backendRequest.created_at || Date.now()),
      updatedAt: new Date(backendRequest.updated_at || Date.now())
    };

    // Log audit event
    logAuditEvent(user, 'REGION_ACCESS_DENIED', `Requested access to ${requestedRegions.join(', ')}`, {
      severity: 'info',
      details: { requestedRegions, reason, requestId: request.id },
      success: true
    });

    return request;
  } catch (error: any) {
    console.error('Error creating region request:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to create region request');
  }
};

/**
 * Get all region access requests
 */
export const getRegionRequests = async (status?: string): Promise<RegionAccessRequest[]> => {
  try {
    const params: any = {};
    if (status) params.status = status;

    const response = await apiClient.get<{
      success: boolean;
      message?: string;
      requests: any[];
    }>('/region-requests', { params });

    const data = response.data;
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch region requests');
    }

    console.log('📥 Fetched region requests from backend:', data.requests);

    const requests = data.requests.map((req: any) => ({
      id: req.id.toString(),
      userId: `OCGID${String(req.user_id).padStart(3, '0')}`,
      userName: req.full_name || req.username || '',
      userEmail: req.email || '',
      userRole: req.role || 'User',
      requestedRegions: [req.region_name],
      reason: req.reason || '',
      status: req.status as RegionRequestStatus,
      createdAt: new Date(req.requested_at || req.created_at),
      updatedAt: new Date(req.updated_at || req.created_at),
      reviewedAt: req.reviewed_at ? new Date(req.reviewed_at) : undefined,
      reviewedBy: req.reviewed_by ? `OCGID${String(req.reviewed_by).padStart(3, '0')}` : undefined,
      reviewedByName: req.reviewed_by_name || undefined,
      reviewNotes: req.review_notes || undefined
    }));

    return requests;
  } catch (error: any) {
    console.error('Error fetching region requests from backend:', error);
    return [];
  }
};

/**
 * Get region requests for a specific user
 */
export const getUserRegionRequests = async (userId: string): Promise<RegionAccessRequest[]> => {
  const requests = await getRegionRequests();
  return requests.filter(req => req.userId === userId);
};

/**
 * Get filtered region requests
 */
export const getFilteredRegionRequests = async (
  filter: RegionAccessRequestFilter
): Promise<RegionAccessRequest[]> => {
  const requests = await getRegionRequests(filter.status);

  return requests.filter(req => {
    if (filter.userId && req.userId !== filter.userId) {
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
export const approveRegionRequest = async (
  requestId: string,
  reviewedBy: User,
  reviewNotes?: string
): Promise<RegionAccessRequest | null> => {
  try {
    const response = await apiClient.patch<{
      success: boolean;
      message?: string;
      request?: any;
    }>(`/region-requests/${requestId}/approve`, {
      review_notes: reviewNotes
    });

    const data = response.data;
    if (!data.success) {
      throw new Error(data.message || 'Failed to approve region request');
    }

    // Fetch updated request
    const requests = await getRegionRequests();
    const request = requests.find(req => req.id === requestId);

    if (request) {
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
    }

    return request || null;
  } catch (error: any) {
    console.error('Error approving region request:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to approve region request');
  }
};

/**
 * Reject a region access request
 */
export const rejectRegionRequest = async (
  requestId: string,
  reviewedBy: User,
  reviewNotes?: string
): Promise<RegionAccessRequest | null> => {
  try {
    const response = await apiClient.patch<{
      success: boolean;
      message?: string;
      request?: any;
    }>(`/region-requests/${requestId}/reject`, {
      review_notes: reviewNotes
    });

    const data = response.data;
    if (!data.success) {
      throw new Error(data.message || 'Failed to reject region request');
    }

    // Fetch updated request
    const requests = await getRegionRequests();
    const request = requests.find(req => req.id === requestId);

    if (request) {
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
    }

    return request || null;
  } catch (error: any) {
    console.error('Error rejecting region request:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to reject region request');
  }
};

/**
 * Cancel a region access request (by the requester)
 */
export const cancelRegionRequest = async (
  requestId: string,
  user: User
): Promise<RegionAccessRequest | null> => {
  const requests = await getRegionRequests();
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
export const getRegionRequestStats = async (
  filter?: RegionAccessRequestFilter
): Promise<RegionRequestStats> => {
  const requests = filter ? await getFilteredRegionRequests(filter) : await getRegionRequests();

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
export const getPendingRequestsCount = async (userId: string): Promise<number> => {
  const requests = await getFilteredRegionRequests({ userId, status: 'pending' });
  return requests.length;
};

/**
 * Check if user has pending request for a region
 */
export const hasPendingRequestForRegion = async (
  userId: string,
  region: string
): Promise<boolean> => {
  const pendingRequests = await getFilteredRegionRequests({ userId, status: 'pending' });
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
export const deleteRegionRequest = async (requestId: string, user: User): Promise<boolean> => {
  try {
    // Get request details for logging before deletion
    const requests = await getRegionRequests();
    const request = requests.find(req => req.id === requestId);

    if (!request) {
      throw new Error('Region request not found');
    }

    // Only admin can delete requests, or the requester can delete their own
    if (user.role !== 'Admin' && request.userId !== user.id) {
      throw new Error('Permission denied: Only administrators or the requester can delete this request');
    }

    // Delete from backend database
    const response = await apiClient.delete<{
      success: boolean;
      message?: string;
    }>(`/region-requests/${requestId}`);

    const data = response.data;
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete region request');
    }

    console.log('✅ Deleted region request from database:', requestId);

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
  } catch (error: any) {
    console.error('Error deleting region request:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to delete region request');
  }
};
