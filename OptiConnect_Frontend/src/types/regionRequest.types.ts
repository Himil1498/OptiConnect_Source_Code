// Region access request types

export type RegionRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RegionAccessRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  requestedRegions: string[];
  reason: string;
  status: RegionRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface RegionAccessRequestFilter {
  userId?: string;
  status?: RegionRequestStatus;
  region?: string;
}

export interface RegionRequestStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  requestsByUser: Record<string, number>;
  requestsByRegion: Record<string, number>;
}
