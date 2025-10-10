/**
 * Group Details Dialog Component
 * View detailed information about a user group
 */

import React, { useState, useEffect } from 'react';
import type { User } from '../../types/auth.types';
import type { UserGroup } from '../../types/permissions.types';
import { SYSTEM_PERMISSIONS } from '../../types/permissions.types';
import { getAllUsers } from '../../services/userService';

interface GroupDetailsDialogProps {
  group: UserGroup;
  onClose: () => void;
}

const GroupDetailsDialog: React.FC<GroupDetailsDialogProps> = ({
  group,
  onClose
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  const groupMembers = users.filter(u => group.members.includes(u.id));
  const groupManagers = users.filter(u => group.managers.includes(u.id));
  const groupPermissions = SYSTEM_PERMISSIONS.filter(p => group.permissions.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {group.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {group.description || 'No description'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 max-h-96 overflow-y-auto px-4">
            {/* Status */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Status</h4>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                group.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {group.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Created</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Last Updated</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(group.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Managers */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Managers ({groupManagers.length})
              </h4>
              {groupManagers.length > 0 ? (
                <div className="space-y-2">
                  {groupManagers.map((manager) => (
                    <div key={manager.id} className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{manager.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">({manager.email})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No managers assigned</p>
              )}
            </div>

            {/* Members */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Members ({groupMembers.length})
              </h4>
              {groupMembers.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm py-1">
                      <div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{member.name}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">({member.email})</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{member.role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No members in this group</p>
              )}
            </div>

            {/* Permissions */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Permissions ({groupPermissions.length})
              </h4>
              {groupPermissions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {groupPermissions.map((perm) => (
                    <div key={perm.id} className="text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{perm.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{perm.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No permissions assigned</p>
              )}
            </div>

            {/* Assigned Regions */}
            {group.assignedRegions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Assigned Regions ({group.assignedRegions.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {group.assignedRegions.map((region) => (
                    <span
                      key={region}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsDialog;
