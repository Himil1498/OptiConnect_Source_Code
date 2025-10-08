/**
 * Groups List Component
 * Displays list of user groups with actions and selection
 */

import React from 'react';
import type { UserGroup } from '../../types/permissions.types';

interface GroupsListProps {
  groups: UserGroup[];
  selectedGroups?: string[];
  onSelectGroup?: (groupId: string) => void;
  onSelectAll?: () => void;
  onEdit?: (group: UserGroup) => void;
  onDelete?: (groupId: string) => void;
  onView?: (group: UserGroup) => void;
}

const GroupsList: React.FC<GroupsListProps> = ({
  groups,
  selectedGroups = [],
  onSelectGroup,
  onSelectAll,
  onEdit,
  onDelete,
  onView
}) => {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No groups found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new group.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl overflow-hidden rounded-xl border-2 border-amber-100 dark:border-amber-900/30">
      <ul className="divide-y divide-amber-100 dark:divide-amber-900/20">
        {/* Header with Select All */}
        {onSelectGroup && (
          <li className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10">
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedGroups.length === groups.length && groups.length > 0}
                  onChange={onSelectAll}
                  className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                />
                <span className="ml-3 text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Select All Groups
                </span>
              </div>
            </div>
          </li>
        )}

        {groups.map((group) => (
          <li key={group.id}>
            <div className="px-4 py-4 sm:px-6 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  {/* Selection Checkbox */}
                  {onSelectGroup && (
                    <div className="mr-4">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => onSelectGroup(group.id)}
                        className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-amber-800 dark:text-amber-200">
                          {group.name}
                        </h3>
                        {!group.isActive && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {group.description}
                    </p>

                    <div className="mt-3 flex items-center space-x-4 text-sm">
                      <div className="flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <svg
                          className="flex-shrink-0 mr-1.5 h-4 w-4 text-blue-600 dark:text-blue-400"
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
                        <span className="font-semibold text-blue-700 dark:text-blue-300">{group.members.length} members</span>
                      </div>

                      <div className="flex items-center px-3 py-1 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                        <svg
                          className="flex-shrink-0 mr-1.5 h-4 w-4 text-violet-600 dark:text-violet-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span className="font-semibold text-violet-700 dark:text-violet-300">{group.permissions.length} permissions</span>
                      </div>

                      {group.assignedRegions.length > 0 && (
                        <div className="flex items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">{group.assignedRegions.length} regions</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0 flex space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(group)}
                      className="inline-flex items-center px-3 py-2 rounded-lg shadow-sm text-sm font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-2 border-blue-200 dark:border-blue-700 transition-all duration-200"
                      title="View Details"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View
                    </button>
                  )}

                  {onEdit && (
                    <button
                      onClick={() => onEdit(group)}
                      className="inline-flex items-center px-3 py-2 rounded-lg shadow-sm text-sm font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-2 border-amber-200 dark:border-amber-700 transition-all duration-200"
                      title="Edit Group"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  )}

                  {onDelete && (
                    <button
                      onClick={() => onDelete(group.id)}
                      className="inline-flex items-center px-3 py-2 rounded-lg shadow-sm text-sm font-semibold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 border-2 border-red-200 dark:border-red-700 transition-all duration-200"
                      title="Delete Group"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupsList;
