import React, { useState } from 'react';
import { INDIAN_STATES } from '../../utils/regionMapping';
import NotificationDialog from '../common/NotificationDialog';
import {
  MapIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface RegionRequestFormProps {
  onSubmit?: () => void;
}

const RegionRequestForm: React.FC<RegionRequestFormProps> = ({ onSubmit }) => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [requestType, setRequestType] = useState<'access' | 'modification' | 'creation'>('access');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRegion || !reason.trim()) {
      showNotification('error', 'Validation Error', 'Please select a region and provide a reason.');
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('opti_connect_token');

      const response = await fetch('http://localhost:5000/api/region-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          region_name: selectedRegion,
          request_type: requestType,
          reason: reason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit region request');
      }

      showNotification(
        'success',
        'Request Submitted',
        `Your ${requestType} request for ${selectedRegion} has been submitted successfully. An administrator will review it soon.`
      );

      // Reset form
      setSelectedRegion('');
      setRequestType('access');
      setReason('');

      // Call parent callback if provided
      if (onSubmit) {
        onSubmit();
      }
    } catch (error: any) {
      console.error('Error submitting region request:', error);
      showNotification(
        'error',
        'Submission Failed',
        error.message || 'Failed to submit region request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    setNotification({ isOpen: true, type, title, message });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <MapIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              Request Region Access
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Submit a request to access, modify, or create a new region
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <ExclamationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              Request Types
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li><strong>Access:</strong> Request permission to view or edit region data</li>
              <li><strong>Modification:</strong> Request changes to existing region boundaries or attributes</li>
              <li><strong>Creation:</strong> Request creation of a new region or sub-region</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Request Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Request Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRequestType('access')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  requestType === 'access'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="text-sm font-semibold">Access</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">View/Edit region</div>
              </button>
              <button
                type="button"
                onClick={() => setRequestType('modification')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  requestType === 'modification'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="text-sm font-semibold">Modification</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Change region</div>
              </button>
              <button
                type="button"
                onClick={() => setRequestType('creation')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  requestType === 'creation'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="text-sm font-semibold">Creation</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">New region</div>
              </button>
            </div>
          </div>

          {/* Region Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Region *
            </label>
            <div className="relative">
              <MapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">-- Select Region --</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Request *
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                placeholder="Please provide a detailed reason for your request..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Provide specific details about why you need this access or what changes you want to make.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('');
                setRequestType('access');
                setReason('');
              }}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose
        autoCloseDelay={5000}
      />
    </div>
  );
};

export default RegionRequestForm;
