/**
 * User Permissions Dialog Component
 * Manage direct permissions for individual users
 */

import React, { useState } from "react";
import type { User } from "../../types/auth.types";
import {
  SYSTEM_PERMISSIONS,
  PermissionCategory
} from "../../types/permissions.types";

interface UserPermissionsDialogProps {
  user: User;
  onSave: (userId: string, permissions: string[]) => void;
  onClose: () => void;
}

interface CategoryStyles {
  icon: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  hoverLight: string;
  hoverDark: string;
  selectedBg: string;
  selectedBorder: string;
  checkboxColor: string;
  buttonBg: string;
  buttonHover: string;
  buttonSelectedBg: string;
  buttonSelectedHover: string;
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
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllPermissionsInCategory = (category: PermissionCategory) => {
    const categoryPermissions = SYSTEM_PERMISSIONS.filter(
      (p) => p.category === category
    ).map((p) => p.id);

    const allSelected = categoryPermissions.every((p) =>
      selectedPermissions.includes(p)
    );

    if (allSelected) {
      // Deselect all
      setSelectedPermissions((prev) =>
        prev.filter((p) => !categoryPermissions.includes(p))
      );
    } else {
      // Select all
      setSelectedPermissions((prev) =>
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

  const getCategoryIcon = (category: PermissionCategory): string => {
    const icons: Record<PermissionCategory, string> = {
      [PermissionCategory.GIS_TOOLS]:
        "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
      [PermissionCategory.DATA_MANAGEMENT]:
        "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
      [PermissionCategory.USER_MANAGEMENT]:
        "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      [PermissionCategory.GROUP_MANAGEMENT]:
        "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      [PermissionCategory.SETTINGS]:
        "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      [PermissionCategory.SEARCH]: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    };
    return icons[category];
  };

  const getCategoryStyles = (category: PermissionCategory): CategoryStyles => {
    const styles: Record<PermissionCategory, CategoryStyles> = {
      [PermissionCategory.GIS_TOOLS]: {
        icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
        bgLight: "bg-orange-50",
        bgDark: "dark:bg-orange-900/20",
        borderLight: "border-orange-500",
        borderDark: "dark:border-orange-500",
        textLight: "text-orange-600",
        textDark: "dark:text-orange-400",
        hoverLight: "hover:bg-orange-100",
        hoverDark: "dark:hover:bg-orange-900/30",
        selectedBg: "bg-orange-100 dark:bg-orange-900/30",
        selectedBorder: "border-orange-300 dark:border-orange-700",
        checkboxColor: "text-orange-600 focus:ring-orange-500",
        buttonBg: "bg-orange-100 dark:bg-orange-900/40",
        buttonHover: "hover:bg-orange-200 dark:hover:bg-orange-900/60",
        buttonSelectedBg: "bg-orange-600",
        buttonSelectedHover: "hover:bg-orange-700"
      },
      [PermissionCategory.DATA_MANAGEMENT]: {
        icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
        bgLight: "bg-green-50",
        bgDark: "dark:bg-green-900/20",
        borderLight: "border-green-500",
        borderDark: "dark:border-green-500",
        textLight: "text-green-600",
        textDark: "dark:text-green-400",
        hoverLight: "hover:bg-green-100",
        hoverDark: "dark:hover:bg-green-900/30",
        selectedBg: "bg-green-100 dark:bg-green-900/30",
        selectedBorder: "border-green-300 dark:border-green-700",
        checkboxColor: "text-green-600 focus:ring-green-500",
        buttonBg: "bg-green-100 dark:bg-green-900/40",
        buttonHover: "hover:bg-green-200 dark:hover:bg-green-900/60",
        buttonSelectedBg: "bg-green-600",
        buttonSelectedHover: "hover:bg-green-700"
      },
      [PermissionCategory.USER_MANAGEMENT]: {
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
        bgLight: "bg-blue-50",
        bgDark: "dark:bg-blue-900/20",
        borderLight: "border-blue-500",
        borderDark: "dark:border-blue-500",
        textLight: "text-blue-600",
        textDark: "dark:text-blue-400",
        hoverLight: "hover:bg-blue-100",
        hoverDark: "dark:hover:bg-blue-900/30",
        selectedBg: "bg-blue-100 dark:bg-blue-900/30",
        selectedBorder: "border-blue-300 dark:border-blue-700",
        checkboxColor: "text-blue-600 focus:ring-blue-500",
        buttonBg: "bg-blue-100 dark:bg-blue-900/40",
        buttonHover: "hover:bg-blue-200 dark:hover:bg-blue-900/60",
        buttonSelectedBg: "bg-blue-600",
        buttonSelectedHover: "hover:bg-blue-700"
      },
      [PermissionCategory.GROUP_MANAGEMENT]: {
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        bgLight: "bg-indigo-50",
        bgDark: "dark:bg-indigo-900/20",
        borderLight: "border-indigo-500",
        borderDark: "dark:border-indigo-500",
        textLight: "text-indigo-600",
        textDark: "dark:text-indigo-400",
        hoverLight: "hover:bg-indigo-100",
        hoverDark: "dark:hover:bg-indigo-900/30",
        selectedBg: "bg-indigo-100 dark:bg-indigo-900/30",
        selectedBorder: "border-indigo-300 dark:border-indigo-700",
        checkboxColor: "text-indigo-600 focus:ring-indigo-500",
        buttonBg: "bg-indigo-100 dark:bg-indigo-900/40",
        buttonHover: "hover:bg-indigo-200 dark:hover:bg-indigo-900/60",
        buttonSelectedBg: "bg-indigo-600",
        buttonSelectedHover: "hover:bg-indigo-700"
      },
      [PermissionCategory.SETTINGS]: {
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
        bgLight: "bg-purple-50",
        bgDark: "dark:bg-purple-900/20",
        borderLight: "border-purple-500",
        borderDark: "dark:border-purple-500",
        textLight: "text-purple-600",
        textDark: "dark:text-purple-400",
        hoverLight: "hover:bg-purple-100",
        hoverDark: "dark:hover:bg-purple-900/30",
        selectedBg: "bg-purple-100 dark:bg-purple-900/30",
        selectedBorder: "border-purple-300 dark:border-purple-700",
        checkboxColor: "text-purple-600 focus:ring-purple-500",
        buttonBg: "bg-purple-100 dark:bg-purple-900/40",
        buttonHover: "hover:bg-purple-200 dark:hover:bg-purple-900/60",
        buttonSelectedBg: "bg-purple-600",
        buttonSelectedHover: "hover:bg-purple-700"
      },
      [PermissionCategory.SEARCH]: {
        icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
        bgLight: "bg-pink-50",
        bgDark: "dark:bg-pink-900/20",
        borderLight: "border-pink-500",
        borderDark: "dark:border-pink-500",
        textLight: "text-pink-600",
        textDark: "dark:text-pink-400",
        hoverLight: "hover:bg-pink-100",
        hoverDark: "dark:hover:bg-pink-900/30",
        selectedBg: "bg-pink-100 dark:bg-pink-900/30",
        selectedBorder: "border-pink-300 dark:border-pink-700",
        checkboxColor: "text-pink-600 focus:ring-pink-500",
        buttonBg: "bg-pink-100 dark:bg-pink-900/40",
        buttonHover: "hover:bg-pink-200 dark:hover:bg-pink-900/60",
        buttonSelectedBg: "bg-pink-600",
        buttonSelectedHover: "hover:bg-pink-700"
      }
    };
    return styles[category];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel - More compact */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl px-5 pt-4 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <svg
                    className="h-5 w-5 text-white"
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
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Permission Management
                  </h3>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {user.name}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {user.email}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        user.role === "Admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : user.role === "Manager"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedPermissions.length}
                    <span className="text-sm text-gray-500">
                      /{SYSTEM_PERMISSIONS.length}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Permissions Grid - Fixed Height Boxes with Scrollable Content */}
            <div className="px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Object.entries(permissionsByCategory).map(
                  ([category, perms]) => {
                    const styles = getCategoryStyles(
                      category as PermissionCategory
                    );
                    const allSelected = perms.every((p) =>
                      selectedPermissions.includes(p.id)
                    );
                    const someSelected =
                      perms.some((p) => selectedPermissions.includes(p.id)) &&
                      !allSelected;

                    return (
                      <div
                        key={category}
                        className={`border-2 rounded-lg transition-all hover:shadow-md flex flex-col h-[340px] overflow-hidden ${
                          allSelected
                            ? `${styles.borderLight} ${styles.borderDark} ${styles.bgLight} ${styles.bgDark}`
                            : someSelected
                            ? `border-gray-300 dark:border-gray-600 ${styles.bgLight} ${styles.bgDark}`
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        }`}
                      >
                        {/* Category Header - Fixed at top */}
                        <div className="flex items-center justify-between p-3 pb-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className={`p-1 rounded ${styles.buttonBg}`}>
                              <svg
                                className={`h-4 w-4 ${styles.textLight} ${styles.textDark}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={styles.icon}
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {category}
                              </h4>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {
                                  perms.filter((p) =>
                                    selectedPermissions.includes(p.id)
                                  ).length
                                }
                                /{perms.length}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              selectAllPermissionsInCategory(
                                category as PermissionCategory
                              )
                            }
                            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${
                              allSelected
                                ? `${styles.buttonSelectedBg} text-white ${styles.buttonSelectedHover}`
                                : `${styles.buttonBg} ${styles.textLight} ${styles.textDark} ${styles.buttonHover}`
                            }`}
                          >
                            {allSelected ? "Deselect" : "Select All"}
                          </button>
                        </div>

                        {/* Permissions in Category - Scrollable Content */}
                        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                          <div className="space-y-1.5 p-3 pt-2">
                            {perms.map((perm) => (
                              <label
                                key={perm.id}
                                htmlFor={`perm-${perm.id}`}
                                className={`flex items-start p-2 rounded-md cursor-pointer transition-all ${
                                  selectedPermissions.includes(perm.id)
                                    ? `${styles.selectedBg} border ${styles.selectedBorder}`
                                    : `bg-gray-50 dark:bg-gray-700/50 border border-transparent ${styles.hoverLight} ${styles.hoverDark}`
                                }`}
                              >
                                <div className="flex items-center h-4 mt-0.5">
                                  <input
                                    id={`perm-${perm.id}`}
                                    type="checkbox"
                                    checked={selectedPermissions.includes(
                                      perm.id
                                    )}
                                    onChange={() => togglePermission(perm.id)}
                                    className={`h-4 w-4 rounded border-gray-300 ${styles.checkboxColor} focus:ring-2 cursor-pointer transition-all`}
                                  />
                                </div>
                                <div className="ml-2 flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate pr-1">
                                      {perm.name}
                                    </span>
                                    {selectedPermissions.includes(perm.id) && (
                                      <svg
                                        className={`h-3.5 w-3.5 flex-shrink-0 ${styles.textLight} ${styles.textDark}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                    {perm.description}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Footer - Compact */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {selectedPermissions.length}
                </span>{" "}
                permission{selectedPermissions.length !== 1 ? "s" : ""} selected
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-transparent rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg"
                >
                  <span className="flex items-center space-x-1.5">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Save Permissions</span>
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsDialog;
