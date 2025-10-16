import React, { useState } from "react";
import { useAppSelector } from "../store";
import AuditLogViewer from "../components/admin/AuditLogViewer";
import RegionRequestManagement from "../components/admin/RegionRequestManagement";
import BulkRegionAssignment from "../components/admin/BulkRegionAssignment";
import TemporaryAccessManagement from "../components/admin/TemporaryAccessManagement";
import RegionReportsExport from "../components/admin/RegionReportsExport";
import PageContainer from "../components/common/PageContainer";

type AdminTab =
  | "audit-logs"
  | "region-requests"
  | "bulk-assignment"
  | "temporary-access"
  | "reports";

const AdminPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<AdminTab>("audit-logs");

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Access Denied
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You must be an administrator to access this page.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "audit-logs" as AdminTab,
      name: "Audit Logs",
      color: "blue",
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-500",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      description: "View system activity and user actions"
    },
    {
      id: "region-requests" as AdminTab,
      name: "Region Requests",
      color: "violet",
      iconColor: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      borderColor: "border-violet-500",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      description: "Approve or reject user access requests"
    },
    {
      id: "bulk-assignment" as AdminTab,
      name: "Bulk Assignment",
      color: "emerald",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-500",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      description: "Assign regions to multiple users at once"
    },
    {
      id: "temporary-access" as AdminTab,
      name: "Temporary Access",
      color: "amber",
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-500",
      icon: (
        <svg
          className="w-5 h-5"
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
      ),
      description: "Grant time-limited region access"
    },
    {
      id: "reports" as AdminTab,
      name: "Export Reports",
      color: "cyan",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      borderColor: "border-cyan-500",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      description: "Download analytics and reports"
    }
  ];

  return (
    <PageContainer>
      <div className="bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-lg bg-red-600 dark:bg-red-500 flex items-center justify-center shadow-lg">
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
                    Administration
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    System administration and region management
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-300 dark:border-red-700">
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
            <nav className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative inline-flex items-center gap-2.5 px-5 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 group
                    ${
                      activeTab === tab.id
                        ? `${tab.bgColor} ${tab.iconColor} shadow-sm`
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50"
                    }
                  `}
                >
                  <span
                    className={`
                      transition-transform duration-200
                      ${
                        activeTab === tab.id
                          ? "scale-110"
                          : "group-hover:scale-105"
                      }
                    `}
                  >
                    {tab.icon}
                  </span>
                  <span className="font-semibold">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.bgColor} rounded-full`}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Description */}
          <div className="mb-6">
            {tabs
              .filter((t) => t.id === activeTab)
              .map((tab) => (
                <div
                  key={tab.id}
                  className={`
                  ${tab.bgColor} 
                  border-l-4 ${tab.borderColor}
                  rounded-lg p-4 shadow-sm
                  transform transition-all duration-300 ease-out
                `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${tab.iconColor} mt-0.5 flex-shrink-0`}>
                      {tab.icon}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`text-sm font-semibold ${tab.iconColor} mb-1`}
                      >
                        {tab.name}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Content */}
          <div className="bg-transparent">
            {activeTab === "audit-logs" && <AuditLogViewer />}
            {activeTab === "region-requests" && <RegionRequestManagement />}
            {activeTab === "bulk-assignment" && <BulkRegionAssignment />}
            {activeTab === "temporary-access" && <TemporaryAccessManagement />}
            {activeTab === "reports" && <RegionReportsExport />}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminPage;
