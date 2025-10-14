// Audit Log Viewer Component for Admin Dashboard

import React, { useState, useEffect } from "react";
import axios from 'axios';
import type {
  AuditLogEntry,
  AuditLogFilter,
  AuditEventType,
  AuditSeverity
} from "../../types/audit.types";
import { useAppSelector } from "../../store";
import ConfirmDialog from "../common/ConfirmDialog";
import NotificationDialog from "../common/NotificationDialog";

// Backend API setup
const BACKEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const apiClient = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('opti_connect_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend audit log interface
interface BackendAuditLog {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  action: string;
  resource_type: string;
  resource_id: number | null;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const AuditLogViewer: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean; logId: string | null}>({isOpen: false, logId: null});
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [isAdmin]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{success: boolean; logs: BackendAuditLog[]}>('/audit/logs', {
        params: { limit: 100 }
      });
      
      if (response.data.success) {
        // Transform backend logs to frontend format
        const transformedLogs: AuditLogEntry[] = response.data.logs.map(log => {
          let parsedDetails = {};
          try {
            parsedDetails = log.details ? JSON.parse(log.details) : {};
          } catch (e) {
            console.error('Failed to parse log details:', e);
          }

          return {
            id: log.id.toString(),
            timestamp: new Date(log.created_at),
            userId: `OCGID${String(log.user_id).padStart(3, '0')}`,
            userName: log.full_name || log.username,
            userEmail: '',
            userRole: 'Unknown',
            eventType: log.resource_type as AuditEventType || 'USER_LOGIN',
            severity: (parsedDetails as any).severity || 'info',
            region: (parsedDetails as any).resource_name || undefined,
            toolName: (parsedDetails as any).toolName || undefined,
            action: log.action,
            details: parsedDetails,
            success: (parsedDetails as any).success !== false,
            errorMessage: (parsedDetails as any).errorMessage || undefined
          };
        });

        setLogs(transformedLogs);
      }
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Failed to Load Logs',
        message: error.response?.data?.error || 'Could not load audit logs'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Severity', 'Success'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.userName,
      log.action,
      log.region || '-',
      log.severity,
      log.success ? 'Yes' : 'No'
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const response = await apiClient.delete<{success: boolean; message?: string}>(`/audit/logs/${logId}`);
      
      if (response.data.success) {
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Log Deleted',
          message: 'Audit log entry has been deleted'
        });
        loadLogs();
      }
    } catch (error: any) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Failed to Delete Log',
        message: error.response?.data?.error || 'Could not delete audit log'
      });
    } finally {
      setDeleteConfirm({isOpen: false, logId: null});
    }
  };

  const handleClearLogs = async () => {
    try {
      const response = await apiClient.delete<{success: boolean; message?: string; deletedCount?: number}>('/audit/logs');
      
      if (response.data.success) {
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Logs Cleared',
          message: response.data.message || 'All audit logs have been cleared successfully'
        });
        loadLogs();
      }
    } catch (error: any) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Failed to Clear Logs',
        message: error.response?.data?.error || 'Could not clear audit logs'
      });
    } finally {
      setShowClearConfirm(false);
    }
  };

  const getSeverityColor = (severity: AuditSeverity) => {
    switch (severity) {
      case "info":
        return "text-blue-700 dark:text-blue-300 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border border-blue-300 dark:border-blue-700 shadow-sm";
      case "warning":
        return "text-amber-700 dark:text-amber-300 bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border border-amber-300 dark:border-amber-700 shadow-sm";
      case "error":
        return "text-red-700 dark:text-red-300 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 border border-red-300 dark:border-red-700 shadow-sm";
      case "critical":
        return "text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 border border-purple-300 dark:border-purple-700 shadow-sm";
      default:
        return "text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900/40 dark:to-gray-800/40 border border-gray-300 dark:border-gray-700 shadow-sm";
    }
  };

  const getSuccessColor = (success: boolean) => {
    return success
      ? "text-emerald-700 dark:text-emerald-300 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 border border-emerald-300 dark:border-emerald-700 shadow-sm"
      : "text-rose-700 dark:text-rose-300 bg-gradient-to-r from-rose-100 to-rose-200 dark:from-rose-900/40 dark:to-rose-800/40 border border-rose-300 dark:border-rose-700 shadow-sm";
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
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
            Only administrators can view audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                Audit Logs
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                Track all user actions and system events ({logs.length} entries)
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold disabled:opacity-50"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={logs.length === 0}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold disabled:opacity-50"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear All Logs
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-150 border-b border-blue-100 dark:border-blue-900/20"
                  >
                    <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-200 font-medium">
                      #{log.id}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-200 font-medium">
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 text-cyan-500 dark:text-cyan-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-900 dark:text-white font-bold">
                            {log.userName}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                            {log.userRole}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-200 font-semibold">
                      {log.action}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {log.region ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 text-amber-700 dark:text-amber-300 rounded-lg font-semibold">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {log.region}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg ${getSeverityColor(
                          log.severity
                        )}`}
                      >
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg ${getSuccessColor(
                          log.success
                        )}`}
                      >
                        {log.success ? (
                          <>
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Success
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Failed
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-xs"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({isOpen: true, logId: log.id});
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-xs"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Audit Log Details
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ID
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    #{selectedLog.id}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Timestamp
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    User
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedLog.userName} ({selectedLog.userEmail || 'N/A'})
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Role: {selectedLog.userRole}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Event Type
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedLog.eventType}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Action
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedLog.action}
                  </p>
                </div>

                {selectedLog.region && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Region
                    </h4>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedLog.region}
                    </p>
                  </div>
                )}

                {selectedLog.toolName && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tool
                    </h4>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedLog.toolName}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </h4>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getSuccessColor(
                      selectedLog.success
                    )}`}
                  >
                    {selectedLog.success ? "Success" : "Failed"}
                  </span>
                </div>

                {selectedLog.errorMessage && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Error Message
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {selectedLog.errorMessage}
                    </p>
                  </div>
                )}

                {Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Additional Details
                    </h4>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Log Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Audit Log"
        message="Are you sure you want to delete this audit log entry? This action cannot be undone."
        confirmText="Delete Log"
        cancelText="Cancel"
        onConfirm={() => deleteConfirm.logId && handleDeleteLog(deleteConfirm.logId)}
        onClose={() => setDeleteConfirm({isOpen: false, logId: null})}
        type="danger"
      />

      {/* Clear All Logs Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All Audit Logs"
        message="Are you sure you want to clear all audit logs? This action cannot be undone."
        confirmText="Clear All Logs"
        cancelText="Cancel"
        onConfirm={handleClearLogs}
        onClose={() => setShowClearConfirm(false)}
        type="danger"
      />

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
    </div>
  );
};

export default AuditLogViewer;