// Region Reports Export Component

import React, { useState } from 'react';
import { useAppSelector } from '../../store';
import { getAvailableReports, downloadReport, type ReportType } from '../../services/regionReportsService';
import NotificationDialog from '../common/NotificationDialog';

const RegionReportsExport: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [selectedReport, setSelectedReport] = useState<ReportType>('comprehensive');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>('csv');
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  const isAdmin = user?.role === 'Admin';
  const availableReports = getAvailableReports();

  const handleExport = () => {
    try {
      downloadReport({ type: selectedReport, format: selectedFormat });

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Report Exported',
        message: `${selectedReport} report has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Failed to export report:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to generate report. Please try again.'
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Access Denied</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Only administrators can export reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-cyan-50 dark:from-gray-800 dark:to-cyan-900/20 rounded-xl shadow-xl border-2 border-cyan-100 dark:border-cyan-900/30 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <svg
              className="h-7 w-7 text-white"
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
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-800 dark:from-cyan-400 dark:to-cyan-600 bg-clip-text text-transparent">
              Export Region Reports
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Generate and download comprehensive reports on region management and usage
            </p>
          </div>
        </div>
      </div>

      {/* Report Selection */}
      <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-indigo-900/30 p-6">
        <div className="flex items-center mb-5">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mr-3 shadow-md">
            <svg
              className="h-6 w-6 text-white"
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
          <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-600 bg-clip-text text-transparent">
            Select Report Type
          </h3>
        </div>

        <div className="space-y-3">
          {availableReports.map(report => (
            <label
              key={report.type}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedReport === report.type
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="reportType"
                value={report.type}
                checked={selectedReport === report.type}
                onChange={e => setSelectedReport(e.target.value as ReportType)}
                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {report.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {report.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 rounded-xl shadow-lg border-2 border-emerald-100 dark:border-emerald-900/30 p-6">
        <div className="flex items-center mb-5">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mr-3 shadow-md">
            <svg
              className="h-6 w-6 text-white"
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
          <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">
            Select Format
          </h3>
        </div>

        <div className="flex space-x-4">
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer flex-1 transition-colors ${
            selectedFormat === 'csv' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <input
              type="radio"
              name="format"
              value="csv"
              checked={selectedFormat === 'csv'}
              onChange={() => setSelectedFormat('csv')}
              className="mr-3 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">CSV</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Excel-compatible spreadsheet format
              </div>
            </div>
          </label>

          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer flex-1 transition-colors ${
            selectedFormat === 'json' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <input
              type="radio"
              name="format"
              value="json"
              checked={selectedFormat === 'json'}
              onChange={() => setSelectedFormat('json')}
              className="mr-3 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">JSON</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Structured data format for API/programming use
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                Ready to export: <strong className="text-blue-700 dark:text-blue-300">{availableReports.find(r => r.type === selectedReport)?.name}</strong>
              </p>
              <p className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 mt-1 px-2 py-0.5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-md shadow-sm border border-blue-300 dark:border-blue-700">
                Format: {selectedFormat.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-bold"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Export Report
          </button>
        </div>
      </div>

      {/* Quick Export Buttons */}
      <div className="bg-gradient-to-br from-white to-violet-50 dark:from-gray-800 dark:to-violet-900/20 rounded-xl shadow-lg border-2 border-violet-100 dark:border-violet-900/30 p-6">
        <div className="flex items-center mb-5">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mr-3 shadow-md">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-violet-800 dark:from-violet-400 dark:to-violet-600 bg-clip-text text-transparent">
            Quick Export
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => {
              setSelectedReport('region_usage');
              setSelectedFormat('csv');
              setTimeout(handleExport, 100);
            }}
            className="inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-semibold"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Region Usage (CSV)
          </button>
          <button
            onClick={() => {
              setSelectedReport('user_activity');
              setSelectedFormat('csv');
              setTimeout(handleExport, 100);
            }}
            className="inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-semibold"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            User Activity (CSV)
          </button>
          <button
            onClick={() => {
              setSelectedReport('audit_logs');
              setSelectedFormat('csv');
              setTimeout(handleExport, 100);
            }}
            className="inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-semibold"
          >
            <svg
              className="w-4 h-4 mr-2"
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
            Audit Logs (CSV)
          </button>
          <button
            onClick={() => {
              setSelectedReport('comprehensive');
              setSelectedFormat('json');
              setTimeout(handleExport, 100);
            }}
            className="inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-semibold"
          >
            <svg
              className="w-4 h-4 mr-2"
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
            Full Report (JSON)
          </button>
        </div>
      </div>

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

export default RegionReportsExport;
