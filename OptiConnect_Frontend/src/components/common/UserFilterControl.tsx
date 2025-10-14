import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import { getAllUsers } from '../../services/userService';
import type { User } from '../../types/auth.types';

interface UserFilterControlProps {
  onFilterChange: (userId: number | 'all' | 'me') => void;
  defaultValue?: number | 'all' | 'me';
  className?: string;
  showLabel?: boolean;
}

/**
 * User Filter Control Component
 * Allows Admin/Manager to filter GIS data by user
 * Regular users only see their own data
 */
const UserFilterControl: React.FC<UserFilterControlProps> = ({
  onFilterChange,
  defaultValue = 'me',
  className = '',
  showLabel = true
}) => {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [selectedUser, setSelectedUser] = useState<number | 'all' | 'me'>(defaultValue);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Check if user has permission to view other users' data
  const canViewOthers =
    currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  // Fetch users list for Admin/Manager
  useEffect(() => {
    if (canViewOthers) {
      fetchUsers();
    }
  }, [canViewOthers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value: string) => {
    const newValue = value === 'all' || value === 'me' ? value : parseInt(value);
    setSelectedUser(newValue);
    onFilterChange(newValue);
  };

  // If user doesn't have permission, don't show the filter
  if (!canViewOthers) {
    return null;
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          View Data By:
        </label>
      )}

      <div className="space-y-2">
        {/* Radio Options */}
        <div className="space-y-2">
          {/* My Data Only */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="userFilter"
              value="me"
              checked={selectedUser === 'me'}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              My Data Only
            </span>
          </label>

          {/* All Users */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="userFilter"
              value="all"
              checked={selectedUser === 'all'}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              All Users (Combined)
            </span>
          </label>

          {/* Specific User */}
          <div className="space-y-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="userFilter"
                value="specific"
                checked={typeof selectedUser === 'number'}
                onChange={() => {
                  // Select first user if available
                  if (users.length > 0) {
                    const firstUserId = parseInt(users[0].id.replace('OCGID', ''));
                    handleFilterChange(firstUserId.toString());
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Specific User:
              </span>
            </label>

            {/* User Dropdown */}
            {typeof selectedUser === 'number' && (
              <div className="ml-6">
                <select
                  value={typeof selectedUser === 'number' ? selectedUser : ''}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <option>Loading users...</option>
                  ) : users.length === 0 ? (
                    <option>No users found</option>
                  ) : (
                    <>
                      <option value="">Select a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={parseInt(user.id.replace('OCGID', ''))}>
                          {user.name} ({user.username}) - {user.role}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info message */}
      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          {selectedUser === 'me' && '📊 Viewing only your GIS data'}
          {selectedUser === 'all' && '🌐 Viewing all users\' GIS data combined'}
          {typeof selectedUser === 'number' && (
            <>
              👤 Viewing data for:{' '}
              <strong>
                {users.find((u) => parseInt(u.id.replace('OCGID', '')) === selectedUser)?.name || 'Unknown User'}
              </strong>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default UserFilterControl;
