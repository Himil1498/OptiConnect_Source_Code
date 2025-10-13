import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import { INDIAN_STATES } from '../../utils/regionMapping';
import {
  createRegionRequest,
  getUserRegionRequests,
  hasPendingRequestForRegion,
  cancelRegionRequest
} from '../../services/regionRequestService';
import type { RegionAccessRequest } from '../../types/regionRequest.types';
import NotificationDialog from '../common/NotificationDialog';

const RegionAccessRequestForm: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [userRequests, setUserRequests] = useState<RegionAccessRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    if (user) {
      loadUserRequests();
    }
  }, [user]);

  const loadUserRequests = async () => {
    if (!user) return;
    const requests = await getUserRegionRequests(user.id);
    setUserRequests(requests);
  };

  const handleRegionToggle = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showNotification('error', 'Error', 'User not authenticated');
      return;
    }

    if (selectedRegions.length === 0) {
      showNotification('warning', 'No Regions Selected', 'Please select at least one region to request access.');
      return;
    }

    if (reason.trim().length < 10) {
      showNotification('warning', 'Invalid Reason', 'Please provide a detailed reason (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      await createRegionRequest(user, selectedRegions, reason);

      showNotification(
        'success',
        'Request Submitted',
        `Your request for access to ${selectedRegions.length} region(s) has been submitted successfully. An administrator will review it shortly.`
      );

      // Reset form
      setSelectedRegions([]);
      setReason('');

      // Reload requests
      await loadUserRequests();
    } catch (error) {
      showNotification('error', 'Submission Failed', 'Failed to submit region access request. Please try again.');
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!user) return;

    if (window.confirm('Are you sure you want to cancel this request?')) {
      const result = await cancelRegionRequest(requestId, user);
      if (result) {
        showNotification('success', 'Request Cancelled', 'Your region access request has been cancelled.');
        await loadUserRequests();
      } else {
        showNotification('error', 'Cancellation Failed', 'Failed to cancel request. It may have already been reviewed.');
      }
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const closeNotification = () => {
    setNotification({ ...notification, isOpen: false });
  };

  if (!user) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Please log in to request region access.
        </p>
      </div>
    );
  }

  const assignedRegions = user.assignedRegions || [];
  const pendingRequests = userRequests.filter(req => req.status === 'pending');
  const pendingRegions = pendingRequests.flatMap(req => req.requestedRegions);

  const isRegionAssigned = (region: string) => assignedRegions.includes(region);
  const isRegionPending = (region: string) => pendingRegions.includes(region);
  const isRegionSelectable = (region: string) => !isRegionAssigned(region) && !isRegionPending(region);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Region Access Request
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Request access to additional regions for your account. Administrators will review and approve your request.
        </p>
      </div>

      {/* Current Assigned Regions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Currently Assigned Regions ({assignedRegions.length})
        </h3>
        {assignedRegions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {assignedRegions.map(region => (
              <span
                key={region}
                className="px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full text-sm font-medium"
              >
                {region}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No regions currently assigned to your account.
          </p>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <div
                key={request.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {request.requestedRegions.map(region => (
                      <span
                        key={region}
                        className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded text-xs font-medium"
                      >
                        {region}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Reason:</strong> {request.reason}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Submitted: {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelRequest(request.id)}
                  className="ml-4 px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  aria-label={`Cancel request for ${request.requestedRegions.join(', ')}`}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Request New Region Access
        </h3>

        {/* Region Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Regions to Request ({selectedRegions.length} selected)
          </label>
          <div className="max-h-96 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {INDIAN_STATES.map(region => {
                const assigned = isRegionAssigned(region);
                const pending = isRegionPending(region);
                const selectable = isRegionSelectable(region);
                const selected = selectedRegions.includes(region);

                return (
                  <label
                    key={region}
                    className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                      assigned
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 cursor-not-allowed opacity-60'
                        : pending
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 cursor-not-allowed opacity-60'
                        : selected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!selectable}
                      onChange={() => handleRegionToggle(region)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      aria-label={`Request access to ${region}`}
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                      {region}
                    </span>
                    {assigned && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        Assigned
                      </span>
                    )}
                    {pending && (
                      <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                        Pending
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Reason for Request <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a detailed reason for requesting access to these regions..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            rows={4}
            required
            minLength={10}
            aria-label="Reason for region access request"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum 10 characters. Explain why you need access to the selected regions.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || selectedRegions.length === 0 || reason.trim().length < 10}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Submit region access request"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      {/* Past Requests */}
      {userRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Request History
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Regions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reviewed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {userRequests.map(request => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {request.requestedRegions.map(region => (
                          <span
                            key={region}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            {region}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                            : request.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                            : request.status === 'cancelled'
                            ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {request.reviewedAt ? (
                        <div>
                          <div>{new Date(request.reviewedAt).toLocaleDateString()}</div>
                          {request.reviewedByName && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              by {request.reviewedByName}
                            </div>
                          )}
                          {request.reviewNotes && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Note: {request.reviewNotes}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

export default RegionAccessRequestForm;
