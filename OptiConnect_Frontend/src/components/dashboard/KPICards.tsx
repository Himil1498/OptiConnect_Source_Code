import React from 'react';
import { DashboardMetrics } from '../../types/dashboard.types';
import { calculateUserEngagement, calculateToolAdoption, getTrendDisplay } from '../../services/metricsService';

interface KPICardsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

interface KPICardData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: number;
  };
  color: string;
  bgColor: string;
}

const KPICards: React.FC<KPICardsProps> = ({ metrics, loading = false }) => {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalUsers = metrics.activeUsers + metrics.inactiveUsers;
  const totalTools = Object.keys(metrics.toolUsage).length;
  const totalRegions = Object.keys(metrics.regionalActivity).length;
  const toolUsageCount = Object.values(metrics.toolUsage).reduce((sum, val) => sum + val, 0);

  const userEngagement = calculateUserEngagement(metrics.activeUsers, totalUsers);
  const toolAdoption = calculateToolAdoption(totalTools, 5); // Assuming 5 total tools

  const kpiCards: KPICardData[] = [
    {
      title: 'Users',
      value: totalUsers,
      subtitle: `${metrics.activeUsers} active, ${metrics.inactiveUsers} inactive`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      trend: {
        direction: 'up',
        value: 12
      },
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Tool Usage',
      value: `${toolAdoption}%`,
      subtitle: `${toolUsageCount} total uses across ${totalTools} tools`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
          />
        </svg>
      ),
      trend: {
        direction: 'up',
        value: 5
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Regions',
      value: totalRegions,
      subtitle: `${Math.round((totalRegions / 28) * 100)}% coverage`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
      trend: {
        direction: 'stable',
        value: 0
      },
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'System Health',
      value: metrics.systemHealth.apiStatus === 'healthy' ? 'Good' : metrics.systemHealth.apiStatus === 'degraded' ? 'Fair' : 'Poor',
      subtitle: `${metrics.systemHealth.latency}ms latency, ${metrics.systemHealth.cpu}% CPU`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      trend: metrics.systemHealth.latency < 100
        ? { direction: 'up', value: 5 }
        : { direction: 'down', value: 3 },
      color: metrics.systemHealth.apiStatus === 'healthy'
        ? 'text-green-600'
        : metrics.systemHealth.apiStatus === 'degraded'
        ? 'text-yellow-600'
        : 'text-red-600',
      bgColor: metrics.systemHealth.apiStatus === 'healthy'
        ? 'bg-green-50 dark:bg-green-900/20'
        : metrics.systemHealth.apiStatus === 'degraded'
        ? 'bg-yellow-50 dark:bg-yellow-900/20'
        : 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => (
        <KPICard key={index} card={card} />
      ))}
    </div>
  );
};

// ============================================================================
// KPI Card Component
// ============================================================================

interface KPICardProps {
  card: KPICardData;
}

const KPICard: React.FC<KPICardProps> = ({ card }) => {
  const trendDisplay = card.trend ? getTrendDisplay(card.trend.direction) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
      {/* Header with Icon */}
      <div className={`${card.bgColor} p-4 flex items-center justify-between`}>
        <div className={card.color}>
          {card.icon}
        </div>
        {card.trend && (
          <div className="flex items-center space-x-1">
            <span className={`text-sm font-medium ${trendDisplay?.color}`}>
              {trendDisplay?.icon}
            </span>
            <span className={`text-xs font-semibold ${trendDisplay?.color}`}>
              {card.trend.value}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {card.title}
        </h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {card.value}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {card.subtitle}
        </p>
      </div>

      {/* Mini Sparkline (placeholder) */}
      <div className={`${card.bgColor} h-1`}>
        <div
          className={`h-full ${card.color.replace('text-', 'bg-')}`}
          style={{ width: `${card.trend ? 60 + card.trend.value : 50}%` }}
        ></div>
      </div>
    </div>
  );
};

export default KPICards;
