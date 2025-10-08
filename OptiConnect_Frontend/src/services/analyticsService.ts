/**
 * Analytics Service
 * Handles tracking, fetching, and analyzing user activity, tool usage, and system metrics
 */

import {
  UserActivity,
  ToolUsageStats,
  RegionalActivity,
  SystemHealth,
  ActivityLogEntry,
  UserStatistics
} from '../types/dashboard.types';
import { User } from '../types/auth.types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEYS = {
  TOOL_USAGE: 'gis_tool_usage',
  USER_ACTIVITY: 'gis_user_activity',
  REGIONAL_STATS: 'gis_regional_stats',
  SYSTEM_HEALTH: 'gis_system_health',
  ACTIVITY_LOG: 'gis_activity_log'
};

const MAX_ACTIVITY_LOG_SIZE = 100;
const MAX_HEALTH_HISTORY_SIZE = 48; // 24 hours with 30min interval

// ============================================================================
// Tool Usage Tracking
// ============================================================================

export interface ToolUsageEntry {
  count: number;
  lastUsed: string;
  users: string[];
  averageDuration: number;
  sessions: {
    timestamp: string;
    userId: string;
    duration: number;
    region?: string;
  }[];
}

export const trackToolUsage = (data: {
  toolName: string;
  userId: string;
  userName: string;
  region?: string;
  duration?: number;
}): void => {
  try {
    const storage = localStorage.getItem(STORAGE_KEYS.TOOL_USAGE);
    const toolUsage: { [key: string]: ToolUsageEntry } = storage ? JSON.parse(storage) : {};

    if (!toolUsage[data.toolName]) {
      toolUsage[data.toolName] = {
        count: 0,
        lastUsed: new Date().toISOString(),
        users: [],
        averageDuration: 0,
        sessions: []
      };
    }

    const tool = toolUsage[data.toolName];
    tool.count++;
    tool.lastUsed = new Date().toISOString();

    if (!tool.users.includes(data.userId)) {
      tool.users.push(data.userId);
    }

    // Add session
    tool.sessions.push({
      timestamp: new Date().toISOString(),
      userId: data.userId,
      duration: data.duration || 0,
      region: data.region
    });

    // Keep only last 50 sessions per tool
    if (tool.sessions.length > 50) {
      tool.sessions = tool.sessions.slice(-50);
    }

    // Calculate average duration
    const totalDuration = tool.sessions.reduce((sum, s) => sum + s.duration, 0);
    tool.averageDuration = totalDuration / tool.sessions.length / 60; // Convert to minutes

    localStorage.setItem(STORAGE_KEYS.TOOL_USAGE, JSON.stringify(toolUsage));

    // Also track in activity log
    trackActivity({
      userId: data.userId,
      userName: data.userName,
      action: 'tool_used',
      tool: data.toolName,
      region: data.region,
      timestamp: new Date(),
      duration: data.duration,
      status: 'success'
    });
  } catch (error) {
    console.error('Error tracking tool usage:', error);
  }
};

export const getToolUsageStats = (): ToolUsageStats[] => {
  try {
    const storage = localStorage.getItem(STORAGE_KEYS.TOOL_USAGE);
    if (!storage) return [];

    const toolUsage: { [key: string]: ToolUsageEntry } = JSON.parse(storage);

    return Object.entries(toolUsage).map(([toolName, data]) => {
      // Get popular regions
      const regionCounts: { [region: string]: number } = {};
      data.sessions.forEach(session => {
        if (session.region) {
          regionCounts[session.region] = (regionCounts[session.region] || 0) + 1;
        }
      });

      const popularRegions = Object.entries(regionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([region]) => region);

      // Calculate trend
      const recentSessions = data.sessions.slice(-10);
      const olderSessions = data.sessions.slice(-20, -10);
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercentage = 0;

      if (olderSessions.length > 0) {
        const recentAvg = recentSessions.length;
        const olderAvg = olderSessions.length;
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (change > 10) {
          trend = 'up';
          trendPercentage = Math.round(change);
        } else if (change < -10) {
          trend = 'down';
          trendPercentage = Math.round(Math.abs(change));
        }
      }

      return {
        toolName,
        displayName: formatToolName(toolName),
        totalUsage: data.count,
        averageDuration: Math.round(data.averageDuration * 10) / 10,
        lastUsed: new Date(data.lastUsed),
        popularRegions,
        userCount: data.users.length,
        trend,
        trendPercentage
      };
    });
  } catch (error) {
    console.error('Error getting tool usage stats:', error);
    return [];
  }
};

// ============================================================================
// User Activity Tracking
// ============================================================================

export const trackActivity = (activity: UserActivity): void => {
  try {
    const storage = localStorage.getItem(STORAGE_KEYS.USER_ACTIVITY);
    const activities: UserActivity[] = storage ? JSON.parse(storage) : [];

    activities.push({
      ...activity,
      timestamp: new Date(activity.timestamp)
    });

    // Keep only last MAX_ACTIVITY_LOG_SIZE activities
    const recentActivities = activities.slice(-MAX_ACTIVITY_LOG_SIZE);

    localStorage.setItem(STORAGE_KEYS.USER_ACTIVITY, JSON.stringify(recentActivities));
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
};

export const getRecentActivities = (limit: number = 20): UserActivity[] => {
  try {
    const storage = localStorage.getItem(STORAGE_KEYS.USER_ACTIVITY);
    if (!storage) return [];

    const activities: UserActivity[] = JSON.parse(storage);
    return activities
      .map(a => ({ ...a, timestamp: new Date(a.timestamp) }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
};

// ============================================================================
// Regional Activity Tracking
// ============================================================================

export const trackRegionalActivity = (region: string): void => {
  try {
    const storage = localStorage.getItem(STORAGE_KEYS.REGIONAL_STATS);
    const regionalStats: { [region: string]: { visits: number; lastVisit: string } } = storage
      ? JSON.parse(storage)
      : {};

    if (!regionalStats[region]) {
      regionalStats[region] = { visits: 0, lastVisit: new Date().toISOString() };
    }

    regionalStats[region].visits++;
    regionalStats[region].lastVisit = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.REGIONAL_STATS, JSON.stringify(regionalStats));
  } catch (error) {
    console.error('Error tracking regional activity:', error);
  }
};

export const getRegionalActivity = (): RegionalActivity[] => {
  try {
    const storage = localStorage.getItem(STORAGE_KEYS.REGIONAL_STATS);
    if (!storage) return [];

    const regionalStats: { [region: string]: { visits: number; lastVisit: string } } = JSON.parse(storage);
    const toolUsage = getToolUsageStats();

    return Object.entries(regionalStats).map(([regionName, data]) => {
      // Calculate activity score based on visits and recency
      const daysSinceLastVisit = (Date.now() - new Date(data.lastVisit).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 100 - daysSinceLastVisit * 10);
      const visitScore = Math.min(100, data.visits * 5);
      const activityScore = Math.round((recencyScore + visitScore) / 2);

      // Get top tools used in this region
      const topTools = toolUsage
        .filter(tool => tool.popularRegions.includes(regionName))
        .sort((a, b) => b.totalUsage - a.totalUsage)
        .slice(0, 3)
        .map(tool => tool.toolName);

      return {
        regionName,
        activeUsers: 0, // Will be calculated from user data
        toolUsage: data.visits,
        lastActivity: new Date(data.lastVisit),
        assignedUsers: 0, // Will be fetched from user assignments
        activityScore,
        topTools
      };
    });
  } catch (error) {
    console.error('Error getting regional activity:', error);
    return [];
  }
};

// ============================================================================
// System Health Tracking
// ============================================================================

export const recordSystemHealth = (health: SystemHealth): void => {
  try {
    const storage = localStorage.getItem(STORAGE_KEYS.SYSTEM_HEALTH);
    const data: { history: any[] } = storage ? JSON.parse(storage) : { history: [] };

    data.history.push({
      timestamp: new Date().toISOString(),
      cpu: health.cpu,
      memory: health.memory,
      latency: health.latency
    });

    // Keep only last MAX_HEALTH_HISTORY_SIZE entries
    if (data.history.length > MAX_HEALTH_HISTORY_SIZE) {
      data.history = data.history.slice(-MAX_HEALTH_HISTORY_SIZE);
    }

    localStorage.setItem(STORAGE_KEYS.SYSTEM_HEALTH, JSON.stringify(data));
  } catch (error) {
    console.error('Error recording system health:', error);
  }
};

export const getSystemHealthHistory = (): any[] => {
  try {
    const storage = localStorage.getItem(STORAGE_KEYS.SYSTEM_HEALTH);
    if (!storage) return [];

    const data: { history: any[] } = JSON.parse(storage);
    return data.history.map(h => ({
      ...h,
      timestamp: new Date(h.timestamp)
    }));
  } catch (error) {
    console.error('Error getting system health history:', error);
    return [];
  }
};

export const getCurrentSystemHealth = async (): Promise<SystemHealth> => {
  try {
    // Measure API latency
    const start = performance.now();
    // In production, this would be a real API call
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    const end = performance.now();
    const latency = Math.round(end - start);

    // Mock CPU and Memory (in production, this would come from backend)
    const cpu = Math.round(20 + Math.random() * 40);
    const memory = Math.round(40 + Math.random() * 30);

    // Get uptime from session start
    const sessionStart = sessionStorage.getItem('session_start');
    const uptime = sessionStart
      ? Math.round((Date.now() - parseInt(sessionStart)) / 1000)
      : 0;

    // Calculate error rate from recent activities
    const activities = getRecentActivities(100);
    const failedActivities = activities.filter(a => a.status === 'failed').length;
    const errorRate = activities.length > 0
      ? Math.round((failedActivities / activities.length) * 100)
      : 0;

    // Determine API status
    let apiStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (latency > 500 || cpu > 80 || memory > 85) {
      apiStatus = 'degraded';
    }
    if (latency > 2000 || cpu > 95 || memory > 95) {
      apiStatus = 'down';
    }

    const health: SystemHealth = {
      cpu,
      memory,
      latency,
      uptime,
      errorRate,
      apiStatus
    };

    // Record in history
    recordSystemHealth(health);

    return health;
  } catch (error) {
    console.error('Error getting system health:', error);
    return {
      cpu: 0,
      memory: 0,
      latency: 0,
      uptime: 0,
      errorRate: 0,
      apiStatus: 'down'
    };
  }
};

// ============================================================================
// User Statistics
// ============================================================================

export const getUserStatistics = (users: User[]): UserStatistics => {
  try {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const activeUsers = users.filter(user => {
      // Mock: Consider user active if they have recent activity
      const activities = getRecentActivities(100);
      return activities.some(a => a.userId === user.id);
    });

    const loggedInUsers = users.filter(user => {
      // Mock: Check session storage or activity timestamp
      return activeUsers.includes(user);
    });

    const newUsersThisWeek = users.filter(user => {
      // Mock: Would check user.createdAt in production
      return Math.random() < 0.1; // 10% are new
    }).length;

    return {
      total: users.length,
      active: activeUsers.length,
      inactive: users.length - activeUsers.length,
      loggedIn: loggedInUsers.slice(0, 10), // Show max 10
      newThisWeek: newUsersThisWeek,
      trend: {
        daily: Array.from({ length: 7 }, () => Math.floor(Math.random() * 30) + 10),
        weekly: Array.from({ length: 4 }, () => Math.floor(Math.random() * 100) + 50),
        monthly: Array.from({ length: 12 }, () => Math.floor(Math.random() * 300) + 100)
      }
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      loggedIn: [],
      newThisWeek: 0,
      trend: {
        daily: [],
        weekly: [],
        monthly: []
      }
    };
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

const formatToolName = (toolName: string): string => {
  return toolName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const clearAnalyticsData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

export const exportAnalyticsData = (): any => {
  return {
    toolUsage: getToolUsageStats(),
    recentActivities: getRecentActivities(100),
    regionalActivity: getRegionalActivity(),
    systemHealthHistory: getSystemHealthHistory(),
    exportedAt: new Date().toISOString()
  };
};

// ============================================================================
// Initialize Session
// ============================================================================

export const initializeAnalyticsSession = (): void => {
  if (!sessionStorage.getItem('session_start')) {
    sessionStorage.setItem('session_start', Date.now().toString());
  }
};
