import type { Coordinates, BoundingBox, Color } from './common.types';

// Core Map Types
export interface MapInstance {
  instance: google.maps.Map | null;
  isLoaded: boolean;
  loadError: string | null;
}

export interface MapViewport {
  center: Coordinates;
  zoom: number;
  bounds?: google.maps.LatLngBounds;
  heading?: number;
  tilt?: number;
}

export interface MapConfiguration {
  apiKey: string;
  libraries: string[];
  region: string;
  language: string;
  version: string;
  mapId?: string;
}

export interface MapOptions extends google.maps.MapOptions {
  // Extended options specific to our application
  enableGeofencing?: boolean;
  restrictToIndia?: boolean;
  customControls?: CustomMapControl[];
  performanceMode?: 'standard' | 'optimized' | 'high_performance';
}

// Map Controls
export interface CustomMapControl {
  id: string;
  name: string;
  position: google.maps.ControlPosition;
  content: React.ReactNode;
  visible: boolean;
  onClick?: () => void;
}

export interface MapControlState {
  zoomControlVisible: boolean;
  mapTypeControlVisible: boolean;
  scaleControlVisible: boolean;
  streetViewControlVisible: boolean;
  fullscreenControlVisible: boolean;
  customControls: CustomMapControl[];
}

// Markers and Overlays
export interface MapMarker {
  id: string;
  position: Coordinates;
  title: string;
  description?: string;
  type: MarkerType;
  category?: string;
  icon?: MarkerIcon;
  visible: boolean;
  clickable: boolean;
  draggable: boolean;
  data?: Record<string, any>;
  infoWindow?: InfoWindowData;
  cluster?: boolean;
  zIndex?: number;
}

export type MarkerType =
  | 'tower'
  | 'fiber_node'
  | 'base_station'
  | 'repeater'
  | 'poi'
  | 'user_location'
  | 'search_result'
  | 'waypoint'
  | 'custom';

export interface MarkerIcon {
  url?: string;
  scaledSize?: { width: number; height: number };
  anchor?: { x: number; y: number };
  origin?: { x: number; y: number };
  color?: string;
  fontColor?: string;
  fontSize?: number;
  fontWeight?: string;
  text?: string;
  svg?: string;
}

export interface InfoWindowData {
  content: string | React.ReactNode;
  maxWidth?: number;
  pixelOffset?: { x: number; y: number };
  zIndex?: number;
  closeButton?: boolean;
}

// Drawing and Geometry
export interface DrawnShape {
  id: string;
  type: ShapeType;
  geometry: google.maps.Data.Geometry;
  properties: Record<string, any>;
  style: ShapeStyle;
  editable: boolean;
  draggable: boolean;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ShapeType =
  | 'polygon'
  | 'polyline'
  | 'circle'
  | 'rectangle'
  | 'marker'
  | 'point'
  | 'multipoint'
  | 'linestring'
  | 'multilinestring'
  | 'multipolygon';

export interface ShapeStyle {
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
  clickable?: boolean;
  editable?: boolean;
  draggable?: boolean;
  geodesic?: boolean;
  icons?: google.maps.IconSequence[];
  visible?: boolean;
  zIndex?: number;
}

export interface DrawingManagerState {
  isEnabled: boolean;
  drawingMode: google.maps.drawing.OverlayType | null;
  options: google.maps.drawing.DrawingManagerOptions;
}

// Layers
export interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  zIndex: number;
  source: LayerSource;
  style?: LayerStyle;
  filter?: LayerFilter;
  clustering?: ClusteringConfig;
  heatmap?: HeatmapConfig;
  data?: any[];
  metadata: Record<string, any>;
}

export type LayerType =
  | 'markers'
  | 'polygons'
  | 'polylines'
  | 'heatmap'
  | 'tile'
  | 'wms'
  | 'geojson'
  | 'kml'
  | 'traffic'
  | 'transit'
  | 'bicycling'
  | 'custom';

export interface LayerSource {
  type: 'geojson' | 'kml' | 'tile' | 'wms' | 'api' | 'static';
  url?: string;
  data?: any;
  parameters?: Record<string, any>;
  refreshInterval?: number;
}

export interface LayerStyle {
  markers?: {
    icon?: MarkerIcon;
    size?: number;
    color?: string;
  };
  polygons?: ShapeStyle;
  polylines?: ShapeStyle;
  tiles?: {
    opacity?: number;
    tileSize?: number;
  };
}

export interface LayerFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  logical?: 'and' | 'or';
}

// Clustering
export interface ClusteringConfig {
  enabled: boolean;
  maxZoom: number;
  gridSize: number;
  minimumClusterSize: number;
  styles: ClusterStyle[];
  averageCenter: boolean;
  zoomOnClick: boolean;
}

export interface ClusterStyle {
  url?: string;
  width: number;
  height: number;
  textColor: string;
  textSize: number;
  fontWeight?: string;
  fontFamily?: string;
  backgroundPosition?: string;
}

// Heatmap
export interface HeatmapConfig {
  enabled: boolean;
  gradient: string[];
  maxIntensity: number;
  opacity: number;
  radius: number;
  dissipating: boolean;
  weightedLocations: google.maps.visualization.WeightedLocation[];
}

// Search and Geocoding
export interface SearchResult {
  id: string;
  name: string;
  address: string;
  position: Coordinates;
  type: string;
  placeId?: string;
  rating?: number;
  photos?: string[];
  metadata: Record<string, any>;
}

export interface GeocodingResult {
  address: string;
  position: Coordinates;
  formattedAddress: string;
  addressComponents: google.maps.GeocoderAddressComponent[];
  types: string[];
  placeId: string;
  accuracy: number;
}

export interface SearchConfiguration {
  types: string[];
  bounds?: BoundingBox;
  location?: Coordinates;
  radius?: number;
  strictBounds?: boolean;
  language?: string;
  region?: string;
}

// Routing and Directions
export interface RouteRequest {
  origin: Coordinates | string;
  destination: Coordinates | string;
  waypoints?: Array<{
    location: Coordinates | string;
    stopover: boolean;
  }>;
  travelMode: google.maps.TravelMode;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  optimizeWaypoints?: boolean;
}

export interface RouteResult {
  routes: RouteInfo[];
  status: google.maps.DirectionsStatus;
}

export interface RouteInfo {
  summary: string;
  distance: string;
  duration: string;
  legs: RouteLeg[];
  bounds: google.maps.LatLngBounds;
  polyline: string;
  warnings: string[];
  fare?: {
    currency: string;
    value: number;
    text: string;
  };
}

export interface RouteLeg {
  distance: string;
  duration: string;
  startAddress: string;
  endAddress: string;
  startLocation: Coordinates;
  endLocation: Coordinates;
  steps: RouteStep[];
}

export interface RouteStep {
  distance: string;
  duration: string;
  instructions: string;
  startLocation: Coordinates;
  endLocation: Coordinates;
  travelMode: google.maps.TravelMode;
  polyline: string;
}

// Measurement Tools
export interface MeasurementResult {
  type: 'distance' | 'area' | 'elevation';
  value: number;
  unit: string;
  formattedValue: string;
  coordinates: Coordinates[];
  metadata?: Record<string, any>;
}

export interface ElevationData {
  location: Coordinates;
  elevation: number;
  resolution: number;
}

// Geofencing
export interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: Coordinates[];
  radius?: number; // for circle type
  isActive: boolean;
  triggers: GeofenceTrigger[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceTrigger {
  id: string;
  event: 'enter' | 'exit' | 'dwell';
  minDwellTime?: number; // for dwell events
  actions: GeofenceAction[];
}

export interface GeofenceAction {
  type: 'notification' | 'webhook' | 'email' | 'log';
  configuration: Record<string, any>;
}

// Street View
export interface StreetViewData {
  position: Coordinates;
  pov: {
    heading: number;
    pitch: number;
    zoom?: number;
  };
  location?: {
    description: string;
    latLng: Coordinates;
    pano: string;
    shortDescription: string;
  };
}

// Performance and Optimization
export interface MapPerformanceConfig {
  enableClustering: boolean;
  maxMarkersBeforeClustering: number;
  tileLoadingStrategy: 'eager' | 'lazy' | 'progressive';
  markerOptimization: boolean;
  animationDuration: number;
  debounceTime: number;
  memoryManagement: {
    enableAutoCleanup: boolean;
    maxCacheSize: number;
    cleanupInterval: number;
  };
}

export interface MapStats {
  markersCount: number;
  layersCount: number;
  visibleMarkersCount: number;
  activeLayers: string[];
  renderTime: number;
  memoryUsage: number;
  apiCalls: number;
  lastUpdate: string;
}