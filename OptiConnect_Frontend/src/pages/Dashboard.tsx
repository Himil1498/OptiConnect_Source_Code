import React from "react";
import { useAppSelector } from "../store";
import { ModeIndicator } from "../components/common/ModeIndicator";
import PageContainer from "../components/common/PageContainer";
import Footer from "../components/common/Footer";

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { appMode } = useAppSelector((state) => state.ui);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to access the dashboard
          </h1>
        </div>
      </div>
    );
  }

  return (
    <PageContainer className="bg-gray-50 dark:bg-gray-900">
      {/* Professional Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 gap-4">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  OptiConnect GIS Platform
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Welcome back, <span className="font-semibold text-gray-900 dark:text-white">{user?.name || "User"}</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section - Company Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.company || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.assignedRegions?.length || 0} Regions Assigned
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg hover:shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
                      Total Towers
                    </dt>
                    <dd className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      1,234
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg hover:shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
                      Active Towers
                    </dt>
                    <dd className="text-2xl font-bold text-green-600 dark:text-green-400">
                      1,156
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg hover:shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
                      Maintenance
                    </dt>
                    <dd className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      23
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg hover:shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
                      Offline
                    </dt>
                    <dd className="text-2xl font-bold text-red-600 dark:text-red-400">
                      55
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-1/5">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recent Activity
                </h3>
                <div className="mt-6 flow-root">
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      No recent activity
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Activity tracking will be available with backend integration (Phase 8)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400"
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
                  System Overview
                </h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Network Health
                    </span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      98.5%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full shadow-sm transition-all duration-500"
                      style={{ width: "98.5%" }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Coverage
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      85.2%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full shadow-sm transition-all duration-500"
                      style={{ width: "85.2%" }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Utilization
                    </span>
                    <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                      67.8%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2.5 rounded-full shadow-sm transition-all duration-500"
                      style={{ width: "67.8%" }}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center px-3 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 transform hover:translate-x-1 group">
                      <svg className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      View Network Map
                    </button>
                    <button className="w-full flex items-center px-3 py-2.5 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200 transform hover:translate-x-1 group">
                      <svg className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Report
                    </button>
                    <button className="w-full flex items-center px-3 py-2.5 text-sm font-semibold text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200 transform hover:translate-x-1 group">
                      <svg className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Development Mode Indicator */}
        <ModeIndicator />
      </div>

      {/* Footer */}
      <Footer showDetails={true} />
    </PageContainer>
  );
};

export default Dashboard;
