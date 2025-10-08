import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  GISToolsState,
  GISToolType,
  DistanceMeasurement,
  PolygonData,
  CircleData,
  ElevationProfile,
  Infrastructure,
  SectorRFData
} from '../../types/gisTools.types';

const initialState: GISToolsState = {
  distanceMeasurements: [],
  polygons: [],
  circles: [],
  elevationProfiles: [],
  infrastructures: [],
  sectorRFs: [],
  activeTool: null,
  selectedItem: null
};

const gisToolsSlice = createSlice({
  name: 'gisTools',
  initialState,
  reducers: {
    // Active Tool Management
    setActiveTool: (state, action: PayloadAction<GISToolType | null>) => {
      state.activeTool = action.payload;
      if (action.payload === null) {
        state.selectedItem = null;
      }
    },

    // Distance Measurements
    addDistanceMeasurement: (state, action: PayloadAction<DistanceMeasurement>) => {
      state.distanceMeasurements.push(action.payload);
    },
    updateDistanceMeasurement: (state, action: PayloadAction<{ id: string; updates: Partial<DistanceMeasurement> }>) => {
      const index = state.distanceMeasurements.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.distanceMeasurements[index] = {
          ...state.distanceMeasurements[index],
          ...action.payload.updates,
          updatedAt: new Date()
        };
      }
    },
    deleteDistanceMeasurement: (state, action: PayloadAction<string>) => {
      state.distanceMeasurements = state.distanceMeasurements.filter(m => m.id !== action.payload);
    },
    loadDistanceMeasurements: (state, action: PayloadAction<DistanceMeasurement[]>) => {
      state.distanceMeasurements = action.payload;
    },

    // Polygons
    addPolygon: (state, action: PayloadAction<PolygonData>) => {
      state.polygons.push(action.payload);
    },
    updatePolygon: (state, action: PayloadAction<{ id: string; updates: Partial<PolygonData> }>) => {
      const index = state.polygons.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.polygons[index] = {
          ...state.polygons[index],
          ...action.payload.updates,
          updatedAt: new Date()
        };
      }
    },
    deletePolygon: (state, action: PayloadAction<string>) => {
      state.polygons = state.polygons.filter(p => p.id !== action.payload);
    },
    loadPolygons: (state, action: PayloadAction<PolygonData[]>) => {
      state.polygons = action.payload;
    },

    // Circles
    addCircle: (state, action: PayloadAction<CircleData>) => {
      state.circles.push(action.payload);
    },
    updateCircle: (state, action: PayloadAction<{ id: string; updates: Partial<CircleData> }>) => {
      const index = state.circles.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.circles[index] = {
          ...state.circles[index],
          ...action.payload.updates,
          updatedAt: new Date()
        };
      }
    },
    deleteCircle: (state, action: PayloadAction<string>) => {
      state.circles = state.circles.filter(c => c.id !== action.payload);
    },
    loadCircles: (state, action: PayloadAction<CircleData[]>) => {
      state.circles = action.payload;
    },

    // Elevation Profiles
    addElevationProfile: (state, action: PayloadAction<ElevationProfile>) => {
      state.elevationProfiles.push(action.payload);
    },
    updateElevationProfile: (state, action: PayloadAction<{ id: string; updates: Partial<ElevationProfile> }>) => {
      const index = state.elevationProfiles.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.elevationProfiles[index] = {
          ...state.elevationProfiles[index],
          ...action.payload.updates,
          updatedAt: new Date()
        };
      }
    },
    deleteElevationProfile: (state, action: PayloadAction<string>) => {
      state.elevationProfiles = state.elevationProfiles.filter(e => e.id !== action.payload);
    },
    loadElevationProfiles: (state, action: PayloadAction<ElevationProfile[]>) => {
      state.elevationProfiles = action.payload;
    },

    // Infrastructures
    addInfrastructure: (state, action: PayloadAction<Infrastructure>) => {
      state.infrastructures.push(action.payload);
    },
    updateInfrastructure: (state, action: PayloadAction<{ id: string; updates: Partial<Infrastructure> }>) => {
      const index = state.infrastructures.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.infrastructures[index] = {
          ...state.infrastructures[index],
          ...action.payload.updates,
          updatedOn: new Date()
        };
      }
    },
    deleteInfrastructure: (state, action: PayloadAction<string>) => {
      state.infrastructures = state.infrastructures.filter(i => i.id !== action.payload);
    },
    loadInfrastructures: (state, action: PayloadAction<Infrastructure[]>) => {
      state.infrastructures = action.payload;
    },
    bulkAddInfrastructures: (state, action: PayloadAction<Infrastructure[]>) => {
      state.infrastructures.push(...action.payload);
    },

    // Sector RF
    addSectorRF: (state, action: PayloadAction<SectorRFData>) => {
      state.sectorRFs.push(action.payload);
    },
    updateSectorRF: (state, action: PayloadAction<{ id: string; updates: Partial<SectorRFData> }>) => {
      const index = state.sectorRFs.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sectorRFs[index] = {
          ...state.sectorRFs[index],
          ...action.payload.updates,
          updatedAt: new Date()
        };
      }
    },
    deleteSectorRF: (state, action: PayloadAction<string>) => {
      state.sectorRFs = state.sectorRFs.filter(s => s.id !== action.payload);
    },
    loadSectorRFs: (state, action: PayloadAction<SectorRFData[]>) => {
      state.sectorRFs = action.payload;
    },

    // Selection
    selectItem: (state, action: PayloadAction<{ type: GISToolType; id: string } | null>) => {
      state.selectedItem = action.payload;
    },

    // Clear All
    clearAllGISData: (state) => {
      state.distanceMeasurements = [];
      state.polygons = [];
      state.circles = [];
      state.elevationProfiles = [];
      state.infrastructures = [];
      state.sectorRFs = [];
      state.selectedItem = null;
    }
  }
});

export const {
  setActiveTool,
  addDistanceMeasurement,
  updateDistanceMeasurement,
  deleteDistanceMeasurement,
  loadDistanceMeasurements,
  addPolygon,
  updatePolygon,
  deletePolygon,
  loadPolygons,
  addCircle,
  updateCircle,
  deleteCircle,
  loadCircles,
  addElevationProfile,
  updateElevationProfile,
  deleteElevationProfile,
  loadElevationProfiles,
  addInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
  loadInfrastructures,
  bulkAddInfrastructures,
  addSectorRF,
  updateSectorRF,
  deleteSectorRF,
  loadSectorRFs,
  selectItem,
  clearAllGISData
} = gisToolsSlice.actions;

export default gisToolsSlice.reducer;