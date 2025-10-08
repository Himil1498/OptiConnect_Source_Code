import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  type: 'tower' | 'fiber' | 'station' | 'poi';
  info?: Record<string, any>;
  visible: boolean;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'markers' | 'polygons' | 'lines' | 'heatmap';
  visible: boolean;
  data: any[];
  style?: Record<string, any>;
}

export interface MapViewport {
  center: { lat: number; lng: number };
  zoom: number;
  bounds?: google.maps.LatLngBounds;
}

interface MapState {
  // Core Map Instance (non-serializable)
  mapInstance: google.maps.Map | null;
  isMapLoaded: boolean;

  // Map Configuration
  viewport: MapViewport;
  mapType: google.maps.MapTypeId;

  // Layers and Markers
  markers: MapMarker[];
  layers: MapLayer[];
  activeLayerIds: string[];

  // Drawing and Tools
  isDrawingMode: boolean;
  drawingType: 'marker' | 'polygon' | 'polyline' | 'circle' | null;
  drawnShapes: any[];
  activeGISTool: string | null; // Active GIS tool (distance, polygon, circle, elevation, infrastructure)

  // UI State
  selectedMarkerId: string | null;
  infoWindowOpen: boolean;

  // Search and Geocoding
  searchResults: any[];
  isSearching: boolean;

  // Performance
  clusteringEnabled: boolean;
  maxMarkersVisible: number;
}

// Default center: India (Delhi)
const INDIA_CENTER = { lat: 28.6139, lng: 77.2090 };

const initialState: MapState = {
  mapInstance: null,
  isMapLoaded: false,

  viewport: {
    center: INDIA_CENTER,
    zoom: 6,
  },
  mapType: 'roadmap' as google.maps.MapTypeId,

  markers: [],
  layers: [],
  activeLayerIds: [],

  isDrawingMode: false,
  drawingType: null,
  drawnShapes: [],
  activeGISTool: null,

  selectedMarkerId: null,
  infoWindowOpen: false,

  searchResults: [],
  isSearching: false,

  clusteringEnabled: true,
  maxMarkersVisible: 1000,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    // Map Instance Management
    setMapInstance: (state, action: PayloadAction<google.maps.Map | null>) => {
      state.mapInstance = action.payload;
      state.isMapLoaded = !!action.payload;
    },

    // Viewport Management
    setViewport: (state, action: PayloadAction<Partial<MapViewport>>) => {
      state.viewport = { ...state.viewport, ...action.payload };
    },

    setMapType: (state, action: PayloadAction<google.maps.MapTypeId>) => {
      state.mapType = action.payload;
    },

    // Marker Management
    addMarker: (state, action: PayloadAction<MapMarker>) => {
      state.markers.push(action.payload);
    },

    removeMarker: (state, action: PayloadAction<string>) => {
      state.markers = state.markers.filter(marker => marker.id !== action.payload);
    },

    updateMarker: (state, action: PayloadAction<{ id: string; updates: Partial<MapMarker> }>) => {
      const index = state.markers.findIndex(marker => marker.id === action.payload.id);
      if (index !== -1) {
        state.markers[index] = { ...state.markers[index], ...action.payload.updates };
      }
    },

    setMarkers: (state, action: PayloadAction<MapMarker[]>) => {
      state.markers = action.payload;
    },

    // Layer Management
    addLayer: (state, action: PayloadAction<MapLayer>) => {
      state.layers.push(action.payload);
      if (action.payload.visible) {
        state.activeLayerIds.push(action.payload.id);
      }
    },

    removeLayer: (state, action: PayloadAction<string>) => {
      state.layers = state.layers.filter(layer => layer.id !== action.payload);
      state.activeLayerIds = state.activeLayerIds.filter(id => id !== action.payload);
    },

    toggleLayer: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find(l => l.id === action.payload);
      if (layer) {
        layer.visible = !layer.visible;
        if (layer.visible) {
          state.activeLayerIds.push(action.payload);
        } else {
          state.activeLayerIds = state.activeLayerIds.filter(id => id !== action.payload);
        }
      }
    },

    // Drawing Tools
    setDrawingMode: (state, action: PayloadAction<boolean>) => {
      state.isDrawingMode = action.payload;
      if (!action.payload) {
        state.drawingType = null;
      }
    },

    setDrawingType: (state, action: PayloadAction<'marker' | 'polygon' | 'polyline' | 'circle' | null>) => {
      state.drawingType = action.payload;
      state.isDrawingMode = !!action.payload;
    },

    addDrawnShape: (state, action: PayloadAction<any>) => {
      state.drawnShapes.push(action.payload);
    },

    clearDrawnShapes: (state) => {
      state.drawnShapes = [];
    },

    // GIS Tools
    setActiveGISTool: (state, action: PayloadAction<string | null>) => {
      state.activeGISTool = action.payload;
    },

    // Selection and Info
    selectMarker: (state, action: PayloadAction<string | null>) => {
      state.selectedMarkerId = action.payload;
      state.infoWindowOpen = !!action.payload;
    },

    closeInfoWindow: (state) => {
      state.infoWindowOpen = false;
      state.selectedMarkerId = null;
    },

    // Search
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },

    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
      state.isSearching = false;
    },

    // Performance Settings
    toggleClustering: (state) => {
      state.clusteringEnabled = !state.clusteringEnabled;
    },

    setMaxMarkersVisible: (state, action: PayloadAction<number>) => {
      state.maxMarkersVisible = action.payload;
    },
  },
});

export const {
  setMapInstance,
  setViewport,
  setMapType,
  addMarker,
  removeMarker,
  updateMarker,
  setMarkers,
  addLayer,
  removeLayer,
  toggleLayer,
  setDrawingMode,
  setDrawingType,
  addDrawnShape,
  clearDrawnShapes,
  setActiveGISTool,
  selectMarker,
  closeInfoWindow,
  setSearching,
  setSearchResults,
  toggleClustering,
  setMaxMarkersVisible,
} = mapSlice.actions;

export default mapSlice.reducer;