import React, { useState, useEffect } from "react";
import { useAppSelector } from "../../store";
import { DashboardMetrics } from "../../types/dashboard.types";
import {
  getDashboardMetrics,
  getToolAnalytics,
  getSystemPerformance
} from "../../services/metricsService";
import {
  getToolUsageStats,
  getUserStatistics,
  initializeAnalyticsSession
} from "../../services/analyticsService";
import { getAllUsers } from "../../services/userService";

// Components
import KPICards from "./KPICards";
import UserStatsPanel from "./UserStatsPanel";
import ToolUsageChart from "./ToolUsageChart";
import SystemHealthMonitor from "./SystemHealthMonitor";
import PageContainer from "../common/PageContainer";

const DashboardLayout: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [realUsers, setRealUsers] = useState<any[]>([]);

  // Initialize analytics session
  useEffect(() => {
    initializeAnalyticsSession();
  }, []);

  // Create mock users helper
  const createMockUsers = (): any[] => {
    const currentUser = {
      id: "1",
      username: user?.email?.split("@")[0] || "admin",
      name: user?.name || "Admin User",
      email: user?.email || "admin@example.com",
      password: "********",
      gender: "Other",
      phoneNumber: "+91-9876543210",
      address: {
        street: "123 Main Street",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001"
      },
      officeLocation: "Head Office",
      assignedUnder: [],
      role: (user?.role || "Admin") as
        | "Admin"
        | "Manager"
        | "Technician"
        | "User",
      assignedRegions: ["Delhi", "Mumbai", "Bangalore"],
      status: "Active" as const,
      loginHistory: [{ timestamp: new Date(), location: "Delhi" }]
    };

    // Generate additional mock users
    const additionalUsers = Array.from({ length: 124 }, (_, i) => ({
      id: `user-${i + 2}`,
      username: `user${i + 2}`,
      name: `User ${i + 2}`,
      email: `user${i + 2}@example.com`,
      password: "********",
      gender: i % 2 === 0 ? "Male" : "Female",
      phoneNumber: `+91-98765${43210 + i}`,
      address: {
        street: `${i + 1} Street`,
        city: ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata"][i % 5],
        state: [
          "Delhi",
          "Maharashtra",
          "Karnataka",
          "Tamil Nadu",
          "West Bengal"
        ][i % 5],
        pincode: `${110001 + i}`
      },
      officeLocation: ["Delhi Office", "Mumbai Office", "Bangalore Office"][
        i % 3
      ],
      assignedUnder: ["1"],
      role: "User" as const,
      assignedRegions: [
        ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata"][i % 5]
      ],
      status: "Active" as const,
      loginHistory: []
    }));

    return [currentUser, ...additionalUsers];
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === 'true';
      let usersData: any[] = [];

      if (USE_BACKEND) {
        try {
          // Fetch real users from backend
          const backendUsers = await getAllUsers();
          usersData = backendUsers;
          console.log('📊 Loaded real users from backend:', backendUsers.length);
        } catch (error) {
          console.error('Failed to load users from backend, falling back to mock data:', error);
          // Fallback to mock data if backend fails
          usersData = createMockUsers();
        }
      } else {
        // Use mock data in mock mode
        usersData = createMockUsers();
        console.log('📊 Using mock users data:', usersData.length);
      }

      // Store users data for userStats calculation
      setRealUsers(usersData);

      // Get metrics
      const dashboardMetrics = await getDashboardMetrics(usersData);
      setMetrics(dashboardMetrics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Manual refresh
  const handleRefresh = () => {
    loadDashboardData();
  };

  const toolStats = getToolUsageStats();
  const userStats = metrics ? getUserStatistics(realUsers.length > 0 ? realUsers : createMockUsers()) : null;

  return (
    <PageContainer>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-lg bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center shadow-lg">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    Dashboard & Analytics
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Real-time metrics and system insights
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Auto-refresh Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Auto-refresh
                  </span>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      autoRefresh
                        ? "bg-blue-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    aria-label="Toggle auto-refresh"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        autoRefresh ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="font-semibold">Refresh</span>
                </button>

                {/* Last Updated */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Updated: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* KPI Cards */}
            <section>
              <KPICards metrics={metrics} loading={loading} />
            </section>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - User Stats */}
              <div className="lg:col-span-1">
                <UserStatsPanel statistics={userStats} loading={loading} />
              </div>

              {/* Right Column - Tool Usage Chart */}
              <div className="lg:col-span-2">
                <ToolUsageChart toolStats={toolStats} loading={loading} />
              </div>
            </div>

            {/* Bottom Row - System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <SystemHealthMonitor
                  health={metrics?.systemHealth || null}
                  loading={loading}
                  autoRefresh={autoRefresh}
                  onRefresh={handleRefresh}
                />
              </div>

              {/* Recent Activity Timeline - Placeholder */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Recent Activity
                    </h3>
                  </div>

                  {/* Activity List */}
                  <div className="space-y-3">
                    {[
                      {
                        time: "2 minutes ago",
                        user: user?.name || "Admin",
                        action: "Used Distance Measurement tool",
                        region: "Delhi"
                      },
                      {
                        time: "15 minutes ago",
                        user: "Jane Smith",
                        action: "Completed Polygon Drawing",
                        region: "Mumbai"
                      },
                      {
                        time: "32 minutes ago",
                        user: "Mike Johnson",
                        action: "Viewed Elevation Profile",
                        region: "Bangalore"
                      },
                      {
                        time: "1 hour ago",
                        user: "Sarah Williams",
                        action: "Managed Infrastructure",
                        region: "Chennai"
                      },
                      {
                        time: "2 hours ago",
                        user: "David Brown",
                        action: "Drew Circle on map",
                        region: "Kolkata"
                      }
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">{activity.user}</span>{" "}
                            {activity.action}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.region} • {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardLayout;
