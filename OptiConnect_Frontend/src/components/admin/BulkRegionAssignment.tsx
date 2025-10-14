// Bulk Region Assignment Tool for Admins

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import { INDIAN_STATES } from '../../utils/regionMapping';
import { logAuditEvent } from '../../services/auditService';
import { getAllUsers, bulkAssignRegions } from '../../services/userService';
import NotificationDialog from '../common/NotificationDialog';
import { useTemporaryRegionMonitor } from '../../hooks/useTemporaryRegionMonitor';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedRegions: string[];
}

type AssignmentAction = 'assign' | 'revoke' | 'replace';

const BulkRegionAssignment: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [action, setAction] = useState<AssignmentAction>('assign');
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

  // Enable real-time monitoring of temporary region expirations
  // This hook will automatically update when temporary regions expire
  useTemporaryRegionMonitor(30000); // Check every 30 seconds

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === 'true';

    if (USE_BACKEND) {
      // Load users from backend API
      try {
        const backendUsers = await getAllUsers();
        // Map backend user format to component User format
        const mappedUsers: User[] = backendUsers
          .filter((u: any) => u.role !== 'Admin' && u.role !== 'admin')
          .map((u: any) => ({
            id: u.id?.toString() || u.user_id || '',
            name: u.full_name || u.name || u.username || '',
            email: u.email || '',
            role: u.role || 'User',
            assignedRegions: u.assignedRegions || u.regions || []
          }));
        setUsers(mappedUsers);
        console.log('📊 Bulk Assignment: Loaded real users from backend:', mappedUsers.length);
      } catch (error) {
        console.error('Failed to load users from backend:', error);
        // Fallback to localStorage
        loadUsersFromLocalStorage();
      }
    } else {
      // Load from localStorage in mock mode
      loadUsersFromLocalStorage();
    }
  };

  const loadUsersFromLocalStorage = () => {
    try {
      const usersData = localStorage.getItem('users');
      if (usersData) {
        const parsedUsers: User[] = JSON.parse(usersData);
        // Filter out admin users
        setUsers(parsedUsers.filter(u => u.role !== 'Admin'));
        console.log('📊 Bulk Assignment: Using mock users from localStorage:', parsedUsers.length);
      }
    } catch (error) {
      console.error('Failed to load users from localStorage:', error);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRegionToggle = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSelectAllRegions = () => {
    if (selectedRegions.length === INDIAN_STATES.length) {
      setSelectedRegions([]);
    } else {
      setSelectedRegions([...INDIAN_STATES]);
    }
  };

  const handleApplyBulkAssignment = async () => {
    if (selectedUsers.length === 0) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'No Users Selected',
        message: 'Please select at least one user.'
      });
      return;
    }

    if (selectedRegions.length === 0) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'No Regions Selected',
        message: 'Please select at least one region.'
      });
      return;
    }

    const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === 'true';

    if (USE_BACKEND) {
      // Use backend API for bulk region assignment
      try {
        const result = await bulkAssignRegions(selectedUsers, selectedRegions, action);

        console.log('✅ Bulk region assignment completed:', result);

        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Bulk Assignment Completed',
          message: result.message || `Successfully ${action}ed ${selectedRegions.length} region(s) for ${selectedUsers.length} user(s).`
        });

        // Reload users from backend
        await loadUsers();

        // Reset selections
        setSelectedUsers([]);
        setSelectedRegions([]);

        // Log audit event
        if (user) {
          logAuditEvent(user, 'REGION_ASSIGNED', `Bulk ${action} regions`, {
            severity: 'info',
            details: {
              action,
              userCount: selectedUsers.length,
              regionCount: selectedRegions.length,
              regions: selectedRegions
            },
            success: true
          });
        }
      } catch (error: any) {
        console.error('Failed to apply bulk assignment:', error);
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Assignment Failed',
          message: error.message || 'Failed to apply bulk assignment. Please try again.'
        });
      }
      return;
    }

    // localStorage implementation (fallback)
    const updatedUsers = users.map(u => {
      if (!selectedUsers.includes(u.id)) {
        return u;
      }

      let newRegions: string[];

      switch (action) {
        case 'assign':
          // Add selected regions (avoid duplicates)
          newRegions = Array.from(new Set([...u.assignedRegions, ...selectedRegions]));
          break;
        case 'revoke':
          // Remove selected regions
          newRegions = u.assignedRegions.filter(r => !selectedRegions.includes(r));
          break;
        case 'replace':
          // Replace all regions with selected regions
          newRegions = [...selectedRegions];
          break;
        default:
          newRegions = u.assignedRegions;
      }

      return {
        ...u,
        assignedRegions: newRegions
      };
    });

    // Save to localStorage
    try {
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers.filter(u => u.role !== 'Admin'));

      // Log audit event for each user
      selectedUsers.forEach(userId => {
        const targetUser = users.find(u => u.id === userId);
        if (targetUser && user) {
          logAuditEvent(user, 'REGION_ASSIGNED', `Bulk ${action} regions for ${targetUser.name}`, {
            severity: 'info',
            details: {
              targetUserId: userId,
              targetUserName: targetUser.name,
              targetUserEmail: targetUser.email,
              action,
              regions: selectedRegions
            },
            success: true
          });
        }
      });

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Bulk Assignment Completed',
        message: `Successfully ${action}ed ${selectedRegions.length} region(s) for ${selectedUsers.length} user(s).`
      });

      // Reset selections
      setSelectedUsers([]);
      setSelectedRegions([]);
    } catch (error) {
      console.error('Failed to save users:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Assignment Failed',
        message: 'Failed to apply bulk assignment. Please try again.'
      });
    }
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
            Only administrators can use bulk region assignment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 rounded-xl shadow-xl border-2 border-emerald-100 dark:border-emerald-900/30 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">
              Bulk Region Assignment
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Assign or revoke regions for multiple users at once
            </p>
          </div>
        </div>
      </div>

      {/* Action Selection */}
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
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-600 bg-clip-text text-transparent">
            Select Action
          </h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200">
            <input
              type="radio"
              name="action"
              value="assign"
              checked={action === 'assign'}
              onChange={e => setAction(e.target.value as AssignmentAction)}
              className="mr-3 h-5 w-5 text-emerald-600"
            />
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Assign (Add to existing)
              </span>
            </div>
          </label>
          <label className="flex items-center px-4 py-3 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-2 border-rose-200 dark:border-rose-700 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200">
            <input
              type="radio"
              name="action"
              value="revoke"
              checked={action === 'revoke'}
              onChange={e => setAction(e.target.value as AssignmentAction)}
              className="mr-3 h-5 w-5 text-rose-600"
            />
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-rose-600 dark:text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
              <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
                Revoke (Remove from existing)
              </span>
            </div>
          </label>
          <label className="flex items-center px-4 py-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-200 dark:border-amber-700 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200">
            <input
              type="radio"
              name="action"
              value="replace"
              checked={action === 'replace'}
              onChange={e => setAction(e.target.value as AssignmentAction)}
              className="mr-3 h-5 w-5 text-amber-600"
            />
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                Replace (Override all)
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <div className="bg-gradient-to-br from-white to-violet-50 dark:from-gray-800 dark:to-violet-900/20 rounded-xl shadow-lg border-2 border-violet-100 dark:border-violet-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-violet-800 dark:from-violet-400 dark:to-violet-600 bg-clip-text text-transparent">
                Select Users ({selectedUsers.length}/{users.length})
              </h3>
            </div>
            <button
              onClick={handleSelectAllUsers}
              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-600 hover:to-violet-700 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-semibold"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No users available
              </p>
            ) : (
              users.map(u => (
                <label
                  key={u.id}
                  className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={() => handleUserToggle(u.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {u.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {u.email} • {u.role}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {u.assignedRegions.length} region(s) assigned
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Region Selection */}
        <div className="bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20 rounded-xl shadow-lg border-2 border-amber-100 dark:border-amber-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
                Select Regions ({selectedRegions.length}/{INDIAN_STATES.length})
              </h3>
            </div>
            <button
              onClick={handleSelectAllRegions}
              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-semibold"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              {selectedRegions.length === INDIAN_STATES.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {INDIAN_STATES.map(region => (
              <label
                key={region}
                className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRegions.includes(region)}
                  onChange={() => handleRegionToggle(region)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  {region}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div className="bg-gradient-to-br from-white to-cyan-50 dark:from-gray-800 dark:to-cyan-900/20 rounded-xl shadow-xl border-2 border-cyan-100 dark:border-cyan-900/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
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
                {action === 'assign' && 'Add selected regions to selected users'}
                {action === 'revoke' && 'Remove selected regions from selected users'}
                {action === 'replace' && 'Replace all regions for selected users with selected regions'}
              </p>
              {selectedUsers.length > 0 && selectedRegions.length > 0 && (
                <p className="inline-flex items-center gap-1 text-sm font-bold text-cyan-700 dark:text-cyan-300 mt-2 px-3 py-1 bg-gradient-to-r from-cyan-100 to-cyan-200 dark:from-cyan-900/40 dark:to-cyan-800/40 rounded-lg shadow-sm border border-cyan-300 dark:border-cyan-700">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  This will affect {selectedUsers.length} user(s) and {selectedRegions.length} region(s)
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleApplyBulkAssignment}
            disabled={selectedUsers.length === 0 || selectedRegions.length === 0}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold"
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Apply Bulk {action === 'assign' ? 'Assignment' : action === 'revoke' ? 'Revocation' : 'Replacement'}
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

export default BulkRegionAssignment;
