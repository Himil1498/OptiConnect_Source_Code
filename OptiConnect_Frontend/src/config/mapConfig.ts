/**
 * Phase 3: Map Infrastructure & Regional Control Configuration
 * Google Maps setup with India-specific restrictions and controls
 */

export interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  restriction?: google.maps.MapRestriction;
  customControls: {
    myLocation: boolean;
    centerToIndia: boolean;
    liveCoordinates: boolean;
    mapTypeSwitch: boolean;
  };
  disabledControls: string[];
  styles?: google.maps.MapTypeStyle[];
}

/**
 * India Center Coordinates
 */
export const INDIA_CENTER = {
  lat: 20.5937,
  lng: 78.9629
};

/**
 * India Bounding Box for Map Restrictions
 * Approximate boundaries covering entire India including island territories
 */
export const INDIA_BOUNDS = {
  north: 37.0, // Kashmir/Ladakh
  south: 6.0,  // Kanyakumari + Nicobar Islands
  east: 97.5,  // Arunachal Pradesh
  west: 68.0   // Gujarat
};

/**
 * Default Map Configuration
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: INDIA_CENTER,
  zoom: 5,
  restriction: {
    latLngBounds: INDIA_BOUNDS,
    strictBounds: false // Allow some panning outside but snap back
  },
  customControls: {
    myLocation: true,
    centerToIndia: true,
    liveCoordinates: true,
    mapTypeSwitch: true
  },
  disabledControls: [
    'defaultZoom',
    'defaultPan',
    'streetView'
  ]
};

/**
 * Map Options for Google Maps
 */
export const getMapOptions = (config: MapConfig = DEFAULT_MAP_CONFIG): google.maps.MapOptions => {
  return {
    center: config.center,
    zoom: config.zoom,
    restriction: config.restriction,

    // Disable default controls
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,

    // Map type
    mapTypeId: google.maps.MapTypeId.ROADMAP,

    // Gestures
    gestureHandling: 'greedy',

    // Styling
    styles: config.styles,

    // Disable POI clicks
    clickableIcons: false,

    // Min/Max zoom
    minZoom: 4,
    maxZoom: 20,
  };
};

/**
 * Check if coordinates are within India bounds
 */
export const isWithinIndiaBounds = (lat: number, lng: number): boolean => {
  return (
    lat >= INDIA_BOUNDS.south &&
    lat <= INDIA_BOUNDS.north &&
    lng >= INDIA_BOUNDS.west &&
    lng <= INDIA_BOUNDS.east
  );
};

/**
 * Get distance from India center (in km)
 */
export const getDistanceFromCenter = (lat: number, lng: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat - INDIA_CENTER.lat) * Math.PI / 180;
  const dLng = (lng - INDIA_CENTER.lng) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(INDIA_CENTER.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
};

/**
 * Map Type Options
 */
export const MAP_TYPES = [
  { id: 'roadmap', label: 'Road Map', icon: '🗺️' },
  { id: 'satellite', label: 'Satellite', icon: '🛰️' },
  { id: 'hybrid', label: 'Hybrid', icon: '🌍' },
  { id: 'terrain', label: 'Terrain', icon: '⛰️' }
] as const;

/**
 * Custom Map Styles (Optional - for dark mode or custom themes)
 */
export const CUSTOM_MAP_STYLES = {
  default: [],
  dark: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }]
    }
  ],
  light: [
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
    }
  ]
};

/**
 * Geofence Configuration
 */
export interface GeofenceConfig {
  enabled: boolean;
  alertOnExit: boolean;
  preventExit: boolean;
  boundaryColor: string;
  boundaryWidth: number;
}

export const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
  enabled: true,
  alertOnExit: true,
  preventExit: false, // Allow viewing but alert
  boundaryColor: '#FF0000',
  boundaryWidth: 2
};

/**
 * Error Messages
 */
export const MAP_ERROR_MESSAGES = {
  OUTSIDE_INDIA: 'Location is outside India boundaries',
  UNAUTHORIZED_REGION: 'You do not have access to this region',
  GEOFENCE_VIOLATION: 'Cannot place marker outside assigned regions',
  LOCATION_UNAVAILABLE: 'Location services unavailable',
  LOAD_ERROR: 'Failed to load map data'
};

/**
 * Control Button Styles
 */
export const CONTROL_BUTTON_STYLE = {
  backgroundColor: '#fff',
  border: 'none',
  borderRadius: '4px',
  boxShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px',
  cursor: 'pointer',
  fontSize: '14px',
  margin: '10px',
  padding: '10px',
  textAlign: 'center' as const,
  minWidth: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};