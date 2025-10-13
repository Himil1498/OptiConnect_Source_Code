// Region mapping utilities for highlighting assigned regions on map

import type { User } from '../types/auth.types';
import { logAuditEvent } from '../services/auditService';
import { hasTemporaryAccess, getMyActiveTemporaryAccess } from '../services/temporaryAccessService';

/**
 * Indian States/UTs with their map identifiers
 * Maps user-friendly names to GeoJSON property names
 */
export const INDIAN_STATES_MAP: Record<string, string> = {
  'Andhra Pradesh': 'Andhra Pradesh',
  'Arunachal Pradesh': 'Arunachal Pradesh',
  'Assam': 'Assam',
  'Bihar': 'Bihar',
  'Chhattisgarh': 'Chhattisgarh',
  'Goa': 'Goa',
  'Gujarat': 'Gujarat',
  'Haryana': 'Haryana',
  'Himachal Pradesh': 'Himachal Pradesh',
  'Jharkhand': 'Jharkhand',
  'Karnataka': 'Karnataka',
  'Kerala': 'Kerala',
  'Madhya Pradesh': 'Madhya Pradesh',
  'Maharashtra': 'Maharashtra',
  'Manipur': 'Manipur',
  'Meghalaya': 'Meghalaya',
  'Mizoram': 'Mizoram',
  'Nagaland': 'Nagaland',
  'Odisha': 'Odisha',
  'Punjab': 'Punjab',
  'Rajasthan': 'Rajasthan',
  'Sikkim': 'Sikkim',
  'Tamil Nadu': 'Tamil Nadu',
  'Telangana': 'Telangana',
  'Tripura': 'Tripura',
  'Uttar Pradesh': 'Uttar Pradesh',
  'Uttarakhand': 'Uttarakhand',
  'West Bengal': 'West Bengal',
  'Andaman and Nicobar Islands': 'Andaman and Nicobar',
  'Chandigarh': 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli',
  'Delhi': 'NCT of Delhi',
  'Jammu and Kashmir': 'Jammu and Kashmir',
  'Ladakh': 'Ladakh',
  'Lakshadweep': 'Lakshadweep',
  'Puducherry': 'Puducherry'
};

/**
 * All Indian States and Union Territories
 */
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

/**
 * Get assigned regions for a user (including active temporary access)
 */
export const getUserAssignedRegions = async (user: User | null): Promise<string[]> => {
  if (!user) return [];

  // Admin has access to all regions
  if (user.role === 'Admin') {
    return INDIAN_STATES;
  }

  // Get permanent regions
  const permanentRegions = user.assignedRegions || [];

  // Get active temporary access regions
  try {
    const tempAccess = await getMyActiveTemporaryAccess();
    // Filter expired ones (double-check on frontend)
    const now = new Date();
    const activeGrants = tempAccess.filter(grant => new Date(grant.expiresAt) > now);
    const tempRegions = activeGrants.map(grant => grant.region);

    // Combine permanent and temporary (remove duplicates)
    const allRegions = Array.from(new Set([...permanentRegions, ...tempRegions]));
    return allRegions;
  } catch (error) {
    console.error('Error fetching temporary access:', error);
    // Return just permanent regions if temporary access fetch fails
    return permanentRegions;
  }
};

/**
 * Get assigned regions for a user (synchronous version - only permanent)
 * Use this when you need immediate access without async
 */
export const getUserAssignedRegionsSync = (user: User | null): string[] => {
  if (!user) return [];

  // Admin has access to all regions
  if (user.role === 'Admin') {
    return INDIAN_STATES;
  }

  return user.assignedRegions || [];
};

/**
 * Check if user has access to a specific region
 */
export const hasRegionAccess = (user: User | null, region: string): boolean => {
  if (!user) return false;

  // Admin has access to all regions
  if (user.role === 'Admin') return true;

  return user.assignedRegions?.includes(region) || false;
};

/**
 * Get map style for a region based on user access
 */
export const getRegionStyle = (
  region: string,
  userRegions: string[],
  isHighlighted: boolean = false
): google.maps.Data.StyleOptions => {
  const isAssigned = userRegions.includes(region);

  if (isHighlighted && isAssigned) {
    // Highlighted assigned region
    return {
      fillColor: '#3B82F6', // Blue
      fillOpacity: 0.5,
      strokeColor: '#1E40AF',
      strokeWeight: 2,
      strokeOpacity: 1
    };
  } else if (isAssigned) {
    // Assigned region (not highlighted)
    return {
      fillColor: '#60A5FA', // Light blue
      fillOpacity: 0.3,
      strokeColor: '#3B82F6',
      strokeWeight: 1.5,
      strokeOpacity: 0.8
    };
  } else {
    // Non-assigned region (dimmed)
    return {
      fillColor: '#9CA3AF', // Gray
      fillOpacity: 0.1,
      strokeColor: '#D1D5DB',
      strokeWeight: 0.5,
      strokeOpacity: 0.3,
      visible: true // Make non-assigned regions barely visible
    };
  }
};

/**
 * Filter features based on user regions
 */
export const filterFeaturesByUserRegions = (
  features: any[],
  userRegions: string[]
): any[] => {
  // If user is admin (has all regions), return all features
  if (userRegions.length === INDIAN_STATES.length) {
    return features;
  }

  // Filter features to only show assigned regions
  return features.filter(feature => {
    const stateName = feature.properties?.NAME_1 ||
                     feature.properties?.ST_NM ||
                     feature.properties?.st_nm ||  // Lowercase variant
                     feature.properties?.name;

    if (!stateName) return false;

    // Check if this state is in user's assigned regions
    return userRegions.some(region => {
      const mappedRegion = INDIAN_STATES_MAP[region];
      return stateName.includes(mappedRegion) ||
             mappedRegion.includes(stateName) ||
             stateName === region;
    });
  });
};

/**
 * Get bounds for assigned regions
 */
export const getAssignedRegionsBounds = (
  assignedRegions: string[]
): google.maps.LatLngBounds | null => {
  // Approximate coordinates for major Indian states
  const stateCoordinates: Record<string, { lat: number; lng: number }> = {
    'Maharashtra': { lat: 19.7515, lng: 75.7139 },
    'Delhi': { lat: 28.7041, lng: 77.1025 },
    'Karnataka': { lat: 15.3173, lng: 75.7139 },
    'Tamil Nadu': { lat: 11.1271, lng: 78.6569 },
    'Gujarat': { lat: 22.2587, lng: 71.1924 },
    'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
    'Rajasthan': { lat: 27.0238, lng: 74.2179 },
    'West Bengal': { lat: 22.9868, lng: 87.8550 },
    'Telangana': { lat: 18.1124, lng: 79.0193 },
    'Kerala': { lat: 10.8505, lng: 76.2711 },
    'Punjab': { lat: 31.1471, lng: 75.3412 },
    'Haryana': { lat: 29.0588, lng: 76.0856 },
    'Bihar': { lat: 25.0961, lng: 85.3131 },
    'Andhra Pradesh': { lat: 15.9129, lng: 79.7400 },
    'Madhya Pradesh': { lat: 22.9734, lng: 78.6569 },
    'Assam': { lat: 26.2006, lng: 92.9376 },
    'Jharkhand': { lat: 23.6102, lng: 85.2799 },
    'Odisha': { lat: 20.9517, lng: 85.0985 },
    'Chhattisgarh': { lat: 21.2787, lng: 81.8661 },
  };

  if (assignedRegions.length === 0) return null;

  const bounds = new google.maps.LatLngBounds();

  assignedRegions.forEach(region => {
    const coords = stateCoordinates[region];
    if (coords) {
      bounds.extend(new google.maps.LatLng(coords.lat, coords.lng));
    }
  });

  return bounds;
};

/**
 * Create info window content for a region
 */
export const createRegionInfoContent = (
  regionName: string,
  isAssigned: boolean,
  user: User | null
): string => {
  const assignedText = isAssigned
    ? '<span class="text-green-600 font-semibold">✓ Assigned</span>'
    : '<span class="text-gray-400">Not Assigned</span>';

  return `
    <div class="p-3">
      <h3 class="font-bold text-lg mb-2">${regionName}</h3>
      <p class="text-sm mb-1">${assignedText}</p>
      ${isAssigned ? `
        <p class="text-xs text-gray-600 mt-2">
          You have access to manage towers and data in this region.
        </p>
      ` : `
        <p class="text-xs text-gray-400 mt-2">
          Contact your administrator for access to this region.
        </p>
      `}
    </div>
  `;
};

/**
 * Detect which Indian state/UT contains a point using GeoJSON polygon data
 * Uses a more robust point-in-polygon check with fallback to nearest state
 * @param lat Latitude
 * @param lng Longitude
 * @returns State/UT name or null if not found
 */
export const detectStateFromCoordinates = (lat: number, lng: number): string | null => {
  // Check if india.json is loaded in window
  if (!(window as any).indiaGeoJson || !(window as any).indiaGeoJson.features) {
    console.error('❌ India GeoJSON not loaded yet. Make sure loadIndiaBoundary() completed successfully.');
    return null;
  }

  const geoJson = (window as any).indiaGeoJson;
  const point = new google.maps.LatLng(lat, lng);

  console.log(`🔍 Detecting state for coordinates: (${lat}, ${lng})`);
  console.log(`📊 Checking against ${geoJson.features.length} state/UT features`);

  // Debug: Log first feature structure
  if (geoJson.features.length > 0) {
    console.log('🔬 Sample feature properties:', Object.keys(geoJson.features[0].properties || {}));
    console.log('🔬 Sample feature geometry type:', geoJson.features[0].geometry?.type);
  }

  let nearestState: { name: string; distance: number } | null = null;
  let checkedStates: string[] = [];

  // Check each state/UT polygon
  for (const feature of geoJson.features) {
    const stateName = feature.properties?.NAME_1 ||
                     feature.properties?.ST_NM ||
                     feature.properties?.st_nm ||  // Lowercase variant
                     feature.properties?.name;

    if (!stateName) {
      console.warn('⚠️ Found feature without name property:', feature.properties);
      continue;
    }

    checkedStates.push(stateName);

    // Handle Polygon geometry
    if (feature.geometry.type === 'Polygon') {
      // Get all rings (outer + holes)
      const rings = feature.geometry.coordinates;

      // For point-in-polygon, we only need the outer ring (first one)
      const outerRing = rings[0];
      const coordinates = outerRing.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      }));

      const polygon = new google.maps.Polygon({ paths: coordinates });

      if (google.maps.geometry.poly.containsLocation(point, polygon)) {
        console.log(`✅ Found state: ${stateName} (exact match)`);
        return stateName;
      }

      // Calculate distance to polygon center for fallback
      const bounds = new google.maps.LatLngBounds();
      coordinates.forEach((coord: { lat: number; lng: number }) => bounds.extend(new google.maps.LatLng(coord.lat, coord.lng)));
      const center = bounds.getCenter();
      const distance = google.maps.geometry.spherical.computeDistanceBetween(point, center);

      if (!nearestState || distance < nearestState.distance) {
        nearestState = { name: stateName, distance };
      }
    }

    // Handle MultiPolygon geometry (states with multiple regions)
    else if (feature.geometry.type === 'MultiPolygon') {
      for (const polygonRings of feature.geometry.coordinates) {
        // Get outer ring of this polygon
        const outerRing = polygonRings[0];
        const coordinates = outerRing.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        }));

        const polygon = new google.maps.Polygon({ paths: coordinates });

        if (google.maps.geometry.poly.containsLocation(point, polygon)) {
          console.log(`✅ Found state: ${stateName} (MultiPolygon, exact match)`);
          return stateName;
        }

        // Calculate distance to polygon center for fallback
        const bounds = new google.maps.LatLngBounds();
        coordinates.forEach((coord: { lat: number; lng: number }) => bounds.extend(new google.maps.LatLng(coord.lat, coord.lng)));
        const center = bounds.getCenter();
        const distance = google.maps.geometry.spherical.computeDistanceBetween(point, center);

        if (!nearestState || distance < nearestState.distance) {
          nearestState = { name: stateName, distance };
        }
      }
    }
  }

  // If no exact match found, use nearest state as fallback (if within reasonable distance)
  console.log(`📋 Checked ${checkedStates.length} states:`, checkedStates.join(', '));

  if (nearestState) {
    console.log(`📍 Nearest state: ${nearestState.name} at ${Math.round(nearestState.distance / 1000)}km`);

    if (nearestState.distance < 50000) { // Within 50km
      console.warn(`⚠️ No exact match found. Using nearest state: ${nearestState.name} (${Math.round(nearestState.distance / 1000)}km away)`);
      return nearestState.name;
    }
  }

  console.error(`❌ No state found for coordinates (${lat}, ${lng}) - might be outside India`);
  console.error(`   Checked ${checkedStates.length} states, nearest was ${nearestState ? `${nearestState.name} (${Math.round(nearestState.distance / 1000)}km)` : 'none'}`);
  return null;
};

/**
 * Normalize state names for comparison (handle variations in naming)
 */
const normalizeStateName = (stateName: string): string => {
  const normalized = stateName.trim().toLowerCase();

  // Handle common variations
  const variations: Record<string, string> = {
    'nct of delhi': 'delhi',
    'national capital territory of delhi': 'delhi',
    'dadra and nagar haveli': 'dadra and nagar haveli and daman and diu',
    'daman and diu': 'dadra and nagar haveli and daman and diu',
    'andaman and nicobar': 'andaman and nicobar islands',
  };

  return variations[normalized] || normalized;
};

/**
 * Check if a point (lat, lng) is within user's assigned regions
 * Uses GeoJSON polygon data from india.json (no Geocoding API needed)
 */
export const isPointInAssignedRegion = async (
  lat: number,
  lng: number,
  user: User | null,
  geocoder?: google.maps.Geocoder
): Promise<{
  allowed: boolean;
  regionName: string | null;
  message: string;
}> => {
  // If no user, deny access
  if (!user) {
    return {
      allowed: false,
      regionName: null,
      message: 'User not authenticated'
    };
  }

  // Admin has access to all regions
  if (user.role === 'Admin') {
    return {
      allowed: true,
      regionName: 'All Regions (Admin)',
      message: 'Admin access granted'
    };
  }

  // Check if India GeoJSON is loaded
  if (!(window as any).indiaGeoJson || !(window as any).indiaGeoJson.features) {
    console.error('❌ India GeoJSON not loaded yet - GIS tools not ready');
    return {
      allowed: false,
      regionName: null,
      message: 'Map data is still loading. Please wait a moment and try again.'
    };
  }

  // Get user's assigned regions (use sync version here since we're already in async context)
  const assignedRegions = getUserAssignedRegionsSync(user);

  // If user has no assigned regions, deny access
  if (assignedRegions.length === 0) {
    return {
      allowed: false,
      regionName: null,
      message: 'No regions assigned to your account'
    };
  }

  // If user has all regions, allow access (shouldn't happen for non-admin, but just in case)
  if (assignedRegions.length === INDIAN_STATES.length) {
    return {
      allowed: true,
      regionName: 'All Regions',
      message: 'Full access granted'
    };
  }

  // Detect state from coordinates using GeoJSON polygon data
  try {
    console.log(`🔍 Checking region access for coordinates: (${lat}, ${lng})`);
    console.log(`👤 User: ${user.name} (${user.role}), Assigned regions: ${assignedRegions.join(', ')}`);

    const detectedRegion = detectStateFromCoordinates(lat, lng);

    if (!detectedRegion) {
      console.error('❌ Could not determine state from coordinates - point might be outside India or on border');
      return {
        allowed: false,
        regionName: null,
        message: 'Could not determine region from coordinates. Please try clicking inside a state (not on borders).'
      };
    }

    console.log(`📍 Detected region: ${detectedRegion}`);

    // Normalize region names for comparison
    const normalizedDetected = normalizeStateName(detectedRegion);
    console.log(`🔄 Normalized detected region: "${normalizedDetected}"`);

    // Check if detected region matches any assigned region
    const isAllowed = assignedRegions.some(assignedRegion => {
      const normalizedAssigned = normalizeStateName(assignedRegion);
      const matches = (
        normalizedDetected === normalizedAssigned ||
        normalizedDetected.includes(normalizedAssigned) ||
        normalizedAssigned.includes(normalizedDetected)
      );

      console.log(`  Comparing with "${assignedRegion}" (normalized: "${normalizedAssigned}"): ${matches ? '✅ MATCH' : '❌ no match'}`);

      return matches;
    });

    console.log(`🎯 Final access decision: ${isAllowed ? '✅ ALLOWED' : '❌ DENIED'}`);

    // Also check for temporary access
    const hasTemp = await hasTemporaryAccess(user.id, detectedRegion);
    if (hasTemp) {
      console.log(`🔑 User has temporary access to ${detectedRegion}`);
    }

    if (isAllowed || hasTemp) {
      // Log successful access
      const accessType = hasTemp && !isAllowed ? 'temporary' : 'permanent';
      logAuditEvent(user, 'REGION_ACCESS_GRANTED', `Access granted to ${detectedRegion} (${accessType})`, {
        severity: 'info',
        region: detectedRegion,
        details: { lat, lng, assignedRegions, accessType, temporaryAccess: hasTemp },
        success: true
      });

      return {
        allowed: true,
        regionName: detectedRegion,
        message: `Access granted to ${detectedRegion}${hasTemp && !isAllowed ? ' (Temporary Access)' : ''}`
      };
    } else {
      // Log denied access
      logAuditEvent(user, 'REGION_ACCESS_DENIED', `Access denied to ${detectedRegion}`, {
        severity: 'warning',
        region: detectedRegion,
        details: { lat, lng, assignedRegions, attemptedRegion: detectedRegion },
        success: false,
        errorMessage: `User attempted to access ${detectedRegion} without permission`
      });

      return {
        allowed: false,
        regionName: detectedRegion,
        message: `You don't have access to ${detectedRegion}. Assigned regions: ${assignedRegions.join(', ')}`
      };
    }
  } catch (error) {
    console.error('Error checking region access:', error);
    // On error, deny access for security
    return {
      allowed: false,
      regionName: null,
      message: 'Error verifying region access. Please refresh the page and try again.'
    };
  }
};