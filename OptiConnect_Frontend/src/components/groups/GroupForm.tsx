/**
 * Group Form Component
 * Create or edit user group with permissions, members, and regions
 */

import React, { useState, useEffect } from 'react';
import type { UserGroup } from '../../types/permissions.types';
import { SYSTEM_PERMISSIONS, PermissionCategory } from '../../types/permissions.types';
import { getAllUsers } from '../../services/userService';
import type { User } from '../../types/auth.types';

interface GroupFormProps {
  group: UserGroup | null;
  onSave: (groupData: Partial<UserGroup>) => void;
  onCancel: () => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const GroupForm: React.FC<GroupFormProps> = ({
  group,
  onSave,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions' | 'members' | 'regions'>('basic');
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    isActive: group?.isActive !== undefined ? group.isActive : true,
    permissions: group?.permissions || [],
    members: group?.members || [],
    managers: group?.managers || [],
    assignedRegions: group?.assignedRegions || []
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    const users = getAllUsers();
    setAvailableUsers(users);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(m => m !== userId)
        : [...prev.members, userId]
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      assignedRegions: prev.assignedRegions.includes(region)
        ? prev.assignedRegions.filter(r => r !== region)
        : [...prev.assignedRegions, region]
    }));
  };

  const selectAllPermissionsInCategory = (category: PermissionCategory) => {
    const categoryPermissions = SYSTEM_PERMISSIONS
      .filter(p => p.category === category)
      .map(p => p.id);

    const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));

    if (allSelected) {
      // Deselect all
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermissions.includes(p))
      }));
    } else {
      // Select all
      setFormData(prev => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, ...categoryPermissions]))
      }));
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {group ? 'Edit Group' : 'Create New Group'}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'basic', label: 'Basic Info' },
                  { id: 'permissions', label: `Permissions (${formData.permissions.length})` },
                  { id: 'members', label: `Members (${formData.members.length})` },
                  { id: 'regions', label: `Regions (${formData.assignedRegions.length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6 max-h-96 overflow-y-auto px-1">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4 px-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="e.g., Field Engineers - Maharashtra"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="Brief description of the group's purpose"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Active (members inherit permissions)
                    </label>
                  </div>
                </div>
              )}

              {/* Permissions Tab */}
              {activeTab === 'permissions' && (
                <div className="space-y-6 px-4">
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
                          {perms.every(p => formData.permissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id={perm.id}
                                type="checkbox"
                                checked={formData.permissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor={perm.id} className="font-medium text-gray-700 dark:text-gray-300">
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
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-2 px-4">
                  {availableUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No users available. Create users in User Management first.
                    </p>
                  ) : (
                    availableUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <div className="flex items-center">
                          <input
                            id={`user-${user.id}`}
                            type="checkbox"
                            checked={formData.members.includes(user.id)}
                            onChange={() => toggleMember(user.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`user-${user.id}`} className="ml-3">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email} • {user.role}
                            </div>
                          </label>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {user.assignedRegions.join(', ') || 'No regions'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Regions Tab */}
              {activeTab === 'regions' && (
                <div className="grid grid-cols-2 gap-2 px-4">
                  {INDIAN_STATES.map((state) => (
                    <div key={state} className="flex items-center">
                      <input
                        id={`state-${state}`}
                        type="checkbox"
                        checked={formData.assignedRegions.includes(state)}
                        onChange={() => toggleRegion(state)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`state-${state}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        {state}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {group ? 'Update Group' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupForm;
