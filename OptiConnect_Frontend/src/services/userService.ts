/**
 * User Service
 * Handles user CRUD operations (localStorage-based for now)
 */

import type { User } from '../types/auth.types';

const STORAGE_KEY = 'users';

/**
 * Get all users
 */
export function getAllUsers(): User[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const users = JSON.parse(stored);

    // Convert date strings back to Date objects
    return users.map((user: any) => ({
      ...user,
      loginHistory: user.loginHistory?.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })) || []
    }));
  } catch (error) {
    console.error('Failed to load users:', error);
    return [];
  }
}

/**
 * Get a single user by ID
 */
export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

/**
 * Save users to localStorage
 */
export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users:', error);
    throw error;
  }
}
