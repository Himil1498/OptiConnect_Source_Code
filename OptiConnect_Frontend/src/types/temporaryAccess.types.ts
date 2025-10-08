// Temporary Region Access Types

export interface TemporaryRegionAccess {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  region: string;
  grantedBy: string;
  grantedByName: string;
  grantedAt: Date;
  expiresAt: Date;
  reason: string;
  isActive: boolean;
  revokedAt?: Date;
  revokedBy?: string;
  revokedByName?: string;
  revokedReason?: string;
}

export interface TemporaryAccessFilter {
  userId?: string;
  region?: string;
  isActive?: boolean;
  grantedBy?: string;
}

export interface TemporaryAccessStats {
  totalGrants: number;
  activeGrants: number;
  expiredGrants: number;
  revokedGrants: number;
  grantsByRegion: Record<string, number>;
  grantsByUser: Record<string, number>;
}
