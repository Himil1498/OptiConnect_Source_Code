// Audit logging types for tracking user actions and region access

export type AuditEventType =
  | 'REGION_ACCESS_GRANTED'
  | 'REGION_ACCESS_DENIED'
  | 'GIS_TOOL_USED'
  | 'INFRASTRUCTURE_ADDED'
  | 'INFRASTRUCTURE_UPDATED'
  | 'INFRASTRUCTURE_DELETED'
  | 'REGION_ASSIGNED'
  | 'REGION_REVOKED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'MAP_SEARCHED'
  | 'BOOKMARK_CREATED'
  | 'BOOKMARK_DELETED'
  | 'DATA_EXPORTED';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  region?: string; // Region where action occurred
  toolName?: string; // GIS tool name if applicable
  action: string; // Human-readable description
  details: Record<string, any>; // Additional metadata
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: string;
  region?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}

export interface AuditLogStats {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByRegion: Record<string, number>;
  eventsByUser: Record<string, number>;
  recentActivity: AuditLogEntry[];
}
