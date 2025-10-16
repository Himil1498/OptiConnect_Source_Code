import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import {
  getRegionRequests,
  getFilteredRegionRequests,
  approveRegionRequest,
  rejectRegionRequest,
  getRegionRequestStats,
  deleteRegionRequest
} from '../../services/regionRequestService';
import type { RegionAccessRequest, RegionRequestStatus } from '../../types/regionRequest.types';
import NotificationDialog from '../common/NotificationDialog';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

const RegionRequestManagement: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [requests, setRequests] = useState<RegionAccessRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<RegionRequestStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<RegionAccessRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    request: null as RegionAccessRequest | null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const isAdmin = user?.role === 'Admin';

  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    requestsByUser: {},
    requestsByRegion: {}
  });

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  useEffect(() => {
    const loadStats = async () => {
      const statsData = await getRegionRequestStats();
      setStats(statsData);
    };
    loadStats();
  }, [requests]);

  const loadRequests = async () => {
    if (filterStatus === 'all') {
      const reqs = await getRegionRequests();
      setRequests(reqs);
    } else {
      const reqs = await getFilteredRegionRequests({ status: filterStatus });
      setRequests(reqs);
    }
  };

  const handleApprove = (request: RegionAccessRequest) => {
    setSelectedRequest(request);
    setReviewAction('approve');
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const handleReject = (request: RegionAccessRequest) => {
    setSelectedRequest(request);
    setReviewAction('reject');
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const confirmReview = async () => {
    if (!user || !selectedRequest || !reviewAction) return;

    try {
      if (reviewAction === 'approve') {
        const result = await approveRegionRequest(selectedRequest.id, user, reviewNotes);
        if (result) {
          showNotification(
            'success',
            'Request Approved',
            `Access to ${selectedRequest.requestedRegions.join(', ')} has been approved for ${selectedRequest.userName}.`
          );
        }
      } else {
        const result = await rejectRegionRequest(selectedRequest.id, user, reviewNotes);
        if (result) {
          showNotification(
            'success',
            'Request Rejected',
            `Access request for ${selectedRequest.userName} has been rejected.`
          );
        }
      }

      await loadRequests();
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewAction(null);
      setReviewNotes('');
    } catch (error) {
      showNotification('error', 'Action Failed', 'Failed to process the request. Please try again.');
      console.error('Error processing request:', error);
    }
  };

  const handleDeleteClick = (request: RegionAccessRequest) => {
    setDeleteDialog({
      isOpen: true,
      request
    });
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteDialog.request) return;

    setIsDeleting(true);
    try {
      await deleteRegionRequest(deleteDialog.request.id, user);
      showNotification('success', 'Request Deleted', 'Region request deleted successfully from database.');
      setDeleteDialog({ isOpen: false, request: null });
      // Reload data to update table in real-time
      await loadRequests();
      console.log('✅ Table refreshed after deletion');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete the request';
      showNotification('error', 'Delete Failed', errorMessage);
      console.error('❌ Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const closeNotification = () => {
    setNotification({ ...notification, isOpen: false });
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
            aria-hidden="true"
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
            Only administrators can manage region access requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-violet-50 dark:from-gray-800 dark:to-violet-900/20 rounded-xl shadow-xl border-2 border-violet-100 dark:border-violet-900/30 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-violet-800 dark:from-violet-400 dark:to-violet-600 bg-clip-text text-transparent mb-1">
              Region Access Request Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Review and manage user requests for region access.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-indigo-900/30 p-5 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRequests}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20 rounded-xl shadow-lg border-2 border-amber-100 dark:border-amber-900/30 p-5 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">Pending</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingRequests}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 rounded-xl shadow-lg border-2 border-emerald-100 dark:border-emerald-900/30 p-5 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Approved</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.approvedRequests}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-rose-50 dark:from-gray-800 dark:to-rose-900/20 rounded-xl shadow-lg border-2 border-rose-100 dark:border-rose-900/30 p-5 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{stats.rejectedRequests}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-cyan-50 dark:from-gray-800 dark:to-cyan-900/20 rounded-xl shadow-lg border-2 border-cyan-100 dark:border-cyan-900/30 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <label className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
            Filter by Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as RegionRequestStatus | 'all')}
            className="px-4 py-2 border-2 border-cyan-200 dark:border-cyan-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
            aria-label="Filter requests by status"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex-1 text-right">
            <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-cyan-100 to-cyan-200 dark:from-cyan-900/40 dark:to-cyan-800/40 text-cyan-700 dark:text-cyan-300 rounded-lg font-bold text-sm shadow-sm border border-cyan-300 dark:border-cyan-700">
              <svg
                className="h-4 w-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl border-2 border-violet-100 dark:border-violet-900/30 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="h-16 w-16 mx-auto rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-4">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No requests found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {filterStatus === 'all'
                ? 'There are no region access requests yet.'
                : `There are no ${filterStatus} requests.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-violet-200 dark:divide-violet-900/30">
              <thead className="bg-gradient-to-r from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
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
                      User
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
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
                      Requested Regions
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
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
                      Reason
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
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
                      Status
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        />
                      </svg>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.userName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {request.userEmail}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {request.userRole}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {request.requestedRegions.map((region) => (
                          <span
                            key={region}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs font-medium"
                          >
                            {region}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                        {request.reason.length > 100 ? `${request.reason.substring(0, 100)}...` : request.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                            : request.status === 'approved'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                            : request.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                            : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      {request.reviewedByName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          by {request.reviewedByName}
                        </div>
                      )}
                      {request.reviewNotes && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                          {request.reviewNotes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request)}
                            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-xs"
                            aria-label={`Approve request from ${request.userName}`}
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-xs"
                            aria-label={`Reject request from ${request.userName}`}
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
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteClick(request)}
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-xs"
                          aria-label={`Delete request from ${request.userName}`}
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {showReviewDialog && selectedRequest && reviewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Request
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>User:</strong> {selectedRequest.userName} ({selectedRequest.userEmail})
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <strong>Requested Regions:</strong>
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRequest.requestedRegions.map((region) => (
                    <span
                      key={region}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs"
                    >
                      {region}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
              </div>

              <div>
                <label
                  htmlFor="reviewNotes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Review Notes (Optional)
                </label>
                <textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  aria-label="Review notes"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewDialog(false);
                  setSelectedRequest(null);
                  setReviewAction(null);
                  setReviewNotes('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReview}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, request: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Region Request"
        message="Are you sure you want to delete this region access request? This action cannot be undone."
        itemName={deleteDialog.request ? `${deleteDialog.request.userName} - ${deleteDialog.request.requestedRegions.join(', ')}` : ''}
        isLoading={isDeleting}
        type="danger"
      />

      {/* Notification */}
      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={notification.type === 'success'}
        autoCloseDelay={3000}
      />
    </div>
  );
};

export default RegionRequestManagement;
