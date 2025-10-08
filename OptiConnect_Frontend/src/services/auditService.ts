// Audit logging service for tracking user actions and system events

import type {
  AuditLogEntry,
  AuditEventType,
  AuditSeverity,
  AuditLogFilter,
  AuditLogStats
} from '../types/audit.types';
import type { User } from '../types/auth.types';

const STORAGE_KEY = 'gis_audit_logs';
const MAX_LOGS = 10000; // Keep last 10,000 logs

/**
 * Log an audit event
 */
export const logAuditEvent = (
  user: User | null,
  eventType: AuditEventType,
  action: string,
  options: {
    severity?: AuditSeverity;
    region?: string;
    toolName?: string;
    details?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
  } = {}
): AuditLogEntry => {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    userId: user?.id || 'anonymous',
    userName: user?.name || 'Anonymous',
    userEmail: user?.email || 'unknown',
    userRole: user?.role || 'Unknown',
    eventType,
    severity: options.severity || 'info',
    region: options.region,
    toolName: options.toolName,
    action,
    details: options.details || {},
    success: options.success !== undefined ? options.success : true,
    errorMessage: options.errorMessage
  };

  // Get existing logs
  const logs = getAuditLogs();

  // Add new entry at the beginning
  logs.unshift(entry);

  // Keep only the last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS);
  }

  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }

  return entry;
};

/**
 * Get all audit logs
 */
export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const logs = JSON.parse(data);
    // Convert timestamp strings back to Date objects
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load audit logs:', error);
    return [];
  }
};

/**
 * Get filtered audit logs
 */
export const getFilteredAuditLogs = (filter: AuditLogFilter): AuditLogEntry[] => {
  const logs = getAuditLogs();

  return logs.filter(log => {
    // Filter by user ID
    if (filter.userId && log.userId !== filter.userId) {
      return false;
    }

    // Filter by region
    if (filter.region && log.region !== filter.region) {
      return false;
    }

    // Filter by event type
    if (filter.eventType && log.eventType !== filter.eventType) {
      return false;
    }

    // Filter by severity
    if (filter.severity && log.severity !== filter.severity) {
      return false;
    }

    // Filter by success
    if (filter.success !== undefined && log.success !== filter.success) {
      return false;
    }

    // Filter by date range
    if (filter.startDate && log.timestamp < filter.startDate) {
      return false;
    }

    if (filter.endDate && log.timestamp > filter.endDate) {
      return false;
    }

    return true;
  });
};

/**
 * Get audit log statistics
 */
export const getAuditLogStats = (filter?: AuditLogFilter): AuditLogStats => {
  const logs = filter ? getFilteredAuditLogs(filter) : getAuditLogs();

  const eventsByType: Record<string, number> = {};
  const eventsByRegion: Record<string, number> = {};
  const eventsByUser: Record<string, number> = {};

  let successfulEvents = 0;
  let failedEvents = 0;

  logs.forEach(log => {
    // Count by type
    eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;

    // Count by region
    if (log.region) {
      eventsByRegion[log.region] = (eventsByRegion[log.region] || 0) + 1;
    }

    // Count by user
    const userKey = `${log.userName} (${log.userEmail})`;
    eventsByUser[userKey] = (eventsByUser[userKey] || 0) + 1;

    // Count success/failure
    if (log.success) {
      successfulEvents++;
    } else {
      failedEvents++;
    }
  });

  return {
    totalEvents: logs.length,
    successfulEvents,
    failedEvents,
    eventsByType: eventsByType as Record<AuditEventType, number>,
    eventsByRegion,
    eventsByUser,
    recentActivity: logs.slice(0, 50) // Last 50 events
  };
};

/**
 * Clear all audit logs (admin only)
 */
export const clearAuditLogs = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear audit logs:', error);
  }
};

/**
 * Export audit logs to JSON
 */
export const exportAuditLogs = (filter?: AuditLogFilter): string => {
  const logs = filter ? getFilteredAuditLogs(filter) : getAuditLogs();
  return JSON.stringify(logs, null, 2);
};

/**
 * Export audit logs to CSV
 */
export const exportAuditLogsCSV = (filter?: AuditLogFilter): string => {
  const logs = filter ? getFilteredAuditLogs(filter) : getAuditLogs();

  // CSV headers
  const headers = [
    'Timestamp',
    'User Name',
    'User Email',
    'User Role',
    'Event Type',
    'Severity',
    'Region',
    'Tool Name',
    'Action',
    'Success',
    'Error Message'
  ];

  // CSV rows
  const rows = logs.map(log => [
    log.timestamp.toISOString(),
    log.userName,
    log.userEmail,
    log.userRole,
    log.eventType,
    log.severity,
    log.region || '',
    log.toolName || '',
    log.action,
    log.success ? 'Yes' : 'No',
    log.errorMessage || ''
  ]);

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csv;
};

/**
 * Get recent failed access attempts for a region
 */
export const getRegionAccessDenials = (region?: string, limit: number = 20): AuditLogEntry[] => {
  const filter: AuditLogFilter = {
    eventType: 'REGION_ACCESS_DENIED',
    success: false
  };

  if (region) {
    filter.region = region;
  }

  const logs = getFilteredAuditLogs(filter);
  return logs.slice(0, limit);
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = (userId: string): {
  totalActions: number;
  regionsAccessed: string[];
  toolsUsed: string[];
  recentActivity: AuditLogEntry[];
} => {
  const logs = getFilteredAuditLogs({ userId });

  const regionsSet = new Set<string>();
  const toolsSet = new Set<string>();

  logs.forEach(log => {
    if (log.region) regionsSet.add(log.region);
    if (log.toolName) toolsSet.add(log.toolName);
  });

  return {
    totalActions: logs.length,
    regionsAccessed: Array.from(regionsSet),
    toolsUsed: Array.from(toolsSet),
    recentActivity: logs.slice(0, 20)
  };
};
