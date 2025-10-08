// Region Hierarchy Service - for managing region zones

import type { RegionZone, ZoneAssignment } from '../types/regionHierarchy.types';
import type { User } from '../types/auth.types';
import { logAuditEvent } from './auditService';

const ZONES_STORAGE_KEY = 'gis_region_zones';
const ZONE_ASSIGNMENTS_STORAGE_KEY = 'gis_zone_assignments';

// Default zones for Indian states
export const DEFAULT_ZONES: Omit<RegionZone, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'North Zone',
    description: 'Northern states and UTs',
    color: '#3B82F6', // Blue
    states: [
      'Punjab',
      'Haryana',
      'Delhi',
      'Himachal Pradesh',
      'Uttarakhand',
      'Chandigarh',
      'Jammu and Kashmir',
      'Ladakh'
    ]
  },
  {
    name: 'South Zone',
    description: 'Southern states and UTs',
    color: '#10B981', // Green
    states: [
      'Karnataka',
      'Tamil Nadu',
      'Kerala',
      'Andhra Pradesh',
      'Telangana',
      'Puducherry',
      'Lakshadweep',
      'Andaman and Nicobar Islands'
    ]
  },
  {
    name: 'East Zone',
    description: 'Eastern states and UTs',
    color: '#F59E0B', // Orange
    states: [
      'West Bengal',
      'Bihar',
      'Jharkhand',
      'Odisha',
      'Assam',
      'Arunachal Pradesh',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Sikkim',
      'Tripura'
    ]
  },
  {
    name: 'West Zone',
    description: 'Western states and UTs',
    color: '#EF4444', // Red
    states: [
      'Maharashtra',
      'Gujarat',
      'Goa',
      'Rajasthan',
      'Dadra and Nagar Haveli and Daman and Diu'
    ]
  },
  {
    name: 'Central Zone',
    description: 'Central states',
    color: '#8B5CF6', // Purple
    states: [
      'Madhya Pradesh',
      'Chhattisgarh',
      'Uttar Pradesh'
    ]
  }
];

/**
 * Initialize default zones if not exists
 */
export const initializeDefaultZones = (user: User): void => {
  const existing = getRegionZones();
  if (existing.length === 0) {
    DEFAULT_ZONES.forEach(zone => {
      createRegionZone(zone.name, zone.description, zone.states, zone.color, user);
    });
  }
};

/**
 * Get all region zones
 */
export const getRegionZones = (): RegionZone[] => {
  try {
    const data = localStorage.getItem(ZONES_STORAGE_KEY);
    if (!data) return [];

    const zones = JSON.parse(data);
    return zones.map((zone: any) => ({
      ...zone,
      createdAt: new Date(zone.createdAt),
      updatedAt: new Date(zone.updatedAt)
    }));
  } catch (error) {
    console.error('Failed to load region zones:', error);
    return [];
  }
};

/**
 * Create a new region zone
 */
export const createRegionZone = (
  name: string,
  description: string,
  states: string[],
  color: string,
  createdBy: User
): RegionZone => {
  const zone: RegionZone = {
    id: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    states,
    color,
    createdBy: createdBy.id,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const zones = getRegionZones();
  zones.push(zone);
  saveZones(zones);

  logAuditEvent(createdBy, 'REGION_ASSIGNED', `Created region zone: ${name}`, {
    severity: 'info',
    details: { zoneId: zone.id, states, color },
    success: true
  });

  return zone;
};

/**
 * Update a region zone
 */
export const updateRegionZone = (
  zoneId: string,
  updates: Partial<Pick<RegionZone, 'name' | 'description' | 'states' | 'color'>>,
  updatedBy: User
): RegionZone | null => {
  const zones = getRegionZones();
  const zone = zones.find(z => z.id === zoneId);

  if (!zone) return null;

  Object.assign(zone, updates, { updatedAt: new Date() });
  saveZones(zones);

  logAuditEvent(updatedBy, 'REGION_ASSIGNED', `Updated region zone: ${zone.name}`, {
    severity: 'info',
    details: { zoneId, updates },
    success: true
  });

  return zone;
};

/**
 * Delete a region zone
 */
export const deleteRegionZone = (zoneId: string, deletedBy: User): boolean => {
  const zones = getRegionZones();
  const index = zones.findIndex(z => z.id === zoneId);

  if (index === -1) return false;

  const zone = zones[index];
  zones.splice(index, 1);
  saveZones(zones);

  // Also remove zone assignments
  const assignments = getZoneAssignments();
  const updatedAssignments = assignments.filter(a => !a.zoneIds.includes(zoneId));
  saveZoneAssignments(updatedAssignments);

  logAuditEvent(deletedBy, 'REGION_REVOKED', `Deleted region zone: ${zone.name}`, {
    severity: 'warning',
    details: { zoneId },
    success: true
  });

  return true;
};

/**
 * Get zone by ID
 */
export const getZoneById = (zoneId: string): RegionZone | null => {
  const zones = getRegionZones();
  return zones.find(z => z.id === zoneId) || null;
};

/**
 * Get all states from assigned zones for a user
 */
export const getStatesFromUserZones = (userId: string): string[] => {
  const assignments = getZoneAssignments().filter(a => a.userId === userId);
  const zones = getRegionZones();

  const states = new Set<string>();
  assignments.forEach(assignment => {
    assignment.zoneIds.forEach(zoneId => {
      const zone = zones.find(z => z.id === zoneId);
      if (zone) {
        zone.states.forEach(state => states.add(state));
      }
    });
  });

  return Array.from(states);
};

/**
 * Assign zones to a user
 */
export const assignZonesToUser = (
  user: User,
  zoneIds: string[],
  assignedBy: User
): ZoneAssignment => {
  const assignments = getZoneAssignments();

  // Remove existing assignment for this user
  const filtered = assignments.filter(a => a.userId !== user.id);

  const assignment: ZoneAssignment = {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    zoneIds,
    assignedBy: assignedBy.id,
    assignedByName: assignedBy.name,
    assignedAt: new Date()
  };

  filtered.push(assignment);
  saveZoneAssignments(filtered);

  const zones = getRegionZones();
  const zoneNames = zoneIds.map(id => zones.find(z => z.id === id)?.name || id).join(', ');

  logAuditEvent(assignedBy, 'REGION_ASSIGNED', `Assigned zones to ${user.name}: ${zoneNames}`, {
    severity: 'info',
    details: { userId: user.id, zoneIds, zoneNames },
    success: true
  });

  return assignment;
};

/**
 * Get zone assignments
 */
export const getZoneAssignments = (): ZoneAssignment[] => {
  try {
    const data = localStorage.getItem(ZONE_ASSIGNMENTS_STORAGE_KEY);
    if (!data) return [];

    const assignments = JSON.parse(data);
    return assignments.map((assignment: any) => ({
      ...assignment,
      assignedAt: new Date(assignment.assignedAt)
    }));
  } catch (error) {
    console.error('Failed to load zone assignments:', error);
    return [];
  }
};

/**
 * Get user's zone assignment
 */
export const getUserZoneAssignment = (userId: string): ZoneAssignment | null => {
  const assignments = getZoneAssignments();
  return assignments.find(a => a.userId === userId) || null;
};

/**
 * Remove zone assignment from user
 */
export const removeZoneAssignment = (userId: string, removedBy: User): boolean => {
  const assignments = getZoneAssignments();
  const filtered = assignments.filter(a => a.userId !== userId);

  if (filtered.length === assignments.length) {
    return false; // No assignment found
  }

  saveZoneAssignments(filtered);

  logAuditEvent(removedBy, 'REGION_REVOKED', `Removed zone assignment from user`, {
    severity: 'warning',
    details: { userId },
    success: true
  });

  return true;
};

/**
 * Save zones to localStorage
 */
const saveZones = (zones: RegionZone[]): void => {
  try {
    localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones));
  } catch (error) {
    console.error('Failed to save region zones:', error);
  }
};

/**
 * Save zone assignments to localStorage
 */
const saveZoneAssignments = (assignments: ZoneAssignment[]): void => {
  try {
    localStorage.setItem(ZONE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error('Failed to save zone assignments:', error);
  }
};

/**
 * Get zone statistics
 */
export const getZoneStats = (): {
  totalZones: number;
  totalStates: number;
  zonesByStateCount: Array<{ zone: RegionZone; stateCount: number }>;
  assignmentCount: number;
} => {
  const zones = getRegionZones();
  const assignments = getZoneAssignments();

  const allStates = new Set<string>();
  zones.forEach(zone => {
    zone.states.forEach(state => allStates.add(state));
  });

  const zonesByStateCount = zones
    .map(zone => ({ zone, stateCount: zone.states.length }))
    .sort((a, b) => b.stateCount - a.stateCount);

  return {
    totalZones: zones.length,
    totalStates: allStates.size,
    zonesByStateCount,
    assignmentCount: assignments.length
  };
};
