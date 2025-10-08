// Region Usage Analytics Service

import { getAuditLogs } from './auditService';
import { getRegionZones } from './regionHierarchyService';
import type { AuditLogEntry } from '../types/audit.types';

export interface RegionUsageStats {
  region: string;
  totalAccesses: number;
  successfulAccesses: number;
  deniedAccesses: number;
  uniqueUsers: number;
  toolsUsed: Record<string, number>;
  lastAccessed?: Date;
  mostActiveUser?: {
    userId: string;
    userName: string;
    accessCount: number;
  };
}

export interface RegionActivityTimeline {
  date: string;
  region: string;
  accessCount: number;
  denialCount: number;
}

export interface UserRegionActivity {
  userId: string;
  userName: string;
  userEmail: string;
  regionsAccessed: string[];
  totalAccesses: number;
  deniedAttempts: number;
  mostAccessedRegion: string;
  lastActive?: Date;
}

export interface RegionHeatmapData {
  region: string;
  intensity: number; // 0-100 scale
  accessCount: number;
  uniqueUsers: number;
}

/**
 * Get usage statistics for all regions
 */
export const getAllRegionUsageStats = (): RegionUsageStats[] => {
  const logs = getAuditLogs();
  const regionLogs = logs.filter(
    log => log.eventType === 'REGION_ACCESS_GRANTED' || log.eventType === 'REGION_ACCESS_DENIED'
  );

  const regionMap = new Map<string, RegionUsageStats>();

  regionLogs.forEach(log => {
    if (!log.region) return;

    if (!regionMap.has(log.region)) {
      regionMap.set(log.region, {
        region: log.region,
        totalAccesses: 0,
        successfulAccesses: 0,
        deniedAccesses: 0,
        uniqueUsers: 0,
        toolsUsed: {},
        lastAccessed: undefined,
        mostActiveUser: undefined
      });
    }

    const stats = regionMap.get(log.region)!;
    stats.totalAccesses++;

    if (log.eventType === 'REGION_ACCESS_GRANTED') {
      stats.successfulAccesses++;
    } else {
      stats.deniedAccesses++;
    }

    if (log.toolName) {
      stats.toolsUsed[log.toolName] = (stats.toolsUsed[log.toolName] || 0) + 1;
    }

    if (!stats.lastAccessed || log.timestamp > stats.lastAccessed) {
      stats.lastAccessed = log.timestamp;
    }
  });

  // Calculate unique users and most active user per region
  regionMap.forEach((stats, region) => {
    const regionUserLogs = regionLogs.filter(log => log.region === region);
    const userAccessCount = new Map<string, { count: number; name: string }>();

    regionUserLogs.forEach(log => {
      const existing = userAccessCount.get(log.userId) || { count: 0, name: log.userName };
      existing.count++;
      userAccessCount.set(log.userId, existing);
    });

    stats.uniqueUsers = userAccessCount.size;

    // Find most active user
    let maxCount = 0;
    let mostActiveUserId = '';
    let mostActiveUserName = '';

    userAccessCount.forEach((data, userId) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostActiveUserId = userId;
        mostActiveUserName = data.name;
      }
    });

    if (mostActiveUserId) {
      stats.mostActiveUser = {
        userId: mostActiveUserId,
        userName: mostActiveUserName,
        accessCount: maxCount
      };
    }
  });

  return Array.from(regionMap.values()).sort((a, b) => b.totalAccesses - a.totalAccesses);
};

/**
 * Get usage stats for a specific region
 */
export const getRegionUsageStats = (region: string): RegionUsageStats | null => {
  const allStats = getAllRegionUsageStats();
  return allStats.find(stats => stats.region === region) || null;
};

/**
 * Get region activity timeline
 */
export const getRegionActivityTimeline = (
  daysBack: number = 30
): RegionActivityTimeline[] => {
  const logs = getAuditLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const regionLogs = logs.filter(
    log =>
      (log.eventType === 'REGION_ACCESS_GRANTED' ||
        log.eventType === 'REGION_ACCESS_DENIED') &&
      log.timestamp >= cutoffDate &&
      log.region
  );

  const timelineMap = new Map<string, RegionActivityTimeline>();

  regionLogs.forEach(log => {
    const dateKey = log.timestamp.toISOString().split('T')[0];
    const key = `${dateKey}_${log.region}`;

    if (!timelineMap.has(key)) {
      timelineMap.set(key, {
        date: dateKey,
        region: log.region!,
        accessCount: 0,
        denialCount: 0
      });
    }

    const timeline = timelineMap.get(key)!;

    if (log.eventType === 'REGION_ACCESS_GRANTED') {
      timeline.accessCount++;
    } else {
      timeline.denialCount++;
    }
  });

  return Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get user region activity
 */
export const getUserRegionActivity = (): UserRegionActivity[] => {
  const logs = getAuditLogs();
  const regionLogs = logs.filter(
    log => log.eventType === 'REGION_ACCESS_GRANTED' || log.eventType === 'REGION_ACCESS_DENIED'
  );

  const userMap = new Map<string, UserRegionActivity>();

  regionLogs.forEach(log => {
    if (!userMap.has(log.userId)) {
      userMap.set(log.userId, {
        userId: log.userId,
        userName: log.userName,
        userEmail: log.userEmail,
        regionsAccessed: [],
        totalAccesses: 0,
        deniedAttempts: 0,
        mostAccessedRegion: '',
        lastActive: undefined
      });
    }

    const activity = userMap.get(log.userId)!;
    activity.totalAccesses++;

    if (log.eventType === 'REGION_ACCESS_GRANTED') {
      if (log.region && !activity.regionsAccessed.includes(log.region)) {
        activity.regionsAccessed.push(log.region);
      }
    } else {
      activity.deniedAttempts++;
    }

    if (!activity.lastActive || log.timestamp > activity.lastActive) {
      activity.lastActive = log.timestamp;
    }
  });

  // Calculate most accessed region for each user
  userMap.forEach((activity, userId) => {
    const userLogs = regionLogs.filter(
      log => log.userId === userId && log.eventType === 'REGION_ACCESS_GRANTED'
    );

    const regionCount = new Map<string, number>();
    userLogs.forEach(log => {
      if (log.region) {
        regionCount.set(log.region, (regionCount.get(log.region) || 0) + 1);
      }
    });

    let maxCount = 0;
    let mostAccessedRegion = '';

    regionCount.forEach((count, region) => {
      if (count > maxCount) {
        maxCount = count;
        mostAccessedRegion = region;
      }
    });

    activity.mostAccessedRegion = mostAccessedRegion;
  });

  return Array.from(userMap.values()).sort((a, b) => b.totalAccesses - a.totalAccesses);
};

/**
 * Get region heatmap data
 */
export const getRegionHeatmapData = (): RegionHeatmapData[] => {
  const usageStats = getAllRegionUsageStats();

  if (usageStats.length === 0) {
    return [];
  }

  const maxAccesses = Math.max(...usageStats.map(s => s.successfulAccesses));

  return usageStats.map(stats => ({
    region: stats.region,
    intensity: maxAccesses > 0 ? Math.round((stats.successfulAccesses / maxAccesses) * 100) : 0,
    accessCount: stats.successfulAccesses,
    uniqueUsers: stats.uniqueUsers
  }));
};

/**
 * Get top accessed regions
 */
export const getTopAccessedRegions = (limit: number = 10): RegionUsageStats[] => {
  const stats = getAllRegionUsageStats();
  return stats.slice(0, limit);
};

/**
 * Get regions with most denials
 */
export const getTopDeniedRegions = (limit: number = 10): RegionUsageStats[] => {
  const stats = getAllRegionUsageStats();
  return stats
    .sort((a, b) => b.deniedAccesses - a.deniedAccesses)
    .slice(0, limit);
};

/**
 * Get access success rate by region
 */
export const getRegionAccessSuccessRate = (): Array<{
  region: string;
  successRate: number;
  totalAttempts: number;
}> => {
  const stats = getAllRegionUsageStats();

  return stats.map(s => ({
    region: s.region,
    successRate: s.totalAccesses > 0 ? (s.successfulAccesses / s.totalAccesses) * 100 : 0,
    totalAttempts: s.totalAccesses
  })).sort((a, b) => b.successRate - a.successRate);
};

/**
 * Get overall analytics summary
 */
export const getAnalyticsSummary = (): {
  totalRegionsAccessed: number;
  totalAccessAttempts: number;
  totalSuccessfulAccesses: number;
  totalDeniedAccesses: number;
  averageAccessesPerRegion: number;
  mostActiveRegion: string;
  leastActiveRegion: string;
  overallSuccessRate: number;
} => {
  const stats = getAllRegionUsageStats();

  if (stats.length === 0) {
    return {
      totalRegionsAccessed: 0,
      totalAccessAttempts: 0,
      totalSuccessfulAccesses: 0,
      totalDeniedAccesses: 0,
      averageAccessesPerRegion: 0,
      mostActiveRegion: 'N/A',
      leastActiveRegion: 'N/A',
      overallSuccessRate: 0
    };
  }

  const totalAccessAttempts = stats.reduce((sum, s) => sum + s.totalAccesses, 0);
  const totalSuccessfulAccesses = stats.reduce((sum, s) => sum + s.successfulAccesses, 0);
  const totalDeniedAccesses = stats.reduce((sum, s) => sum + s.deniedAccesses, 0);

  const mostActive = stats.reduce((max, s) => (s.totalAccesses > max.totalAccesses ? s : max));
  const leastActive = stats.reduce((min, s) => (s.totalAccesses < min.totalAccesses ? s : min));

  return {
    totalRegionsAccessed: stats.length,
    totalAccessAttempts,
    totalSuccessfulAccesses,
    totalDeniedAccesses,
    averageAccessesPerRegion: totalAccessAttempts / stats.length,
    mostActiveRegion: mostActive.region,
    leastActiveRegion: leastActive.region,
    overallSuccessRate: totalAccessAttempts > 0 ? (totalSuccessfulAccesses / totalAccessAttempts) * 100 : 0
  };
};

/**
 * Export region analytics to CSV
 */
export const exportRegionAnalyticsCSV = (): string => {
  const stats = getAllRegionUsageStats();

  const headers = [
    'Region',
    'Total Accesses',
    'Successful Accesses',
    'Denied Accesses',
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

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csv;
};
