/**
 * User Groups Management Page
 * Create, edit, and manage user groups with permissions
 */

import React, { useState, useEffect } from 'react';
import PageContainer from '../components/common/PageContainer';
import { usePermission } from '../hooks/usePermission';
import { useAppSelector } from '../store';
import type { UserGroup } from '../types/permissions.types';
import {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  initializeSampleGroups
} from '../services/groupService';
import GroupsList from '../components/groups/GroupsList';
import GroupForm from '../components/groups/GroupForm';
import GroupDetailsDialog from '../components/groups/GroupDetailsDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import NotificationDialog from '../components/common/NotificationDialog';

const GroupsManagement: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { can, isAdmin } = usePermission();

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [viewingGroup, setViewingGroup] = useState<UserGroup | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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

  // Load groups on mount
  useEffect(() => {
    loadGroups();

    // Initialize sample groups for admin on first load
    if (isAdmin && user) {
      const existingGroups = getAllGroups();
      if (existingGroups.length === 0) {
        initializeSampleGroups(user.id);
        loadGroups();
      }
    }
  }, [isAdmin, user]);

  const loadGroups = () => {
    const allGroups = getAllGroups();
    setGroups(allGroups);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowForm(true);
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroups.length === groups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(groups.map(g => g.id));
    }
  };

  const handleBulkActivate = () => {
    selectedGroups.forEach(groupId => {
      updateGroup(groupId, { isActive: true });
    });
    setNotification({
      isOpen: true,
      type: 'success',
      title: 'Success',
      message: `${selectedGroups.length} group(s) activated`
    });
    loadGroups();
    setSelectedGroups([]);
  };

  const handleBulkDeactivate = () => {
    selectedGroups.forEach(groupId => {
      updateGroup(groupId, { isActive: false });
    });
    setNotification({
      isOpen: true,
      type: 'success',
      title: 'Success',
      message: `${selectedGroups.length} group(s) deactivated`
    });
    loadGroups();
    setSelectedGroups([]);
  };

  const handleViewGroup = (group: UserGroup) => {
    setViewingGroup(group);
  };

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    setDeleteConfirm(groupId);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;

    const success = deleteGroup(deleteConfirm);

    if (success) {
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Group deleted successfully'
      });
      loadGroups();
    } else {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete group'
      });
    }

    setDeleteConfirm(null);
  };

  const handleSaveGroup = (groupData: Partial<UserGroup>) => {
    if (!user) return;

    try {
      if (editingGroup) {
        // Update existing group
        const updated = updateGroup(editingGroup.id, groupData);
        if (updated) {
          setNotification({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Group updated successfully'
          });
        }
      } else {
        // Create new group
        createGroup({
          name: groupData.name || '',
          description: groupData.description || '',
          permissions: groupData.permissions || [],
          assignedRegions: groupData.assignedRegions || [],
          members: groupData.members || [],
          managers: groupData.managers || [user.id],
          isActive: groupData.isActive !== undefined ? groupData.isActive : true,
          createdBy: user.id
        });

        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Group created successfully'
        });
      }

      setShowForm(false);
      setEditingGroup(null);
      loadGroups();
    } catch (error) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to save group'
      });
    }
  };

  // Check permission to manage groups
  if (!can('groups.view')) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96 ">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Access Denied
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You don't have permission to view user groups.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
                User Groups
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
                Manage user groups and permissions
              </p>
            </div>
          </div>

          {can("groups.create") && (
            <button
              onClick={handleCreateGroup}
              className="inline-flex items-center px-5 py-2.5 shadow-lg hover:shadow-xl text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Group
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 overflow-hidden shadow-lg hover:shadow-xl rounded-xl border-2 border-amber-200 dark:border-amber-700 transition-all duration-200 transform hover:-translate-y-1">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-amber-700 dark:text-amber-300 truncate mb-2">
                    Total Groups
                  </dt>
                  <dd className="text-3xl font-bold text-amber-800 dark:text-amber-200">
                    {groups.length}
                  </dd>
                </div>
                <div className="flex-shrink-0">
                  <svg
                    className="h-10 w-10 text-amber-600 dark:text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 overflow-hidden shadow-lg hover:shadow-xl rounded-xl border-2 border-emerald-200 dark:border-emerald-700 transition-all duration-200 transform hover:-translate-y-1">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 truncate mb-2">
                    Active Groups
                  </dt>
                  <dd className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                    {groups.filter((g) => g.isActive).length}
                  </dd>
                </div>
                <div className="flex-shrink-0">
                  <svg
                    className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 overflow-hidden shadow-lg hover:shadow-xl rounded-xl border-2 border-blue-200 dark:border-blue-700 transition-all duration-200 transform hover:-translate-y-1">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-blue-700 dark:text-blue-300 truncate mb-2">
                    Total Members
                  </dt>
                  <dd className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                    {groups.reduce((sum, g) => sum + g.members.length, 0)}
                  </dd>
                </div>
                <div className="flex-shrink-0">
                  <svg
                    className="h-10 w-10 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedGroups.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-amber-800 dark:text-amber-200">
                    {selectedGroups.length} group(s) selected
                  </span>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Choose a bulk action</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkActivate}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Activate
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Groups List */}
        <GroupsList
          groups={groups}
          selectedGroups={selectedGroups}
          onSelectGroup={handleSelectGroup}
          onSelectAll={handleSelectAllGroups}
          onView={handleViewGroup}
          onEdit={can("groups.edit") ? handleEditGroup : undefined}
          onDelete={can("groups.delete") ? handleDeleteGroup : undefined}
        />

        {/* Group Form Modal */}
        {showForm && (
          <GroupForm
            group={editingGroup}
            onSave={handleSaveGroup}
            onCancel={() => {
              setShowForm(false);
              setEditingGroup(null);
            }}
          />
        )}

        {/* Group Details Modal */}
        {viewingGroup && (
          <GroupDetailsDialog
            group={viewingGroup}
            onClose={() => setViewingGroup(null)}
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm !== null}
          title="Delete Group"
          message="Are you sure you want to delete this group? This action cannot be undone."
          confirmText="Delete"
          type="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteConfirm(null)}
        />

        {/* Notification */}
        <NotificationDialog
          isOpen={notification.isOpen}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ ...notification, isOpen: false })}
        />
      </div>
    </PageContainer>
  );
};

export default GroupsManagement;
