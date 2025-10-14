import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import {
  grantTemporaryAccess,
  getTemporaryAccess,
  getFilteredTemporaryAccess,
  revokeTemporaryAccess,
  extendTemporaryAccess,
  deleteTemporaryGrant,
  getTemporaryAccessStats,
  getExpiringGrants
} from '../../services/temporaryAccessService';
import { getAllUsers } from '../../services/userService';
import { INDIAN_STATES } from '../../utils/regionMapping';
import type { TemporaryRegionAccess, TemporaryAccessFilter } from '../../types/temporaryAccess.types';
import NotificationDialog from '../common/NotificationDialog';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import {
  ClockIcon,
  UserGroupIcon,
  MapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Simple User interface for this component
interface SimpleUser {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
}

const TemporaryAccessManagement: React.FC = () => {
  const currentUser = useAppSelector(state => state.auth.user);
  const [grants, setGrants] = useState<TemporaryRegionAccess[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [reason, setReason] = useState('');

  // Filter state
  const [filterUserId, setFilterUserId] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');

  // Modal state
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<TemporaryRegionAccess | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    grant: null as TemporaryRegionAccess | null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification state
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

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    revoked: 0
  });

  const [expiringGrants, setExpiringGrants] = useState<TemporaryRegionAccess[]>([]);

  // Check if user is admin (must be after all hooks)
  const isAdmin = currentUser && currentUser.role === 'Admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUserId, filterRegion, filterStatus, isAdmin]);

  const loadData = async () => {
    setLoading(true);

    try {
      // Always load users from backend
      try {
        const backendUsers = await getAllUsers();
        // Map backend users to User type expected by component
        const mappedUsers: SimpleUser[] = backendUsers
          .filter((u: any) => u.id?.toString() !== currentUser?.id && u.role !== 'Admin' && u.role !== 'admin')
          .map((u: any) => ({
            id: u.id?.toString() || u.user_id || '',
            username: u.username || '',
            name: u.full_name || u.name || u.username || '',
            email: u.email || '',
            role: u.role || 'User',
            isActive: u.is_active !== undefined ? u.is_active : true
          }));
        setUsers(mappedUsers);
        console.log('📊 Temporary Access: Loaded real users from backend:', mappedUsers.length);
      } catch (error: any) {
        console.error('Failed to load users from backend:', error);
        if (error.response?.status === 401) {
          showNotification('error', 'Authentication Required', 'Please log in to access this page.');
          return;
        }
        setUsers([]);
      }

      // Load grants with filters
      let filteredGrants: TemporaryRegionAccess[];

      const filter: TemporaryAccessFilter = {};
      if (filterUserId) filter.userId = filterUserId;
      if (filterRegion) filter.region = filterRegion;

      if (filterStatus === 'active') {
        filter.isActive = true;
      }

      try {
        if (filterUserId || filterRegion || filterStatus !== 'all') {
          filteredGrants = await getFilteredTemporaryAccess(filter);
        } else {
          filteredGrants = await getTemporaryAccess();
        }

        // Additional filtering for expired/revoked
        const now = new Date();
        if (filterStatus === 'expired') {
          filteredGrants = filteredGrants.filter(g => !g.revokedAt && g.expiresAt < now);
        } else if (filterStatus === 'revoked') {
          filteredGrants = filteredGrants.filter(g => g.revokedAt);
        }

        setGrants(filteredGrants);
      } catch (error: any) {
        console.error('Failed to load grants:', error);
        if (error.response?.status === 401) {
          showNotification('error', 'Authentication Required', 'Please log in to access temporary access data.');
          return;
        }
        setGrants([]);
      }

      // Load statistics
      try {
        const tempStats = await getTemporaryAccessStats();
        setStats({
          total: tempStats.totalGrants,
          active: tempStats.activeGrants,
          expired: tempStats.expiredGrants,
          revoked: tempStats.revokedGrants
        });
      } catch (error: any) {
        console.error('Failed to load stats:', error);
        if (error.response?.status !== 401) {
          // Only show non-auth errors, auth error already shown
          setStats({ total: 0, active: 0, expired: 0, revoked: 0 });
        }
      }

      // Load expiring grants
      try {
        const expiring = await getExpiringGrants(7);
        setExpiringGrants(expiring);
      } catch (error: any) {
        console.error('Failed to load expiring grants:', error);
        setExpiringGrants([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsersFromLocalStorage = () => {
    try {
      const usersData = localStorage.getItem('users');
      if (usersData) {
        const parsedUsers: any[] = JSON.parse(usersData);
        const allUsers = parsedUsers
          .filter(u => u.id !== currentUser?.id && u.role !== 'Admin')
          .map(u => ({
            id: u.id,
            username: u.username,
            name: u.name || u.full_name || u.username,
            email: u.email,
            role: u.role,
            isActive: u.isActive !== undefined ? u.isActive : true
          }));
        setUsers(allUsers);
        console.log('📊 Temporary Access: Using mock users from localStorage:', allUsers.length);
      }
    } catch (error) {
      console.error('Failed to load users from localStorage:', error);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedUserId || !selectedRegion || !expirationDate || !reason) {
      showNotification('error', 'Validation Error', 'Please fill in all required fields.');
      return;
    }

    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) {
      showNotification('error', 'Error', 'Selected user not found.');
      return;
    }

    if (!currentUser) {
      showNotification('error', 'Error', 'User not authenticated.');
      return;
    }

    const expiresAt = new Date(expirationDate);
    if (expiresAt <= new Date()) {
      showNotification('error', 'Validation Error', 'Expiration date must be in the future.');
      return;
    }

    setLoading(true);
    try {
      // Cast SimpleUser to any to satisfy grantTemporaryAccess which expects full User type
      // The function only needs basic user properties (id, name, email) which SimpleUser provides
      await grantTemporaryAccess(targetUser as any, selectedRegion, expiresAt, reason, currentUser);
      showNotification(
        'success',
        'Access Granted',
        `Temporary access to ${selectedRegion} granted to ${targetUser.name}.`
      );

      // Reset form
      setSelectedUserId('');
      setSelectedRegion('');
      setExpirationDate('');
      setReason('');

      // Reload data
      await loadData();
    } catch (error) {
      showNotification('error', 'Error', 'Failed to grant temporary access.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!selectedGrant || !newExpirationDate) {
      showNotification('error', 'Validation Error', 'Please select a new expiration date.');
      return;
    }

    if (!currentUser) {
      showNotification('error', 'Error', 'User not authenticated.');
      return;
    }

    const newExpiration = new Date(newExpirationDate);
    if (newExpiration <= new Date()) {
      showNotification('error', 'Validation Error', 'New expiration date must be in the future.');
      return;
    }

    setLoading(true);
    try {
      await extendTemporaryAccess(selectedGrant.id, newExpiration, currentUser);
      showNotification(
        'success',
        'Access Extended',
        `Temporary access extended to ${newExpiration.toLocaleDateString()}.`
      );

      // Close modal and reload
      setExtendModalOpen(false);
      setSelectedGrant(null);
      setNewExpirationDate('');
      await loadData();
    } catch (error) {
      showNotification('error', 'Error', 'Failed to extend temporary access.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedGrant) return;

    if (!currentUser) {
      showNotification('error', 'Error', 'User not authenticated.');
      return;
    }

    setLoading(true);
    try {
      await revokeTemporaryAccess(selectedGrant.id, currentUser, revokeReason || undefined);
      showNotification(
        'success',
        'Access Revoked',
        `Temporary access to ${selectedGrant.region} revoked for ${selectedGrant.userName}.`
      );

      // Close modal and reload
      setRevokeModalOpen(false);
      setSelectedGrant(null);
      setRevokeReason('');
      await loadData();
    } catch (error) {
      showNotification('error', 'Error', 'Failed to revoke temporary access.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (grant: TemporaryRegionAccess) => {
    setDeleteDialog({
      isOpen: true,
      grant
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.grant || !currentUser) {
      showNotification('error', 'Error', 'User not authenticated.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTemporaryGrant(deleteDialog.grant.id, currentUser);
      showNotification('success', 'Grant Deleted', 'Temporary access grant deleted successfully from database.');
      setDeleteDialog({ isOpen: false, grant: null });
      // Reload data to update table in real-time
      await loadData();
      console.log('✅ Table refreshed after deletion');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete temporary access grant';
      showNotification('error', 'Delete Failed', errorMessage);
      console.error('❌ Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const getStatusBadge = (grant: TemporaryRegionAccess) => {
    const now = new Date();

    if (grant.revokedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <XCircleIcon className="h-4 w-4 mr-1" />
          Revoked
        </span>
      );
    }

    if (grant.expiresAt < now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          <ClockIcon className="h-4 w-4 mr-1" />
          Expired
        </span>
      );
    }

    if (grant.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        Inactive
      </span>
    );
  };

  const isExpiringSoon = (grant: TemporaryRegionAccess) => {
    if (grant.revokedAt || !grant.isActive) return false;
    const now = new Date();
    const daysUntilExpiry = Math.floor((grant.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
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
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20 rounded-xl shadow-xl border-2 border-amber-100 dark:border-amber-900/30 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
            <ClockIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
              Temporary Access Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Grant and manage temporary region access for users
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-indigo-900/30 p-5 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Total Grants</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
              <UserGroupIcon className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 rounded-xl shadow-lg border-2 border-emerald-100 dark:border-emerald-900/30 p-5 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Active</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <CheckCircleIcon className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-900/30 p-5 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Expired</p>
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.expired}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-md">
              <ClockIcon className="h-7 w-7 text-white" />
          </div>
        </div>
        </div>

        <div className="bg-gradient-to-br from-white to-rose-50 dark:from-gray-800 dark:to-rose-900/20 rounded-xl shadow-lg border-2 border-rose-100 dark:border-rose-900/30 p-5 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-1">Revoked</p>
              <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{stats.revoked}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md">
              <XCircleIcon className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Soon Warning */}
      {expiringGrants.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Expiring Soon
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {expiringGrants.length} grant{expiringGrants.length !== 1 ? 's' : ''} expiring within 7 days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grant Access Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Grant Temporary Access
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select User *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Select User --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Region *
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Select Region --</option>
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expiration Date & Time *
            </label>
            <input
              type="datetime-local"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for temporary access..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGrantAccess}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Granting...' : 'Grant Access'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Filter Grants
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User
            </label>
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Region
            </label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Regions</option>
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grants Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Temporary Access Grants ({grants.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Granted By / Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Expires At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {grants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No temporary access grants found
                  </td>
                </tr>
              ) : (
                grants.map(grant => (
                  <tr key={grant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {grant.userName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {grant.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <MapIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {grant.region}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {grant.grantedByName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(grant.grantedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(grant.expiresAt)}
                      </div>
                      {grant.timeRemaining && !grant.timeRemaining.expired ? (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            grant.timeRemaining.days <= 1
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : grant.timeRemaining.days <= 7
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {grant.timeRemaining.display} remaining
                          </span>
                        </div>
                      ) : grant.timeRemaining?.expired && !grant.revokedAt ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mt-1">
                          Time expired
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(grant)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {grant.isActive && !grant.revokedAt && grant.expiresAt > new Date() && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedGrant(grant);
                              setNewExpirationDate('');
                              setExtendModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Extend"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGrant(grant);
                              setRevokeReason('');
                              setRevokeModalOpen(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            title="Revoke"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteClick(grant)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extend Modal */}
      {extendModalOpen && selectedGrant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Extend Temporary Access
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Extending access for <span className="font-semibold">{selectedGrant.userName}</span> to{' '}
              <span className="font-semibold">{selectedGrant.region}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Expiration: {formatDate(selectedGrant.expiresAt)}
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Expiration Date & Time *
              </label>
              <input
                type="datetime-local"
                value={newExpirationDate}
                onChange={(e) => setNewExpirationDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setExtendModalOpen(false);
                  setSelectedGrant(null);
                  setNewExpirationDate('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={loading || !newExpirationDate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Extending...' : 'Extend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModalOpen && selectedGrant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Revoke Temporary Access
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Revoking access for <span className="font-semibold">{selectedGrant.userName}</span> to{' '}
              <span className="font-semibold">{selectedGrant.region}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Revocation (Optional)
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for revocation..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRevokeModalOpen(false);
                  setSelectedGrant(null);
                  setRevokeReason('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, grant: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Temporary Access Grant"
        message="Are you sure you want to delete this temporary access grant? This action cannot be undone."
        itemName={deleteDialog.grant ? `${deleteDialog.grant.userName} - ${deleteDialog.grant.region}` : ''}
        isLoading={isDeleting}
        type="danger"
      />

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose
        autoCloseDelay={3000}
      />
    </div>
  );
};

export default TemporaryAccessManagement;
