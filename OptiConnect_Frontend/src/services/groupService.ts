/**
 * User Group Service
 * Handles CRUD operations for user groups (localStorage-based)
 */

import type { UserGroup } from '../types/permissions.types';

const STORAGE_KEY = 'user_groups';

/**
 * Get all user groups
 */
export function getAllGroups(): UserGroup[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const groups = JSON.parse(stored);

    // Convert date strings back to Date objects
    return groups.map((group: any) => ({
      ...group,
      createdAt: new Date(group.createdAt),
      updatedAt: new Date(group.updatedAt)
    }));
  } catch (error) {
    console.error('Failed to load groups:', error);
    return [];
  }
}

/**
 * Get a single group by ID
 */
export function getGroupById(id: string): UserGroup | null {
  const groups = getAllGroups();
  return groups.find(g => g.id === id) || null;
}

/**
 * Create a new group
 */
export function createGroup(
  groupData: Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'>
): UserGroup {
  const groups = getAllGroups();

  const newGroup: UserGroup = {
    ...groupData,
    id: `group_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  groups.push(newGroup);
  saveGroups(groups);

  return newGroup;
}

/**
 * Update an existing group
 */
export function updateGroup(
  id: string,
  updates: Partial<Omit<UserGroup, 'id' | 'createdAt' | 'createdBy'>>
): UserGroup | null {
  const groups = getAllGroups();
  const index = groups.findIndex(g => g.id === id);

  if (index === -1) {
    console.error('Group not found:', id);
    return null;
  }

  groups[index] = {
    ...groups[index],
    ...updates,
    id: groups[index].id, // Preserve ID
    createdAt: groups[index].createdAt, // Preserve creation date
    createdBy: groups[index].createdBy, // Preserve creator
    updatedAt: new Date()
  };

  saveGroups(groups);
  return groups[index];
}

/**
 * Delete a group
 */
export function deleteGroup(id: string): boolean {
  const groups = getAllGroups();
  const filteredGroups = groups.filter(g => g.id !== id);

  if (filteredGroups.length === groups.length) {
    console.error('Group not found:', id);
    return false;
  }

  saveGroups(filteredGroups);
  return true;
}

/**
 * Add a member to a group
 */
export function addMemberToGroup(groupId: string, userId: string): boolean {
  const group = getGroupById(groupId);
  if (!group) return false;

  if (group.members.includes(userId)) {
    return true; // Already a member
  }

  return updateGroup(groupId, {
    members: [...group.members, userId]
  }) !== null;
}

/**
 * Remove a member from a group
 */
export function removeMemberFromGroup(groupId: string, userId: string): boolean {
  const group = getGroupById(groupId);
  if (!group) return false;

  return updateGroup(groupId, {
    members: group.members.filter(id => id !== userId)
  }) !== null;
}

/**
 * Add permissions to a group
 */
export function addPermissionsToGroup(
  groupId: string,
  permissions: string[]
): boolean {
  const group = getGroupById(groupId);
  if (!group) return false;

  const uniquePermissions = Array.from(
    new Set([...group.permissions, ...permissions])
  );

  return updateGroup(groupId, {
    permissions: uniquePermissions
  }) !== null;
}

/**
 * Remove permissions from a group
 */
export function removePermissionsFromGroup(
  groupId: string,
  permissions: string[]
): boolean {
  const group = getGroupById(groupId);
  if (!group) return false;

  return updateGroup(groupId, {
    permissions: group.permissions.filter(p => !permissions.includes(p))
  }) !== null;
}

/**
 * Get groups by member user ID
 */
export function getGroupsByMember(userId: string): UserGroup[] {
  const groups = getAllGroups();
  return groups.filter(g => g.members.includes(userId));
}

/**
 * Get groups by manager user ID
 */
export function getGroupsByManager(userId: string): UserGroup[] {
  const groups = getAllGroups();
  return groups.filter(g => g.managers.includes(userId));
}

/**
 * Check if user is a member of a group
 */
export function isGroupMember(groupId: string, userId: string): boolean {
  const group = getGroupById(groupId);
  return group ? group.members.includes(userId) : false;
}

/**
 * Check if user is a manager of a group
 */
export function isGroupManager(groupId: string, userId: string): boolean {
  const group = getGroupById(groupId);
  return group ? group.managers.includes(userId) : false;
}

/**
 * Assign regions to a group
 */
export function assignRegionsToGroup(
  groupId: string,
  regions: string[]
): boolean {
  return updateGroup(groupId, {
    assignedRegions: regions
  }) !== null;
}

/**
 * Get member count for a group
 */
export function getGroupMemberCount(groupId: string): number {
  const group = getGroupById(groupId);
  return group ? group.members.length : 0;
}

/**
 * Search groups by name or description
 */
export function searchGroups(query: string): UserGroup[] {
  const groups = getAllGroups();
  const lowercaseQuery = query.toLowerCase();

  return groups.filter(
    g =>
      g.name.toLowerCase().includes(lowercaseQuery) ||
      g.description.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Initialize with sample groups (for development)
 */
export function initializeSampleGroups(currentUserId: string): void {
  const existing = getAllGroups();
  if (existing.length > 0) {
    return; // Already initialized
  }

  const sampleGroups: Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Field Engineers - Maharashtra',
      description: 'Field engineers working in Maharashtra region',
      permissions: [
        'gis.distance.use',
        'gis.distance.save',
        'gis.polygon.use',
        'gis.polygon.save',
        'gis.circle.use',
        'gis.circle.save',
        'gis.elevation.use',
        'gis.elevation.save',
        'data.view.own',
        'data.edit.own',
        'search.use'
      ],
      assignedRegions: ['Maharashtra'],
      members: [],
      managers: [currentUserId],
      isActive: true,
      createdBy: currentUserId
    },
    {
      name: 'Data Analysts',
      description: 'Analysts with view and export permissions',
      permissions: [
        'data.view.all',
        'data.export',
        'search.use',
        'search.history.view'
      ],
      assignedRegions: [],
      members: [],
      managers: [currentUserId],
      isActive: true,
      createdBy: currentUserId
    },
    {
      name: 'Infrastructure Team',
      description: 'Team managing infrastructure assets',
      permissions: [
        'gis.infrastructure.use',
        'gis.infrastructure.save',
        'gis.infrastructure.delete.own',
        'gis.infrastructure.import',
        'data.view.own',
        'data.edit.own',
        'search.use'
      ],
      assignedRegions: [],
      members: [],
      managers: [currentUserId],
      isActive: true,
      createdBy: currentUserId
    }
  ];

  sampleGroups.forEach(groupData => createGroup(groupData));
}

/**
 * Save groups to localStorage (internal helper)
 */
function saveGroups(groups: UserGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error('Failed to save groups:', error);
    throw error;
  }
}
