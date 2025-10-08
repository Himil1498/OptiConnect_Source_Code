// Region Reports Export Service

import { getAllRegionUsageStats, getAnalyticsSummary, getUserRegionActivity } from './regionAnalyticsService';
import { getRegionZones, getZoneAssignments, getZoneStats } from './regionHierarchyService';
import { getAuditLogStats, exportAuditLogsCSV } from './auditService';
import { getTemporaryAccessStats, getTemporaryAccess } from './temporaryAccessService';
import { getRegionRequests, getRegionRequestStats } from './regionRequestService';
import type { User } from '../types/auth.types';

export type ReportType =
  | 'region_usage'
  | 'user_activity'
  | 'access_denials'
  | 'audit_logs'
  | 'temporary_access'
  | 'region_requests'
  | 'zone_assignments'
  | 'comprehensive';

export interface ReportOptions {
  type: ReportType;
  format: 'csv' | 'json';
  dateFrom?: Date;
  dateTo?: Date;
  regions?: string[];
  users?: string[];
}

/**
 * Generate region usage report
 */
const generateRegionUsageReport = (format: 'csv' | 'json'): string => {
  const stats = getAllRegionUsageStats();

  if (format === 'json') {
    return JSON.stringify(stats, null, 2);
  }

  // CSV format
  const headers = [
    'Region',
    'Total Accesses',
    'Successful',
    'Denied',
    'Unique Users',
    'Success Rate (%)',
    'Most Active User',
    'Last Accessed'
  ];

  const rows = stats.map(s => [
    s.region,
    s.totalAccesses.toString(),
    s.successfulAccesses.toString(),
    s.deniedAccesses.toString(),
    s.uniqueUsers.toString(),
    (s.totalAccesses > 0 ? (s.successfulAccesses / s.totalAccesses) * 100 : 0).toFixed(2),
    s.mostActiveUser?.userName || 'N/A',
    s.lastAccessed?.toISOString() || 'N/A'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};

/**
 * Generate user activity report
 */
const generateUserActivityReport = (format: 'csv' | 'json'): string => {
  const activity = getUserRegionActivity();

  if (format === 'json') {
    return JSON.stringify(activity, null, 2);
  }

  // CSV format
  const headers = [
    'User Name',
    'Email',
    'Total Accesses',
    'Denied Attempts',
    'Regions Accessed',
    'Most Accessed Region',
    'Last Active'
  ];

  const rows = activity.map(a => [
    a.userName,
    a.userEmail,
    a.totalAccesses.toString(),
    a.deniedAttempts.toString(),
    a.regionsAccessed.join('; '),
    a.mostAccessedRegion || 'N/A',
    a.lastActive?.toISOString() || 'N/A'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};

/**
 * Generate access denials report
 */
const generateAccessDenialsReport = (format: 'csv' | 'json'): string => {
  const stats = getAllRegionUsageStats();
  const denialsData = stats
    .filter(s => s.deniedAccesses > 0)
    .sort((a, b) => b.deniedAccesses - a.deniedAccesses);

  if (format === 'json') {
    return JSON.stringify(denialsData, null, 2);
  }

  // CSV format
  const headers = ['Region', 'Total Denials', 'Total Attempts', 'Denial Rate (%)', 'Unique Users Denied'];

  const rows = denialsData.map(s => [
    s.region,
    s.deniedAccesses.toString(),
    s.totalAccesses.toString(),
    (s.totalAccesses > 0 ? (s.deniedAccesses / s.totalAccesses) * 100 : 0).toFixed(2),
    s.uniqueUsers.toString()
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};

/**
 * Generate temporary access report
 */
const generateTemporaryAccessReport = (format: 'csv' | 'json'): string => {
  const grants = getTemporaryAccess();

  if (format === 'json') {
    return JSON.stringify(grants, null, 2);
  }

  // CSV format
  const headers = [
    'User Name',
    'Email',
    'Region',
    'Granted By',
    'Granted At',
    'Expires At',
    'Is Active',
    'Revoked At',
    'Revoked By',
    'Reason'
  ];

  const rows = grants.map(g => [
    g.userName,
    g.userEmail,
    g.region,
    g.grantedByName,
    new Date(g.grantedAt).toISOString(),
    new Date(g.expiresAt).toISOString(),
    g.isActive ? 'Yes' : 'No',
    g.revokedAt ? new Date(g.revokedAt).toISOString() : 'N/A',
    g.revokedByName || 'N/A',
    g.reason
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};

/**
 * Generate region requests report
 */
const generateRegionRequestsReport = (format: 'csv' | 'json'): string => {
  const requests = getRegionRequests();

  if (format === 'json') {
    return JSON.stringify(requests, null, 2);
  }

  // CSV format
  const headers = [
    'User Name',
    'Email',
    'Role',
    'Requested Regions',
    'Reason',
    'Status',
    'Created At',
    'Reviewed By',
    'Reviewed At',
    'Review Notes'
  ];

  const rows = requests.map(r => [
    r.userName,
    r.userEmail,
    r.userRole,
    r.requestedRegions.join('; '),
    r.reason,
    r.status,
    new Date(r.createdAt).toISOString(),
    r.reviewedByName || 'N/A',
    r.reviewedAt ? new Date(r.reviewedAt).toISOString() : 'N/A',
    r.reviewNotes || 'N/A'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};

/**
 * Generate zone assignments report
 */
const generateZoneAssignmentsReport = (format: 'csv' | 'json'): string => {
  const zones = getRegionZones();
  const assignments = getZoneAssignments();

  const data = assignments.map(assignment => {
    const assignedZones = assignment.zoneIds
      .map(id => zones.find(z => z.id === id))
      .filter(z => z !== undefined);

    return {
      userName: assignment.userName,
      userEmail: assignment.userEmail,
      zones: assignedZones.map(z => z!.name).join(', '),
      states: assignedZones.flatMap(z => z!.states).join(', '),
      assignedBy: assignment.assignedByName,
      assignedAt: assignment.assignedAt
    };
  });

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // CSV format
  const headers = ['User Name', 'Email', 'Assigned Zones', 'States', 'Assigned By', 'Assigned At'];

  const rows = data.map(d => [
    d.userName,
    d.userEmail,
    d.zones,
    d.states,
    d.assignedBy,
    new Date(d.assignedAt).toISOString()
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};

/**
 * Generate comprehensive report (all data combined)
 */
const generateComprehensiveReport = (format: 'csv' | 'json'): string => {
  const summary = getAnalyticsSummary();
  const auditStats = getAuditLogStats();
  const tempAccessStats = getTemporaryAccessStats();
  const requestStats = getRegionRequestStats();
  const zoneStats = getZoneStats();

  const comprehensiveData = {
    generatedAt: new Date().toISOString(),
    summary: {
      analytics: summary,
      auditLogs: {
        totalEvents: auditStats.totalEvents,
        successfulEvents: auditStats.successfulEvents,
        failedEvents: auditStats.failedEvents
      },
      temporaryAccess: tempAccessStats,
      regionRequests: requestStats,
      zoneManagement: zoneStats
    },
    regionUsage: getAllRegionUsageStats(),
    userActivity: getUserRegionActivity(),
    temporaryGrants: getTemporaryAccess(),
    regionRequests: getRegionRequests(),
    zoneAssignments: getZoneAssignments()
  };

  if (format === 'json') {
    return JSON.stringify(comprehensiveData, null, 2);
  }

  // For CSV, generate a summary section
  const lines = [
    '=== COMPREHENSIVE REGION MANAGEMENT REPORT ===',
    `Generated: ${new Date().toISOString()}`,
    '',
    '=== SUMMARY STATISTICS ===',
    `Total Regions Accessed: ${summary.totalRegionsAccessed}`,
    `Total Access Attempts: ${summary.totalAccessAttempts}`,
    `Successful Accesses: ${summary.totalSuccessfulAccesses}`,
    `Denied Accesses: ${summary.totalDeniedAccesses}`,
    `Overall Success Rate: ${summary.overallSuccessRate.toFixed(2)}%`,
    `Most Active Region: ${summary.mostActiveRegion}`,
    '',
    `Total Audit Events: ${auditStats.totalEvents}`,
    `Total Temporary Grants: ${tempAccessStats.totalGrants}`,
    `Active Temporary Grants: ${tempAccessStats.activeGrants}`,
    `Total Region Requests: ${requestStats.totalRequests}`,
    `Pending Requests: ${requestStats.pendingRequests}`,
    `Total Zones: ${zoneStats.totalZones}`,
    '',
    '=== For detailed data, please use JSON format ===',
    ''
  ];

  return lines.join('\n');
};

/**
 * Generate report based on type and options
 */
export const generateReport = (options: ReportOptions): string => {
  switch (options.type) {
    case 'region_usage':
      return generateRegionUsageReport(options.format);
    case 'user_activity':
      return generateUserActivityReport(options.format);
    case 'access_denials':
      return generateAccessDenialsReport(options.format);
    case 'audit_logs':
      return options.format === 'json'
        ? JSON.stringify(getAuditLogStats(), null, 2)
        : exportAuditLogsCSV();
    case 'temporary_access':
      return generateTemporaryAccessReport(options.format);
    case 'region_requests':
      return generateRegionRequestsReport(options.format);
    case 'zone_assignments':
      return generateZoneAssignmentsReport(options.format);
    case 'comprehensive':
      return generateComprehensiveReport(options.format);
    default:
      throw new Error(`Unknown report type: ${options.type}`);
  }
};

/**
 * Download report as file
 */
export const downloadReport = (options: ReportOptions, filename?: string): void => {
  const content = generateReport(options);
  const extension = options.format === 'json' ? 'json' : 'csv';
  const mimeType = options.format === 'json' ? 'application/json' : 'text/csv';

  const defaultFilename = `${options.type}_report_${new Date().toISOString().split('T')[0]}.${extension}`;
  const finalFilename = filename || defaultFilename;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Get available report types with descriptions
 */
export const getAvailableReports = (): Array<{
  type: ReportType;
  name: string;
  description: string;
}> => {
  return [
    {
      type: 'region_usage',
      name: 'Region Usage Report',
      description: 'Statistics on region access patterns and usage'
    },
    {
      type: 'user_activity',
      name: 'User Activity Report',
      description: 'User-specific region access activity and patterns'
    },
    {
      type: 'access_denials',
      name: 'Access Denials Report',
      description: 'Regions with denied access attempts'
    },
    {
      type: 'audit_logs',
      name: 'Audit Logs Report',
      description: 'Complete audit trail of all system events'
    },
    {
      type: 'temporary_access',
      name: 'Temporary Access Report',
      description: 'Time-limited region access grants'
    },
    {
      type: 'region_requests',
      name: 'Region Requests Report',
      description: 'User requests for region access'
    },
    {
      type: 'zone_assignments',
      name: 'Zone Assignments Report',
      description: 'User assignments to regional zones'
    },
    {
      type: 'comprehensive',
      name: 'Comprehensive Report',
      description: 'All data combined into one comprehensive report'
    }
  ];
};
