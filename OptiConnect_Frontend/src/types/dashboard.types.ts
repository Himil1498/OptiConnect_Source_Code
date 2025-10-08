/**
 * Dashboard & Analytics TypeScript Interfaces
 * Phase 7 - KPI Dashboard, User Statistics, Tool Analytics
 */

import { User } from './auth.types';

// ============================================================================
// Main Dashboard Metrics
// ============================================================================

export interface DashboardMetrics {
  activeUsers: number;
  inactiveUsers: number;
  currentlyLoggedIn: User[];
  toolUsage: { [toolName: string]: number };
  regionalActivity: { [region: string]: number };
  systemHealth: SystemHealth;
  lastUpdated: Date;
}

// ============================================================================
// System Health
// ============================================================================

export interface SystemHealth {
  cpu: number;          // Percentage (0-100)
  memory: number;       // Percentage (0-100)
  latency: number;      // Milliseconds
  uptime: number;       // Seconds
  errorRate: number;    // Percentage (0-100)
  apiStatus: 'healthy' | 'degraded' | 'down';
}

// ============================================================================
// Tool Usage Statistics
// ============================================================================

export interface ToolUsageStats {
  toolName: string;
  displayName: string;
  totalUsage: number;
  averageDuration: number;  // Minutes
  lastUsed: Date;
  popularRegions: string[];
  userCount: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

// ============================================================================
// Regional Activity
// ============================================================================

export interface RegionalActivity {
  regionName: string;
  activeUsers: number;
  toolUsage: number;
  lastActivity: Date;
  assignedUsers: number;
  activityScore: number;  // 0-100
  topTools: string[];
}

// ============================================================================
// User Activity
// ============================================================================

export interface UserActivity {
  userId: string;
  userName: string;
  action: string;
  tool?: string;
  region?: string;
  timestamp: Date;
  duration?: number;  // Seconds
  status: 'success' | 'failed' | 'in-progress';
  metadata?: any;
}

// ============================================================================
// KPI Report
// ============================================================================

export interface KPIReport {
  id: string;
  title: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: DashboardMetrics;
  generatedAt: Date;
  generatedBy: string;
  format: 'pdf' | 'csv' | 'json' | 'excel';
  filePath?: string;
}

// ============================================================================
// Dashboard Widget
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'map' | 'timeline';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
  refreshInterval?: number;  // Seconds
  visible: boolean;
}

// ============================================================================
// User Statistics
// ============================================================================

export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  loggedIn: User[];
  newThisWeek: number;
  trend: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

// ============================================================================
// Tool Analytics
// ============================================================================

export interface ToolAnalytics {
  totalTools: number;
  activeTools: number;
  totalUsage: number;
  mostUsedTool: string;
  leastUsedTool: string;
  usageByTool: ToolUsageStats[];
  usageByTime: {
    hour: number;
    count: number;
  }[];
}

// ============================================================================
// Regional Analytics
// ============================================================================

export interface RegionalAnalytics {
  totalRegions: number;
  activeRegions: number;
  totalActivity: number;
  mostActiveRegion: string;
  leastActiveRegion: string;
  activityByRegion: RegionalActivity[];
  coveragePercentage: number;
}

// ============================================================================
// System Performance
// ============================================================================

export interface SystemPerformance {
  health: SystemHealth;
  history: SystemHealthSnapshot[];
  alerts: SystemAlert[];
  uptime: number;  // Seconds
  downtimeEvents: DowntimeEvent[];
}

export interface SystemHealthSnapshot {
  timestamp: Date;
  cpu: number;
  memory: number;
  latency: number;
}

export interface SystemAlert {
  id: string;
  type: 'cpu' | 'memory' | 'latency' | 'error' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface DowntimeEvent {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;  // Seconds
  reason: string;
  impact: 'minor' | 'major' | 'critical';
  active: boolean;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: any;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend: boolean;
  showGrid: boolean;
  animated: boolean;
  colors: string[];
}

// ============================================================================
// Filter & Date Range
// ============================================================================

export interface DateRangeFilter {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
}

export interface DashboardFilters {
  dateRange: DateRangeFilter;
  regions: string[];
  tools: string[];
  users: string[];
  status: ('success' | 'failed' | 'in-progress')[];
}

// ============================================================================
// Export Options
// ============================================================================

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'excel' | 'png';
  includeCharts: boolean;
  includeRawData: boolean;
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'Letter' | 'Legal';
}

// ============================================================================
// Dashboard Configuration
// ============================================================================

export interface DashboardConfig {
  autoRefresh: boolean;
  refreshInterval: number;  // Seconds
  widgets: DashboardWidget[];
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'flex' | 'masonry';
  notifications: boolean;
}

// ============================================================================
// KPI Thresholds
// ============================================================================

export interface KPIThreshold {
  metricName: string;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  comparison: 'greater' | 'less' | 'equal';
}

// ============================================================================
// Activity Log Entry
// ============================================================================

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'tool_used' | 'data_saved' | 'data_deleted' | 'settings_changed' | 'report_generated';
  details: string;
  tool?: string;
  region?: string;
  success: boolean;
  duration?: number;  // Seconds
  ipAddress?: string;
  userAgent?: string;
}
