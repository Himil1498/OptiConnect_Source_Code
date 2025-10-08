import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { ToolUsageStats } from '../../types/dashboard.types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ToolUsageChartProps {
  toolStats: ToolUsageStats[];
  loading?: boolean;
}

type ChartType = 'bar' | 'line';
type TimePeriod = 'day' | 'week' | 'month';

const ToolUsageChart: React.FC<ToolUsageChartProps> = ({ toolStats, loading = false }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Empty state when no tool usage data
  if (toolStats.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Tool Usage Analytics
          </h3>
        </div>

        {/* Empty State */}
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No Tool Usage Data Yet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Start using GIS tools on the Map page to see analytics here. Try Distance Measurement, Polygon Drawing, or any other tool.
          </p>
          <div className="mt-6">
            <a
              href="/map"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Go to Map
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const sortedTools = [...toolStats].sort((a, b) => b.totalUsage - a.totalUsage);

  const chartData = {
    labels: sortedTools.map(tool => tool.displayName),
    datasets: [
      {
        label: 'Usage Count',
        data: sortedTools.map(tool => tool.totalUsage),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: chartType === 'line',
        tension: 0.4
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          afterLabel: (context: any) => {
            const tool = sortedTools[context.dataIndex];
            if (!tool) return [];
            return [
              `Avg Duration: ${tool.averageDuration?.toFixed(1) || 0} min`,
              `Users: ${tool.userCount || 0}`,
              `Trend: ${tool.trend === 'up' ? '↑' : tool.trend === 'down' ? '↓' : '→'} ${tool.trendPercentage || 0}%`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#6B7280',
          stepSize: 1,
          precision: 0
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Tool Usage Analytics
          </h3>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  chartType === 'bar'
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  chartType === 'line'
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Line
              </button>
            </div>

            {/* Time Period Selector */}
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm text-white rounded-lg border-none focus:ring-2 focus:ring-white/50"
            >
              <option value="day" className="text-gray-900">Today</option>
              <option value="week" className="text-gray-900">This Week</option>
              <option value="month" className="text-gray-900">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80 min-h-[320px] w-full">
          {chartType === 'bar' ? (
            <Bar data={chartData} options={options} key={`bar-${toolStats.length}`} />
          ) : (
            <Line data={chartData} options={options} key={`line-${toolStats.length}`} />
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Uses</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {sortedTools.reduce((sum, tool) => sum + (tool.totalUsage || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Most Used</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 truncate">
              {sortedTools[0]?.displayName || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Duration</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {sortedTools.length > 0
                ? (sortedTools.reduce((sum, tool) => sum + (tool.averageDuration || 0), 0) / sortedTools.length).toFixed(1)
                : '0.0'} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolUsageChart;
