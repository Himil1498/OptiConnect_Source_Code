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
    const loadUsers = async () => {
      try {
        const users = await getAllUsers();
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
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
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onCancel} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {group ? 'Edit Group' : 'Create New Group'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'basic', label: 'Basic Info', icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )},
                  { id: 'permissions', label: `Permissions (${formData.permissions.length})`, icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )},
                  { id: 'members', label: `Members (${formData.members.length})`, icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )},
                  { id: 'regions', label: `Regions (${formData.assignedRegions.length})`, icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm inline-flex items-center gap-2`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6 max-h-96 overflow-y-auto px-1">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6 px-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                        placeholder="e.g., Field Engineers - Maharashtra"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="block w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                        placeholder="Brief description of the group's purpose and responsibilities"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Provide a clear description to help users understand the group's role
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mt-0.5"
                      />
                      <div className="ml-3">
                        <label htmlFor="isActive" className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Active Group
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          When active, members inherit all permissions assigned to this group
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Permissions Tab */}
              {activeTab === 'permissions' && (
                <div className="space-y-6 px-4">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          {category}
                        </h4>
                        <button
                          type="button"
                          onClick={() => selectAllPermissionsInCategory(category as PermissionCategory)}
                          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 px-3 py-1 rounded-md border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          {perms.every(p => formData.permissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-start p-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800">
                            <div className="flex items-center h-5 mt-0.5">
                              <input
                                id={perm.id}
                                type="checkbox"
                                checked={formData.permissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <label htmlFor={perm.id} className="font-semibold text-sm text-gray-900 dark:text-white cursor-pointer block">
                                {perm.name}
                              </label>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{perm.description}</p>
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
                <div className="px-4">
                  {availableUsers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        No users available
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Create users in User Management first
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer">
                          <div className="flex items-center flex-1">
                            <input
                              id={`user-${user.id}`}
                              type="checkbox"
                              checked={formData.members.includes(user.id)}
                              onChange={() => toggleMember(user.id)}
                              className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`user-${user.id}`} className="ml-4 flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {user.name}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {user.email}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                                    {user.role}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {user.assignedRegions.length > 0 ? `${user.assignedRegions.length} regions` : 'No regions'}
                                  </span>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Regions Tab */}
              {activeTab === 'regions' && (
                <div className="px-4">
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                          Select Indian States & Union Territories
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          Choose the regions this group will have access to ({formData.assignedRegions.length} selected)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {INDIAN_STATES.map((state) => (
                      <div key={state} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer">
                        <input
                          id={`state-${state}`}
                          type="checkbox"
                          checked={formData.assignedRegions.includes(state)}
                          onChange={() => toggleRegion(state)}
                          className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`state-${state}`} className="ml-3 block text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1">
                          {state}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
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
