/**
 * Layer Visualization Utility
 * Renders saved GIS data (Distance, Polygon, Circle, etc.) on the map
 */

import type { DataHubEntry } from '../types/gisTools.types';

export interface LayerOverlay {
  id: string;
  type: string;
  overlay: google.maps.MVCObject;
  infoWindow?: google.maps.InfoWindow;
}

/**
 * Create map overlays from saved data entries
 */
export const createOverlaysFromData = (
  entries: DataHubEntry[],
  map: google.maps.Map
): LayerOverlay[] => {
  const overlays: LayerOverlay[] = [];

  entries.forEach((entry) => {
    try {
      switch (entry.type) {
        case 'Distance':
          const distanceOverlays = createDistanceOverlay(entry, map);
          overlays.push(...distanceOverlays);
          break;

        case 'Polygon':
          const polygonOverlay = createPolygonOverlay(entry, map);
          if (polygonOverlay) overlays.push(polygonOverlay);
          break;

        case 'Circle':
          const circleOverlay = createCircleOverlay(entry, map);
          if (circleOverlay) overlays.push(circleOverlay);
          break;

        case 'Elevation':
          const elevationOverlays = createElevationOverlay(entry, map);
          overlays.push(...elevationOverlays);
          break;

        case 'Infrastructure':
          const infraOverlay = createInfrastructureOverlay(entry, map);
          if (infraOverlay) overlays.push(infraOverlay);
          break;
      }
    } catch (error) {
      console.error(`Error creating overlay for ${entry.type} #${entry.id}:`, error);
    }
  });

  return overlays;
};

/**
 * Create Distance Measurement overlays (polyline + markers)
 */
const createDistanceOverlay = (entry: DataHubEntry, map: google.maps.Map): LayerOverlay[] => {
  const overlays: LayerOverlay[] = [];
  const data = entry.data as any;

  if (!data.points || data.points.length < 2) return overlays;

  // Create polyline
  const path = data.points.map((p: any) => ({ lat: p.lat, lng: p.lng }));
  const polyline = new google.maps.Polyline({
    path,
    strokeColor: data.color || '#3B82F6',
    strokeWeight: 3,
    strokeOpacity: 0.8,
    map: null
  });

  overlays.push({
    id: `${entry.id}-line`,
    type: 'Distance',
    overlay: polyline
  });

  // Create markers for each point
  data.points.forEach((point: any, index: number) => {
    const marker = new google.maps.Marker({
      position: { lat: point.lat, lng: point.lng },
      label: {
        text: point.label || String.fromCharCode(65 + index),
        color: '#FFFFFF',
        fontWeight: 'bold'
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: data.color || '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      },
      map: null,
      title: `${entry.name} - Point ${point.label || String.fromCharCode(65 + index)}`
    });

    // Info window for each marker
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">📏 ${entry.name}</h3>
          </div>
          <div style="background: #EFF6FF; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #3B82F6;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937;"><strong>📍 Point ${point.label || String.fromCharCode(65 + index)}</strong></p>
            <p style="margin: 0; font-size: 12px; color: #6B7280;">
              <span style="font-family: monospace; background: #E5E7EB; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}
              </span>
            </p>
          </div>
          <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
            <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">🔵 Distance Measurement</p>
          </div>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    overlays.push({
      id: `${entry.id}-marker-${index}`,
      type: 'Distance',
      overlay: marker,
      infoWindow
    });
  });

  return overlays;
};

/**
 * Create Polygon overlay
 */
const createPolygonOverlay = (entry: DataHubEntry, map: google.maps.Map): LayerOverlay | null => {
  const data = entry.data as any;

  if (!data.vertices || data.vertices.length < 3) return null;

  const path = data.vertices.map((v: any) => ({ lat: v.lat, lng: v.lng }));
  const polygon = new google.maps.Polygon({
    paths: path,
    strokeColor: data.color || '#8B5CF6',
    strokeOpacity: 0.8,
    strokeWeight: data.strokeWeight || 2,
    fillColor: data.color || '#8B5CF6',
    fillOpacity: data.fillOpacity || 0.35,
    map: null
  });

  // Info window
  const center = getPolygonCenter(path);
  const infoWindow = new google.maps.InfoWindow({
    position: center,
    content: `
      <div style="padding: 12px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">⬡ ${entry.name}</h3>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div style="background: #F3E8FF; padding: 8px; border-radius: 6px;">
            <p style="margin: 0; font-size: 10px; font-weight: 600; color: #6B21A8; text-transform: uppercase;">Area</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${formatArea(data.area)}</p>
          </div>
          <div style="background: #F3E8FF; padding: 8px; border-radius: 6px;">
            <p style="margin: 0; font-size: 10px; font-weight: 600; color: #6B21A8; text-transform: uppercase;">Perimeter</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${formatDistance(data.perimeter)}</p>
          </div>
        </div>
        ${data.description ? `
        <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
          <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${data.description}</p>
        </div>` : ''}
        <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
          <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">🟣 Polygon Drawing</p>
        </div>
      </div>
    `
  });

  polygon.addListener('click', () => {
    infoWindow.open(map);
  });

  return {
    id: entry.id,
    type: 'Polygon',
    overlay: polygon,
    infoWindow
  };
};

/**
 * Create Circle overlay
 */
const createCircleOverlay = (entry: DataHubEntry, map: google.maps.Map): LayerOverlay | null => {
  const data = entry.data as any;

  if (!data.center || !data.radius) return null;

  const circle = new google.maps.Circle({
    center: { lat: data.center.lat, lng: data.center.lng },
    radius: data.radius,
    strokeColor: data.color || '#10B981',
    strokeOpacity: 0.8,
    strokeWeight: data.strokeWeight || 2,
    fillColor: data.color || '#10B981',
    fillOpacity: data.fillOpacity || 0.35,
    map: null
  });

  // Info window
  const infoWindow = new google.maps.InfoWindow({
    position: data.center,
    content: `
      <div style="padding: 12px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">○ ${entry.name}</h3>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div style="background: #D1FAE5; padding: 8px; border-radius: 6px;">
            <p style="margin: 0; font-size: 10px; font-weight: 600; color: #065F46; text-transform: uppercase;">Radius</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${formatDistance(data.radius)}</p>
          </div>
          <div style="background: #D1FAE5; padding: 8px; border-radius: 6px;">
            <p style="margin: 0; font-size: 10px; font-weight: 600; color: #065F46; text-transform: uppercase;">Area</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${formatArea(data.area)}</p>
          </div>
        </div>
        ${data.description ? `
        <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
          <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${data.description}</p>
        </div>` : ''}
        <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
          <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">🟢 Circle/Radius Drawing</p>
        </div>
      </div>
    `
  });

  circle.addListener('click', () => {
    infoWindow.open(map);
  });

  return {
    id: entry.id,
    type: 'Circle',
    overlay: circle,
    infoWindow
  };
};

/**
 * Create Elevation Profile overlays (polyline + markers)
 */
const createElevationOverlay = (entry: DataHubEntry, map: google.maps.Map): LayerOverlay[] => {
  const overlays: LayerOverlay[] = [];
  const data = entry.data as any;

  if (!data.points || data.points.length < 2) return overlays;

  // Create polyline
  const path = data.points.map((p: any) => ({ lat: p.lat, lng: p.lng }));
  const polyline = new google.maps.Polyline({
    path,
    strokeColor: '#F59E0B',
    strokeWeight: 3,
    strokeOpacity: 0.8,
    map: null
  });

  overlays.push({
    id: `${entry.id}-line`,
    type: 'Elevation',
    overlay: polyline
  });

  // High point marker
  if (data.highPoint) {
    const highMarker = new google.maps.Marker({
      position: data.highPoint.location,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        rotation: 270
      },
      map: null,
      title: `Highest Point: ${data.highPoint.elevation}m`
    });

    overlays.push({
      id: `${entry.id}-high`,
      type: 'Elevation',
      overlay: highMarker
    });
  }

  // Low point marker
  if (data.lowPoint) {
    const lowMarker = new google.maps.Marker({
      position: data.lowPoint.location,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        rotation: 90
      },
      map: null,
      title: `Lowest Point: ${data.lowPoint.elevation}m`
    });

    overlays.push({
      id: `${entry.id}-low`,
      type: 'Elevation',
      overlay: lowMarker
    });
  }

  return overlays;
};

/**
 * Create Infrastructure marker overlay
 */
const createInfrastructureOverlay = (entry: DataHubEntry, map: google.maps.Map): LayerOverlay | null => {
  const data = entry.data as any;

  if (!data.location) return null;

  // Icon based on type and status
  const getIcon = () => {
    const color = data.status === 'active' ? '#10B981' :
                  data.status === 'maintenance' ? '#F59E0B' : '#EF4444';

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    };
  };

  const marker = new google.maps.Marker({
    position: data.location,
    icon: getIcon(),
    map: null,
    title: entry.name
  });

  // Status color
  const getStatusColor = () => {
    if (data.status === 'active') return { bg: '#D1FAE5', text: '#065F46', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' };
    if (data.status === 'maintenance') return { bg: '#FEF3C7', text: '#92400E', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' };
    return { bg: '#FEE2E2', text: '#991B1B', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' };
  };

  const statusColor = getStatusColor();

  // Info window
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 12px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: ${statusColor.gradient}; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">📡 ${entry.name}</h3>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div style="background: ${statusColor.bg}; padding: 8px; border-radius: 6px;">
            <p style="margin: 0; font-size: 10px; font-weight: 600; color: ${statusColor.text}; text-transform: uppercase;">Type</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${data.type || 'Infrastructure'}</p>
          </div>
          <div style="background: ${statusColor.bg}; padding: 8px; border-radius: 6px;">
            <p style="margin: 0; font-size: 10px; font-weight: 600; color: ${statusColor.text}; text-transform: uppercase;">Status</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937; text-transform: capitalize;">${data.status || 'unknown'}</p>
          </div>
        </div>
        ${data.description ? `
        <div style="background: #F3F4F6; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #6B7280;">
          <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${data.description}</p>
        </div>` : ''}
        <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
          <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">🏢 Infrastructure Management</p>
        </div>
      </div>
    `
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });

  return {
    id: entry.id,
    type: 'Infrastructure',
    overlay: marker,
    infoWindow
  };
};

/**
 * Show/hide overlays on map
 */
export const setOverlaysVisibility = (
  overlays: LayerOverlay[],
  visible: boolean,
  map: google.maps.Map | null
): void => {
  overlays.forEach((item) => {
    if ('setMap' in item.overlay) {
      (item.overlay as any).setMap(visible ? map : null);
    }
  });
};

/**
 * Helper: Calculate polygon center
 */
const getPolygonCenter = (path: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
  const bounds = new google.maps.LatLngBounds();
  path.forEach((point) => bounds.extend(point));
  const center = bounds.getCenter();
  return { lat: center.lat(), lng: center.lng() };
};

/**
 * Helper: Format distance
 */
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

/**
 * Helper: Format area
 */
const formatArea = (sqMeters: number): string => {
  if (sqMeters < 10000) {
    return `${Math.round(sqMeters)} m²`;
  }
  return `${(sqMeters / 1000000).toFixed(2)} km²`;
};
