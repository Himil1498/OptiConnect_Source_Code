import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TelecomTower {
  id: string;
  name: string;
  type: 'cell_tower' | 'fiber_node' | 'base_station' | 'repeater';
  position: { lat: number; lng: number };
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  company: string;
  height: number;
  frequency: string[];
  coverage_radius: number;
  installation_date: string;
  last_maintenance: string;
  technical_specs: Record<string, any>;
  metadata: Record<string, any>;
}

export interface NetworkCoverage {
  id: string;
  tower_id: string;
  type: '2G' | '3G' | '4G' | '5G' | 'fiber';
  signal_strength: number;
  coverage_area: google.maps.LatLng[];
  quality_metrics: {
    latency: number;
    bandwidth: number;
    reliability: number;
  };
}

export interface DataFilter {
  companies: string[];
  towerTypes: string[];
  statusFilters: string[];
  dateRange: { start: string; end: string } | null;
  signalStrengthRange: { min: number; max: number };
  geoBounds: google.maps.LatLngBounds | null;
}

export interface ImportJob {
  id: string;
  type: 'towers' | 'coverage' | 'analytics';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  total_records: number;
  processed_records: number;
  errors: string[];
  started_at: string;
  completed_at?: string;
}

interface DataState {
  // Infrastructure Data
  towers: TelecomTower[];
  coverage: NetworkCoverage[];

  // Data Management
  isLoading: boolean;
  loadingMessage: string;
  lastSync: string | null;

  // Filtering and Search
  filters: DataFilter;
  searchQuery: string;
  filteredTowerIds: string[];

  // Data Import/Export
  importJobs: ImportJob[];
  activeImportId: string | null;

  // Caching and Performance
  dataCacheExpiry: number;
  isDataStale: boolean;

  // Statistics
  stats: {
    totalTowers: number;
    activeTowers: number;
    companyCounts: Record<string, number>;
    typeCounts: Record<string, number>;
    coverageStats: Record<string, number>;
  };

  // Error Handling
  errors: Array<{
    id: string;
    message: string;
    timestamp: number;
    type: 'load' | 'filter' | 'import' | 'export';
  }>;
}

const initialFilters: DataFilter = {
  companies: [],
  towerTypes: [],
  statusFilters: ['active'],
  dateRange: null,
  signalStrengthRange: { min: 0, max: 100 },
  geoBounds: null,
};

const initialState: DataState = {
  towers: [],
  coverage: [],

  isLoading: false,
  loadingMessage: '',
  lastSync: null,

  filters: initialFilters,
  searchQuery: '',
  filteredTowerIds: [],

  importJobs: [],
  activeImportId: null,

  dataCacheExpiry: 5 * 60 * 1000, // 5 minutes
  isDataStale: false,

  stats: {
    totalTowers: 0,
    activeTowers: 0,
    companyCounts: {},
    typeCounts: {},
    coverageStats: {},
  },

  errors: [],
};

let errorIdCounter = 0;

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    // Loading States
    setLoading: (state, action: PayloadAction<{ loading: boolean; message?: string }>) => {
      state.isLoading = action.payload.loading;
      state.loadingMessage = action.payload.message || '';
    },

    // Tower Management
    setTowers: (state, action: PayloadAction<TelecomTower[]>) => {
      state.towers = action.payload;
      state.lastSync = new Date().toISOString();
      state.isDataStale = false;

      // Update statistics
      state.stats.totalTowers = action.payload.length;
      state.stats.activeTowers = action.payload.filter(t => t.status === 'active').length;

      // Company counts
      state.stats.companyCounts = action.payload.reduce((acc, tower) => {
        acc[tower.company] = (acc[tower.company] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Type counts
      state.stats.typeCounts = action.payload.reduce((acc, tower) => {
        acc[tower.type] = (acc[tower.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },

    addTower: (state, action: PayloadAction<TelecomTower>) => {
      state.towers.push(action.payload);
      state.stats.totalTowers += 1;
      if (action.payload.status === 'active') {
        state.stats.activeTowers += 1;
      }
    },

    updateTower: (state, action: PayloadAction<{ id: string; updates: Partial<TelecomTower> }>) => {
      const index = state.towers.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        const oldTower = state.towers[index];
        state.towers[index] = { ...oldTower, ...action.payload.updates };

        // Update stats if status changed
        if (action.payload.updates.status && oldTower.status !== action.payload.updates.status) {
          if (oldTower.status === 'active') state.stats.activeTowers -= 1;
          if (action.payload.updates.status === 'active') state.stats.activeTowers += 1;
        }
      }
    },

    removeTower: (state, action: PayloadAction<string>) => {
      const tower = state.towers.find(t => t.id === action.payload);
      state.towers = state.towers.filter(t => t.id !== action.payload);
      if (tower) {
        state.stats.totalTowers -= 1;
        if (tower.status === 'active') {
          state.stats.activeTowers -= 1;
        }
      }
    },

    // Coverage Management
    setCoverage: (state, action: PayloadAction<NetworkCoverage[]>) => {
      state.coverage = action.payload;

      // Update coverage stats
      state.stats.coverageStats = action.payload.reduce((acc, cov) => {
        acc[cov.type] = (acc[cov.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },

    addCoverage: (state, action: PayloadAction<NetworkCoverage>) => {
      state.coverage.push(action.payload);
    },

    // Filtering
    setFilters: (state, action: PayloadAction<Partial<DataFilter>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    resetFilters: (state) => {
      state.filters = initialFilters;
      state.filteredTowerIds = [];
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setFilteredTowerIds: (state, action: PayloadAction<string[]>) => {
      state.filteredTowerIds = action.payload;
    },

    // Data Import/Export
    addImportJob: (state, action: PayloadAction<ImportJob>) => {
      state.importJobs.push(action.payload);
      state.activeImportId = action.payload.id;
    },

    updateImportJob: (state, action: PayloadAction<{ id: string; updates: Partial<ImportJob> }>) => {
      const index = state.importJobs.findIndex(job => job.id === action.payload.id);
      if (index !== -1) {
        state.importJobs[index] = { ...state.importJobs[index], ...action.payload.updates };

        if (action.payload.updates.status === 'completed' || action.payload.updates.status === 'failed') {
          state.activeImportId = null;
        }
      }
    },

    removeImportJob: (state, action: PayloadAction<string>) => {
      state.importJobs = state.importJobs.filter(job => job.id !== action.payload);
      if (state.activeImportId === action.payload) {
        state.activeImportId = null;
      }
    },

    // Cache Management
    markDataStale: (state) => {
      state.isDataStale = true;
    },

    setCacheExpiry: (state, action: PayloadAction<number>) => {
      state.dataCacheExpiry = action.payload;
    },

    // Error Handling
    addError: (state, action: PayloadAction<{ message: string; type: 'load' | 'filter' | 'import' | 'export' }>) => {
      state.errors.push({
        id: `error_${errorIdCounter++}`,
        message: action.payload.message,
        timestamp: Date.now(),
        type: action.payload.type,
      });
    },

    removeError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter(e => e.id !== action.payload);
    },

    clearErrors: (state) => {
      state.errors = [];
    },
  },
});

export const {
  setLoading,
  setTowers,
  addTower,
  updateTower,
  removeTower,
  setCoverage,
  addCoverage,
  setFilters,
  resetFilters,
  setSearchQuery,
  setFilteredTowerIds,
  addImportJob,
  updateImportJob,
  removeImportJob,
  markDataStale,
  setCacheExpiry,
  addError,
  removeError,
  clearErrors,
} = dataSlice.actions;

export default dataSlice.reducer;