import React, { useEffect, useState } from 'react';
import { SystemHealth } from '../../types/dashboard.types';

interface SystemHealthMonitorProps {
  health: SystemHealth | null;
  loading?: boolean;
  autoRefresh?: boolean;
  onRefresh?: () => void;
}

const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  health,
  loading = false,
  autoRefresh = true,
  onRefresh
}) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
        setLastUpdate(new Date());
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh]);

  if (loading || !health) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: SystemHealth['apiStatus']): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusBgColor = (status: SystemHealth['apiStatus']): string => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'degraded':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'down':
        return 'bg-red-50 dark:bg-red-900/20';
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            System Health
          </h3>

          {/* Manual Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Overall Status */}
        <div className={`${getStatusBgColor(health.apiStatus)} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
              <p className={`text-2xl font-bold ${getStatusColor(health.apiStatus)}`}>
                {health.apiStatus.charAt(0).toUpperCase() + health.apiStatus.slice(1)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-4 h-4 rounded-full ${
                health.apiStatus === 'healthy' ? 'bg-green-500 animate-pulse' :
                health.apiStatus === 'degraded' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500 animate-pulse'
              }`}></span>
            </div>
          </div>
        </div>

        {/* Metrics Gauges */}
        <div className="space-y-4">
          {/* CPU Usage */}
          <MetricGauge
            label="CPU Usage"
            value={health.cpu}
            max={100}
            unit="%"
            color="blue"
            threshold={{ warning: 70, critical: 90 }}
          />

          {/* Memory Usage */}
          <MetricGauge
            label="Memory Usage"
            value={health.memory}
            max={100}
            unit="%"
            color="purple"
            threshold={{ warning: 75, critical: 90 }}
          />

          {/* API Latency */}
          <MetricGauge
            label="API Latency"
            value={health.latency}
            max={1000}
            unit="ms"
            color="orange"
            threshold={{ warning: 300, critical: 700 }}
          />
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatUptime(health.uptime)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Error Rate</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {health.errorRate}%
            </p>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Metric Gauge Component
// ============================================================================

interface MetricGaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: 'blue' | 'purple' | 'orange' | 'green';
  threshold: {
    warning: number;
    critical: number;
  };
}

const MetricGauge: React.FC<MetricGaugeProps> = ({
  label,
  value,
  max,
  unit,
  color,
  threshold
}) => {
  const percentage = (value / max) * 100;

  const getGaugeColor = (): string => {
    if (value >= threshold.critical) {
      return 'bg-red-500';
    } else if (value >= threshold.warning) {
      return 'bg-yellow-500';
    }

    switch (color) {
      case 'blue':
        return 'bg-blue-500';
      case 'purple':
        return 'bg-purple-500';
      case 'orange':
        return 'bg-orange-500';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getTextColor = (): string => {
    if (value >= threshold.critical) {
      return 'text-red-600 dark:text-red-400';
    } else if (value >= threshold.warning) {
      return 'text-yellow-600 dark:text-yellow-400';
    }

    switch (color) {
      case 'blue':
        return 'text-blue-600 dark:text-blue-400';
      case 'purple':
        return 'text-purple-600 dark:text-purple-400';
      case 'orange':
        return 'text-orange-600 dark:text-orange-400';
      case 'green':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className={`text-lg font-bold ${getTextColor()}`}>
          {value}{unit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getGaugeColor()} transition-all duration-500 ease-out relative`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Threshold Markers */}
        <div className="absolute top-0 h-3 w-full pointer-events-none">
          {/* Warning threshold */}
          <div
            className="absolute top-0 h-full w-0.5 bg-yellow-400 opacity-50"
            style={{ left: `${(threshold.warning / max) * 100}%` }}
          ></div>
          {/* Critical threshold */}
          <div
            className="absolute top-0 h-full w-0.5 bg-red-400 opacity-50"
            style={{ left: `${(threshold.critical / max) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Status Message */}
      {value >= threshold.critical && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          ⚠️ Critical level reached
        </p>
      )}
      {value >= threshold.warning && value < threshold.critical && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          ⚠ Warning level reached
        </p>
      )}
    </div>
  );
};

export default SystemHealthMonitor;
