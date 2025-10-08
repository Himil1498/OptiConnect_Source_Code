/**
 * Coordinate Parser Utility
 * Supports multiple coordinate formats
 */

export interface ParsedCoordinates {
  lat: number;
  lng: number;
  format: string;
}

/**
 * Parse coordinate string in various formats
 * Supported formats:
 * - Decimal: "28.6139, 77.2090"
 * - Decimal with spaces: "28.6139 77.2090"
 * - Degrees: "28.6139° N, 77.2090° E"
 * - DMS: "28°36'50"N 77°12'32"E"
 * - Google Maps URL: "https://maps.google.com/?q=28.6139,77.2090"
 */
export function parseCoordinates(input: string): ParsedCoordinates | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Try decimal format: "28.6139, 77.2090" or "28.6139 77.2090"
  const decimalMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1]);
    const lng = parseFloat(decimalMatch[2]);
    if (isValidCoordinate(lat, lng)) {
      return { lat, lng, format: 'decimal' };
    }
  }

  // Try decimal with cardinal directions: "28.6139° N, 77.2090° E"
  const cardinalMatch = trimmed.match(
    /^(-?\d+\.?\d*)°?\s*([NS])[,\s]+(-?\d+\.?\d*)°?\s*([EW])$/i
  );
  if (cardinalMatch) {
    let lat = parseFloat(cardinalMatch[1]);
    let lng = parseFloat(cardinalMatch[3]);

    if (cardinalMatch[2].toUpperCase() === 'S') lat = -lat;
    if (cardinalMatch[4].toUpperCase() === 'W') lng = -lng;

    if (isValidCoordinate(lat, lng)) {
      return { lat, lng, format: 'degrees' };
    }
  }

  // Try DMS format: "28°36'50"N 77°12'32"E"
  const dmsMatch = trimmed.match(
    /^(\d+)°(\d+)'([\d.]+)"?\s*([NS])\s+(\d+)°(\d+)'([\d.]+)"?\s*([EW])$/i
  );
  if (dmsMatch) {
    const latDeg = parseInt(dmsMatch[1]);
    const latMin = parseInt(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const latDir = dmsMatch[4].toUpperCase();

    const lngDeg = parseInt(dmsMatch[5]);
    const lngMin = parseInt(dmsMatch[6]);
    const lngSec = parseFloat(dmsMatch[7]);
    const lngDir = dmsMatch[8].toUpperCase();

    let lat = latDeg + latMin / 60 + latSec / 3600;
    let lng = lngDeg + lngMin / 60 + lngSec / 3600;

    if (latDir === 'S') lat = -lat;
    if (lngDir === 'W') lng = -lng;

    if (isValidCoordinate(lat, lng)) {
      return { lat, lng, format: 'dms' };
    }
  }

  // Try Google Maps URL
  const urlMatch = trimmed.match(/[@?](-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lng = parseFloat(urlMatch[2]);
    if (isValidCoordinate(lat, lng)) {
      return { lat, lng, format: 'url' };
    }
  }

  return null;
}

/**
 * Validate coordinate values
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  lat: number,
  lng: number,
  format: 'decimal' | 'degrees' | 'dms' = 'decimal'
): string {
  if (!isValidCoordinate(lat, lng)) return 'Invalid coordinates';

  switch (format) {
    case 'decimal':
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    case 'degrees':
      const latDir = lat >= 0 ? 'N' : 'S';
      const lngDir = lng >= 0 ? 'E' : 'W';
      return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;

    case 'dms':
      return `${decimalToDMS(lat, true)}, ${decimalToDMS(lng, false)}`;

    default:
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Convert decimal degrees to DMS
 */
function decimalToDMS(decimal: number, isLatitude: boolean): string {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;

  const direction = isLatitude
    ? decimal >= 0 ? 'N' : 'S'
    : decimal >= 0 ? 'E' : 'W';

  return `${degrees}°${minutes}'${seconds.toFixed(2)}" ${direction}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  point1: google.maps.LatLngLiteral,
  point2: google.maps.LatLngLiteral
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
