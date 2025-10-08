import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  category: 'performance' | 'usage' | 'network' | 'business';
  metadata?: Record<string, any>;
}

export interface PerformanceData {
  response_time: number;
  data_load_time: number;
  map_render_time: number;
  memory_usage: number;
  cpu_usage: number;
  fps: number;
  timestamp: string;
}

export interface UsageStats {
  daily_active_users: number;
  session_duration: number;
  page_views: number;
  feature_usage: Record<string, number>;
  timestamp: string;
}

export interface NetworkAnalytics {
  coverage_percentage: number;
  signal_quality_avg: number;
  tower_utilization: number;
  network_downtime: number;
  data_throughput: number;
  timestamp: string;
}

export interface BusinessMetrics {
  cost_per_tower: number;
  roi_percentage: number;
  expansion_opportunities: number;
  maintenance_costs: number;
  revenue_impact: number;
  timestamp: string;
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'performance' | 'usage' | 'network' | 'business' | 'custom';
  metrics: string[];
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'json';
  isActive: boolean;
  lastGenerated?: string;
}

interface AnalyticsState {
  // Real-time Metrics
  currentMetrics: AnalyticsMetric[];
  performanceData: PerformanceData[];
  usageStats: UsageStats[];
  networkAnalytics: NetworkAnalytics[];
  businessMetrics: BusinessMetrics[];

  // Time Range for Analytics
  timeRange: {
    start: string;
    end: string;
    period: '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';
  };

  // Data Loading
  isLoading: boolean;
  lastUpdate: string | null;

  // Reports
  reports: ReportConfig[];
  generatedReports: Array<{
    id: string;
    reportId: string;
    name: string;
    generatedAt: string;
    downloadUrl: string;
    status: 'generating' | 'ready' | 'expired';
  }>;

  // Alerts and Thresholds
  alerts: Array<{
    id: string;
    type: 'performance' | 'network' | 'usage';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    acknowledged: boolean;
    resolvedAt?: string;
  }>;

  thresholds: Record<string, {
    min?: number;
    max?: number;
    enabled: boolean;
  }>;

  // Dashboard Configuration
  dashboardLayout: Array<{
    id: string;
    type: 'chart' | 'metric' | 'map' | 'table';
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: Record<string, any>;
  }>;

  // Export/Import
  isExporting: boolean;
  exportProgress: number;
}

const initialState: AnalyticsState = {
  currentMetrics: [],
  performanceData: [],
  usageStats: [],
  networkAnalytics: [],
  businessMetrics: [],

  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h ago
    end: new Date().toISOString(),
    period: '24h',
  },

  isLoading: false,
  lastUpdate: null,

  reports: [],
  generatedReports: [],

  alerts: [],
  thresholds: {
    response_time: { max: 2000, enabled: true },
    memory_usage: { max: 80, enabled: true },
    signal_quality: { min: 70, enabled: true },
    tower_downtime: { max: 5, enabled: true },
  },

  dashboardLayout: [
    {
      id: 'performance_overview',
      type: 'chart',
      position: { x: 0, y: 0 },
      size: { width: 6, height: 4 },
      config: { chartType: 'line', metrics: ['response_time', 'memory_usage'] },
    },
    {
      id: 'network_status',
      type: 'metric',
      position: { x: 6, y: 0 },
      size: { width: 3, height: 2 },
      config: { metric: 'coverage_percentage' },
    },
    {
      id: 'active_towers',
      type: 'map',
      position: { x: 0, y: 4 },
      size: { width: 12, height: 6 },
      config: { showHeatmap: true, metric: 'signal_strength' },
    },
  ],

  isExporting: false,
  exportProgress: 0,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    // Metrics Management
    addMetric: (state, action: PayloadAction<AnalyticsMetric>) => {
      state.currentMetrics.push(action.payload);
      state.lastUpdate = new Date().toISOString();
    },

    updateMetric: (state, action: PayloadAction<{ id: string; value: number }>) => {
      const metric = state.currentMetrics.find(m => m.id === action.payload.id);
      if (metric) {
        metric.value = action.payload.value;
        metric.timestamp = new Date().toISOString();
      }
    },

    setMetrics: (state, action: PayloadAction<AnalyticsMetric[]>) => {
      state.currentMetrics = action.payload;
      state.lastUpdate = new Date().toISOString();
    },

    // Performance Data
    addPerformanceData: (state, action: PayloadAction<PerformanceData>) => {
      state.performanceData.push(action.payload);
      // Keep only last 1000 entries for performance
      if (state.performanceData.length > 1000) {
        state.performanceData = state.performanceData.slice(-1000);
      }
    },

    setPerformanceData: (state, action: PayloadAction<PerformanceData[]>) => {
      state.performanceData = action.payload;
    },

    // Usage Statistics
    addUsageStats: (state, action: PayloadAction<UsageStats>) => {
      state.usageStats.push(action.payload);
    },

    setUsageStats: (state, action: PayloadAction<UsageStats[]>) => {
      state.usageStats = action.payload;
    },

    // Network Analytics
    addNetworkAnalytics: (state, action: PayloadAction<NetworkAnalytics>) => {
      state.networkAnalytics.push(action.payload);
    },

    setNetworkAnalytics: (state, action: PayloadAction<NetworkAnalytics[]>) => {
      state.networkAnalytics = action.payload;
    },

    // Business Metrics
    addBusinessMetrics: (state, action: PayloadAction<BusinessMetrics>) => {
      state.businessMetrics.push(action.payload);
    },

    setBusinessMetrics: (state, action: PayloadAction<BusinessMetrics[]>) => {
      state.businessMetrics = action.payload;
    },

    // Time Range
    setTimeRange: (state, action: PayloadAction<Partial<typeof initialState.timeRange>>) => {
      state.timeRange = { ...state.timeRange, ...action.payload };
    },

    // Loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Reports
    addReport: (state, action: PayloadAction<ReportConfig>) => {
      state.reports.push(action.payload);
    },

    updateReport: (state, action: PayloadAction<{ id: string; updates: Partial<ReportConfig> }>) => {
      const index = state.reports.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.reports[index] = { ...state.reports[index], ...action.payload.updates };
      }
    },

    removeReport: (state, action: PayloadAction<string>) => {
      state.reports = state.reports.filter(r => r.id !== action.payload);
    },

    addGeneratedReport: (state, action: PayloadAction<typeof initialState.generatedReports[0]>) => {
      state.generatedReports.push(action.payload);
    },

    // Alerts
    addAlert: (state, action: PayloadAction<Omit<typeof initialState.alerts[0], 'id' | 'timestamp' | 'acknowledged'>>) => {
      const alert = {
        ...action.payload,
        id: `alert_${Date.now()}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };
      state.alerts.push(alert);
    },

    acknowledgeAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert) {
        alert.acknowledged = true;
      }
    },

    resolveAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert) {
        alert.resolvedAt = new Date().toISOString();
      }
    },

    clearResolvedAlerts: (state) => {
      state.alerts = state.alerts.filter(alert => !alert.resolvedAt);
    },

    // Thresholds
    updateThreshold: (state, action: PayloadAction<{ metric: string; threshold: Partial<typeof initialState.thresholds[string]> }>) => {
      if (state.thresholds[action.payload.metric]) {
        state.thresholds[action.payload.metric] = {
          ...state.thresholds[action.payload.metric],
          ...action.payload.threshold,
        };
      } else {
        state.thresholds[action.payload.metric] = {
          enabled: true,
          ...action.payload.threshold,
        };
      }
    },

    // Dashboard Layout
    updateDashboardLayout: (state, action: PayloadAction<typeof initialState.dashboardLayout>) => {
      state.dashboardLayout = action.payload;
    },

    addDashboardWidget: (state, action: PayloadAction<typeof initialState.dashboardLayout[0]>) => {
      state.dashboardLayout.push(action.payload);
    },

    removeDashboardWidget: (state, action: PayloadAction<string>) => {
      state.dashboardLayout = state.dashboardLayout.filter(widget => widget.id !== action.payload);
    },

    // Export
    setExporting: (state, action: PayloadAction<{ exporting: boolean; progress?: number }>) => {
      state.isExporting = action.payload.exporting;
      if (action.payload.progress !== undefined) {
        state.exportProgress = action.payload.progress;
      }
    },
  },
});

export const {
  addMetric,
  updateMetric,
  setMetrics,
  addPerformanceData,
  setPerformanceData,
  addUsageStats,
  setUsageStats,
  addNetworkAnalytics,
  setNetworkAnalytics,
  addBusinessMetrics,
  setBusinessMetrics,
  setTimeRange,
  setLoading,
  addReport,
  updateReport,
  removeReport,
  addGeneratedReport,
  addAlert,
  acknowledgeAlert,
  resolveAlert,
  clearResolvedAlerts,
  updateThreshold,
  updateDashboardLayout,
  addDashboardWidget,
  removeDashboardWidget,
  setExporting,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;