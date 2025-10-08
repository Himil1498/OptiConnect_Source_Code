/**
 * User Permissions Dialog Component
 * Manage direct permissions for individual users
 */

import React, { useState } from 'react';
import type { User } from '../../types/auth.types';
import { SYSTEM_PERMISSIONS, PermissionCategory } from '../../types/permissions.types';

interface UserPermissionsDialogProps {
  user: User;
  onSave: (userId: string, permissions: string[]) => void;
  onClose: () => void;
}

const UserPermissionsDialog: React.FC<UserPermissionsDialogProps> = ({
  user,
  onSave,
  onClose
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    user.directPermissions || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, selectedPermissions);
    onClose();
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllPermissionsInCategory = (category: PermissionCategory) => {
    const categoryPermissions = SYSTEM_PERMISSIONS
      .filter(p => p.category === category)
      .map(p => p.id);

    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      // Deselect all
      setSelectedPermissions(prev =>
        prev.filter(p => !categoryPermissions.includes(p))
      );
    } else {
      // Select all
      setSelectedPermissions(prev =>
        Array.from(new Set([...prev, ...categoryPermissions]))
      );
    }
  };

  // Group permissions by category
  const permissionsByCategory = SYSTEM_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<PermissionCategory, typeof SYSTEM_PERMISSIONS>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Manage Permissions for {user.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {user.email} • {user.role}
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

            {/* Info Banner */}
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Direct permissions are added to role-based and group permissions. Selected: {selectedPermissions.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions List */}
            <div className="max-h-96 overflow-y-auto px-4">
              <div className="space-y-6">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {category}
                      </h4>
                      <button
                        type="button"
                        onClick={() => selectAllPermissionsInCategory(category as PermissionCategory)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {perms.every(p => selectedPermissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`perm-${perm.id}`}
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor={`perm-${perm.id}`} className="font-medium text-gray-700 dark:text-gray-300">
                              {perm.name}
                            </label>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">{perm.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Permissions
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsDialog;
