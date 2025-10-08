/**
 * Metrics Service
 * Calculates KPIs and provides aggregated metrics for dashboard
 */

import {
  DashboardMetrics,
  ToolAnalytics,
  RegionalAnalytics,
  SystemPerformance
} from '../types/dashboard.types';
import { User } from '../types/auth.types';
import {
  getToolUsageStats,
  getRegionalActivity,
  getCurrentSystemHealth,
  getUserStatistics,
  getSystemHealthHistory
} from './analyticsService';

// ============================================================================
// Dashboard Metrics
// ============================================================================

export const getDashboardMetrics = async (users: User[]): Promise<DashboardMetrics> => {
  try {
    const userStats = getUserStatistics(users);
    const toolStats = getToolUsageStats();
    const regionalStats = getRegionalActivity();
    const systemHealth = await getCurrentSystemHealth();

    // Build tool usage map
    const toolUsage: { [toolName: string]: number } = {};
    toolStats.forEach(tool => {
      toolUsage[tool.toolName] = tool.totalUsage;
    });

    // Build regional activity map
    const regionalActivity: { [region: string]: number } = {};
    regionalStats.forEach(region => {
      regionalActivity[region.regionName] = region.activityScore;
    });

    return {
      activeUsers: userStats.active,
      inactiveUsers: userStats.inactive,
      currentlyLoggedIn: userStats.loggedIn,
      toolUsage,
      regionalActivity,
      systemHealth,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw error;
  }
};

// ============================================================================
// Tool Analytics
// ============================================================================

export const getToolAnalytics = (): ToolAnalytics => {
  try {
    const toolStats = getToolUsageStats();

    if (toolStats.length === 0) {
      return {
        totalTools: 0,
        activeTools: 0,
        totalUsage: 0,
        mostUsedTool: 'None',
        leastUsedTool: 'None',
        usageByTool: [],
        usageByTime: []
      };
    }

    const totalUsage = toolStats.reduce((sum, tool) => sum + tool.totalUsage, 0);
    const activeTools = toolStats.filter(tool => tool.totalUsage > 0).length;

    const sortedByUsage = [...toolStats].sort((a, b) => b.totalUsage - a.totalUsage);
    const mostUsedTool = sortedByUsage[0]?.displayName || 'None';
    const leastUsedTool = sortedByUsage[sortedByUsage.length - 1]?.displayName || 'None';

    // Mock usage by time (in production, would be calculated from actual timestamps)
    const usageByTime = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: Math.floor(Math.random() * 20) + 5
    }));

    return {
      totalTools: toolStats.length,
      activeTools,
      totalUsage,
      mostUsedTool,
      leastUsedTool,
      usageByTool: toolStats,
      usageByTime
    };
  } catch (error) {
    console.error('Error getting tool analytics:', error);
    return {
      totalTools: 0,
      activeTools: 0,
      totalUsage: 0,
      mostUsedTool: 'None',
      leastUsedTool: 'None',
      usageByTool: [],
      usageByTime: []
    };
  }
};

// ============================================================================
// Regional Analytics
// ============================================================================

export const getRegionalAnalytics = (): RegionalAnalytics => {
  try {
    const regionalStats = getRegionalActivity();

    if (regionalStats.length === 0) {
      return {
        totalRegions: 0,
        activeRegions: 0,
        totalActivity: 0,
        mostActiveRegion: 'None',
        leastActiveRegion: 'None',
        activityByRegion: [],
        coveragePercentage: 0
      };
    }

    const activeRegions = regionalStats.filter(region => region.activityScore > 50).length;
    const totalActivity = regionalStats.reduce((sum, region) => sum + region.toolUsage, 0);

    const sortedByActivity = [...regionalStats].sort((a, b) => b.activityScore - a.activityScore);
    const mostActiveRegion = sortedByActivity[0]?.regionName || 'None';
    const leastActiveRegion = sortedByActivity[sortedByActivity.length - 1]?.regionName || 'None';

    const coveragePercentage = Math.round((activeRegions / regionalStats.length) * 100);

    return {
      totalRegions: regionalStats.length,
      activeRegions,
      totalActivity,
      mostActiveRegion,
      leastActiveRegion,
      activityByRegion: regionalStats,
      coveragePercentage
    };
  } catch (error) {
    console.error('Error getting regional analytics:', error);
    return {
      totalRegions: 0,
      activeRegions: 0,
      totalActivity: 0,
      mostActiveRegion: 'None',
      leastActiveRegion: 'None',
      activityByRegion: [],
      coveragePercentage: 0
    };
  }
};

// ============================================================================
// System Performance
// ============================================================================

export const getSystemPerformance = async (): Promise<SystemPerformance> => {
  try {
    const health = await getCurrentSystemHealth();
    const history = getSystemHealthHistory();

    // Generate alerts based on thresholds
    const alerts = [];

    if (health.cpu > 80) {
      alerts.push({
        id: `cpu-${Date.now()}`,
        type: 'cpu' as const,
        severity: health.cpu > 90 ? ('critical' as const) : ('high' as const),
        message: `High CPU usage detected: ${health.cpu}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    if (health.memory > 85) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: 'memory' as const,
        severity: health.memory > 95 ? ('critical' as const) : ('high' as const),
        message: `High memory usage detected: ${health.memory}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    if (health.latency > 500) {
      alerts.push({
        id: `latency-${Date.now()}`,
        type: 'latency' as const,
        severity: health.latency > 1000 ? ('critical' as const) : ('medium' as const),
        message: `High API latency detected: ${health.latency}ms`,
        timestamp: new Date(),
        resolved: false
      });
    }

    return {
      health,
      history,
      alerts,
      uptime: health.uptime,
      downtimeEvents: [] // Would be tracked in production
    };
  } catch (error) {
    console.error('Error getting system performance:', error);
    throw error;
  }
};

// ============================================================================
// KPI Calculations
// ============================================================================

/**
 * Calculate User Engagement KPI
 * (Active Users / Total Users) × 100
 */
export const calculateUserEngagement = (activeUsers: number, totalUsers: number): number => {
  if (totalUsers === 0) return 0;
  return Math.round((activeUsers / totalUsers) * 100);
};

/**
 * Calculate Tool Adoption KPI
 * (Tools Used / Total Tools) × 100
 */
export const calculateToolAdoption = (usedTools: number, totalTools: number): number => {
  if (totalTools === 0) return 0;
  return Math.round((usedTools / totalTools) * 100);
};

/**
 * Calculate Regional Coverage KPI
 * (Active Regions / Total Regions) × 100
 */
export const calculateRegionalCoverage = (activeRegions: number, totalRegions: number): number => {
  if (totalRegions === 0) return 0;
  return Math.round((activeRegions / totalRegions) * 100);
};

/**
 * Calculate System Performance Score
 * Based on CPU, Memory, and Latency
 */
export const calculatePerformanceScore = (
  cpu: number,
  memory: number,
  latency: number
): number => {
  const cpuScore = Math.max(0, 100 - cpu);
  const memoryScore = Math.max(0, 100 - memory);
  const latencyScore = Math.max(0, 100 - latency / 10);

  return Math.round((cpuScore + memoryScore + latencyScore) / 3);
};

/**
 * Calculate Success Rate KPI
 * (Successful Operations / Total Operations) × 100
 */
export const calculateSuccessRate = (successful: number, total: number): number => {
  if (total === 0) return 100;
  return Math.round((successful / total) * 100);
};

// ============================================================================
// Trend Analysis
// ============================================================================

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Calculate trend between two values
 */
export const calculateTrend = (current: number, previous: number): TrendData => {
  const change = current - previous;
  const changePercentage = previous === 0 ? 0 : Math.round((change / previous) * 100);

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (changePercentage > 5) trend = 'up';
  else if (changePercentage < -5) trend = 'down';

  return {
    current,
    previous,
    change,
    changePercentage,
    trend
  };
};

/**
 * Get trend icon and color
 */
export const getTrendDisplay = (trend: 'up' | 'down' | 'stable'): {
  icon: string;
  color: string;
} => {
  switch (trend) {
    case 'up':
      return { icon: '↑', color: 'text-green-600' };
    case 'down':
      return { icon: '↓', color: 'text-red-600' };
    case 'stable':
      return { icon: '→', color: 'text-gray-600' };
  }
};

// ============================================================================
// Mock Data Generators (for development/testing)
// ============================================================================

export const generateMockMetrics = (): DashboardMetrics => {
  return {
    activeUsers: 98,
    inactiveUsers: 27,
    currentlyLoggedIn: [],
    toolUsage: {
      'distance-measurement': 145,
      'polygon-drawing': 89,
      'circle-drawing': 67,
      'elevation-profile': 54,
      'infrastructure-management': 112
    },
    regionalActivity: {
      'Delhi': 85,
      'Mumbai': 72,
      'Bangalore': 68,
      'Chennai': 45,
      'Kolkata': 38
    },
    systemHealth: {
      cpu: 45,
      memory: 62,
      latency: 87,
      uptime: 45234,
      errorRate: 2,
      apiStatus: 'healthy'
    },
    lastUpdated: new Date()
  };
};

// ============================================================================
// Export Utilities
// ============================================================================

export const formatMetricsForExport = (metrics: DashboardMetrics): any => {
  return {
    summary: {
      activeUsers: metrics.activeUsers,
      inactiveUsers: metrics.inactiveUsers,
      totalUsers: metrics.activeUsers + metrics.inactiveUsers,
      loggedInCount: metrics.currentlyLoggedIn.length,
      toolUsageCount: Object.keys(metrics.toolUsage).length,
      regionCount: Object.keys(metrics.regionalActivity).length,
      systemStatus: metrics.systemHealth.apiStatus
    },
    toolUsage: Object.entries(metrics.toolUsage).map(([tool, usage]) => ({
      tool,
      usage
    })),
    regionalActivity: Object.entries(metrics.regionalActivity).map(([region, score]) => ({
      region,
      activityScore: score
    })),
    systemHealth: metrics.systemHealth,
    generatedAt: metrics.lastUpdated.toISOString()
  };
};
