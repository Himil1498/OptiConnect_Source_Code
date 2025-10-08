import type { User } from '../types/auth.types';

/**
 * User Storage Utilities - LocalStorage Management
 * Handles user data persistence in development and production modes
 */

const STORAGE_KEYS = {
  USERS_LIST: 'opti_connect_users_list',
  CURRENT_USER: 'opti_connect_user',
  AUTH_TOKEN: 'opti_connect_token',
};

/**
 * Get all users from localStorage
 */
export const getUsersFromStorage = (): User[] => {
  try {
    const usersJson = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (!usersJson) return [];

    const users = JSON.parse(usersJson);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Error reading users from storage:', error);
    return [];
  }
};

/**
 * Save users to localStorage
 */
export const saveUsersToStorage = (users: User[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error saving users to storage:', error);
    return false;
  }
};

/**
 * Add a new user to storage
 */
export const addUserToStorage = (user: User): boolean => {
  try {
    const users = getUsersFromStorage();

    // Check for duplicate ID
    const existingUser = users.find(u => u.id === user.id);
    if (existingUser) {
      console.warn('User with this ID already exists');
      return false;
    }

    users.push(user);
    return saveUsersToStorage(users);
  } catch (error) {
    console.error('Error adding user to storage:', error);
    return false;
  }
};

/**
 * Update a user in storage
 */
export const updateUserInStorage = (userId: string, updates: Partial<User>): boolean => {
  try {
    const users = getUsersFromStorage();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      console.warn('User not found');
      return false;
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    return saveUsersToStorage(users);
  } catch (error) {
    console.error('Error updating user in storage:', error);
    return false;
  }
};

/**
 * Delete a user from storage
 */
export const deleteUserFromStorage = (userId: string): boolean => {
  try {
    const users = getUsersFromStorage();
    const filteredUsers = users.filter(u => u.id !== userId);

    if (users.length === filteredUsers.length) {
      console.warn('User not found');
      return false;
    }

    return saveUsersToStorage(filteredUsers);
  } catch (error) {
    console.error('Error deleting user from storage:', error);
    return false;
  }
};

/**
 * Get a user by ID from storage
 */
export const getUserFromStorage = (userId: string): User | null => {
  try {
    const users = getUsersFromStorage();
    return users.find(u => u.id === userId) || null;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return null;
  }
};

/**
 * Get a user by email from storage
 */
export const getUserByEmailFromStorage = (email: string): User | null => {
  try {
    const users = getUsersFromStorage();
    return users.find(u => u.email === email) || null;
  } catch (error) {
    console.error('Error getting user by email from storage:', error);
    return null;
  }
};

/**
 * Get a user by username from storage
 */
export const getUserByUsernameFromStorage = (username: string): User | null => {
  try {
    const users = getUsersFromStorage();
    return users.find(u => u.username === username) || null;
  } catch (error) {
    console.error('Error getting user by username from storage:', error);
    return null;
  }
};

/**
 * Bulk update users in storage
 */
export const bulkUpdateUsersInStorage = (userIds: string[], updates: Partial<User>): boolean => {
  try {
    const users = getUsersFromStorage();
    const updatedUsers = users.map(user =>
      userIds.includes(user.id) ? { ...user, ...updates } : user
    );

    return saveUsersToStorage(updatedUsers);
  } catch (error) {
    console.error('Error bulk updating users in storage:', error);
    return false;
  }
};

/**
 * Bulk delete users from storage
 */
export const bulkDeleteUsersFromStorage = (userIds: string[]): boolean => {
  try {
    const users = getUsersFromStorage();
    const filteredUsers = users.filter(u => !userIds.includes(u.id));

    return saveUsersToStorage(filteredUsers);
  } catch (error) {
    console.error('Error bulk deleting users from storage:', error);
    return false;
  }
};

/**
 * Clear all users from storage (use with caution)
 */
export const clearUsersFromStorage = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USERS_LIST);
    return true;
  } catch (error) {
    console.error('Error clearing users from storage:', error);
    return false;
  }
};

/**
 * Initialize storage with default users if empty
 */
export const initializeUsersStorage = (defaultUsers: User[]): boolean => {
  try {
    const existingUsers = getUsersFromStorage();

    if (existingUsers.length === 0) {
      return saveUsersToStorage(defaultUsers);
    }

    return true;
  } catch (error) {
    console.error('Error initializing users storage:', error);
    return false;
  }
};

/**
 * Get storage statistics
 */
export const getStorageStats = () => {
  const users = getUsersFromStorage();

  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'Active').length,
    inactiveUsers: users.filter(u => u.status === 'Inactive').length,
    adminCount: users.filter(u => u.role === 'Admin').length,
    managerCount: users.filter(u => u.role === 'Manager').length,
    technicianCount: users.filter(u => u.role === 'Technician').length,
    userCount: users.filter(u => u.role === 'User').length,
    storageSize: new Blob([JSON.stringify(users)]).size,
  };
};

/**
 * Export users data as JSON string
 */
export const exportUsersFromStorage = (): string => {
  const users = getUsersFromStorage();
  return JSON.stringify(users, null, 2);
};

/**
 * Import users data from JSON string
 */
export const importUsersToStorage = (jsonString: string, merge: boolean = false): boolean => {
  try {
    const importedUsers = JSON.parse(jsonString);

    if (!Array.isArray(importedUsers)) {
      console.error('Invalid data format: expected an array of users');
      return false;
    }

    if (merge) {
      const existingUsers = getUsersFromStorage();
      const mergedUsers = [...existingUsers];

      importedUsers.forEach((importedUser: User) => {
        const existingIndex = mergedUsers.findIndex(u => u.id === importedUser.id);
        if (existingIndex !== -1) {
          mergedUsers[existingIndex] = importedUser;
        } else {
          mergedUsers.push(importedUser);
        }
      });

      return saveUsersToStorage(mergedUsers);
    } else {
      return saveUsersToStorage(importedUsers);
    }
  } catch (error) {
    console.error('Error importing users to storage:', error);
    return false;
  }
};

/**
 * Validate user credentials for login
 */
export const validateUserCredentials = (email: string, password: string): User | null => {
  try {
    const users = getUsersFromStorage();
    const user = users.find(u => u.email === email);

    if (!user) {
      return null;
    }

    // In development, accept any password
    // In production, this would validate against hashed password
    if (process.env.NODE_ENV === 'development' || user.password === password) {
      // Update login history
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString(),
        loginHistory: [
          ...(user.loginHistory || []),
          {
            timestamp: new Date(),
            location: 'Web Application'
          }
        ]
      };

      updateUserInStorage(user.id, {
        lastLogin: updatedUser.lastLogin,
        loginHistory: updatedUser.loginHistory
      });

      return updatedUser;
    }

    return null;
  } catch (error) {
    console.error('Error validating credentials:', error);
    return null;
  }
};