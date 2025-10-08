import type { BaseEntity, DateRange, TelecomCompany, NetworkTechnology } from './common.types';

// Core Analytics Types
export interface AnalyticsMetric extends BaseEntity {
  name: string;
  display_name: string;
  value: number;
  unit: string;
  category: MetricCategory;
  type: MetricType;
  aggregation: AggregationType;
  tags: string[];
  metadata: Record<string, any>;
}

export type MetricCategory =
  | 'performance'
  | 'usage'
  | 'network'
  | 'business'
  | 'operational'
  | 'quality'
  | 'capacity'
  | 'revenue'
  | 'customer'
  | 'security';

export type MetricType =
  | 'counter'
  | 'gauge'
  | 'histogram'
  | 'timer'
  | 'rate'
  | 'percentage'
  | 'currency'
  | 'bytes'
  | 'duration';

export type AggregationType =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'distinct'
  | 'percentile'
  | 'stddev'
  | 'variance';

// Time Series Data
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeriesMetric {
  metric_id: string;
  name: string;
  data_points: TimeSeriesData[];
  granularity: TimeGranularity;
  range: DateRange;
  aggregation: AggregationType;
}

export type TimeGranularity =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

// Performance Analytics
export interface PerformanceMetrics {
  timestamp: string;
  system: SystemPerformance;
  application: ApplicationPerformance;
  network: NetworkPerformance;
  user_experience: UserExperienceMetrics;
}

export interface SystemPerformance {
  cpu_usage: number; // percentage
  memory_usage: number; // percentage
  disk_usage: number; // percentage
  disk_io: {
    read_ops: number;
    write_ops: number;
    read_bytes: number;
    write_bytes: number;
  };
  network_io: {
    bytes_in: number;
    bytes_out: number;
    packets_in: number;
    packets_out: number;
  };
  load_average: number[];
  uptime: number; // seconds
}

export interface ApplicationPerformance {
  response_time: number; // milliseconds
  throughput: number; // requests per second
  error_rate: number; // percentage
  active_sessions: number;
  concurrent_users: number;
  database: {
    query_time: number;
    connections: number;
    slow_queries: number;
  };
  cache: {
    hit_rate: number;
    miss_rate: number;
    evictions: number;
  };
  gc_metrics: {
    collections: number;
    time_spent: number;
    heap_size: number;
  };
}

export interface NetworkPerformance {
  latency: number; // milliseconds
  bandwidth_utilization: number; // percentage
  packet_loss: number; // percentage
  jitter: number; // milliseconds
  connection_count: number;
  failed_connections: number;
  ssl_handshake_time: number;
  dns_resolution_time: number;
}

export interface UserExperienceMetrics {
  page_load_time: number;
  time_to_interactive: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  cumulative_layout_shift: number;
  first_input_delay: number;
  session_duration: number;
  bounce_rate: number;
  user_satisfaction_score: number;
}

// Business Analytics
export interface BusinessMetrics {
  timestamp: string;
  revenue: RevenueMetrics;
  costs: CostMetrics;
  roi: ROIMetrics;
  market: MarketMetrics;
  customer: CustomerMetrics;
}

export interface RevenueMetrics {
  total_revenue: number;
  recurring_revenue: number;
  one_time_revenue: number;
  revenue_per_tower: number;
  revenue_per_customer: number;
  growth_rate: number;
  forecast: number;
  by_company: Record<TelecomCompany, number>;
  by_technology: Record<NetworkTechnology, number>;
  by_region: Record<string, number>;
}

export interface CostMetrics {
  operational_costs: number;
  maintenance_costs: number;
  infrastructure_costs: number;
  personnel_costs: number;
  utility_costs: number;
  licensing_costs: number;
  cost_per_tower: number;
  cost_per_customer: number;
  cost_breakdown: Record<string, number>;
}

export interface ROIMetrics {
  total_roi: number;
  tower_roi: number;
  technology_roi: Record<NetworkTechnology, number>;
  payback_period: number; // months
  net_present_value: number;
  internal_rate_of_return: number;
  break_even_point: string; // date
}

export interface MarketMetrics {
  market_share: number;
  market_penetration: number;
  competitive_position: string;
  growth_opportunities: number;
  threat_level: 'low' | 'medium' | 'high';
  market_trends: MarketTrend[];
}

export interface MarketTrend {
  trend_name: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number; // percentage
  time_horizon: 'short' | 'medium' | 'long';
  affected_metrics: string[];
}

export interface CustomerMetrics {
  total_customers: number;
  active_customers: number;
  new_customers: number;
  churned_customers: number;
  churn_rate: number;
  customer_lifetime_value: number;
  customer_acquisition_cost: number;
  customer_satisfaction: number;
  net_promoter_score: number;
  support_tickets: number;
  resolution_time: number;
}

// Network Analytics
export interface NetworkAnalytics {
  timestamp: string;
  coverage: CoverageAnalytics;
  quality: QualityAnalytics;
  capacity: CapacityAnalytics;
  utilization: UtilizationAnalytics;
  incidents: IncidentAnalytics;
}

export interface CoverageAnalytics {
  total_coverage_area: number; // sq km
  population_covered: number;
  coverage_percentage: number;
  indoor_coverage: number;
  outdoor_coverage: number;
  rural_coverage: number;
  urban_coverage: number;
  coverage_gaps: CoverageGap[];
  redundancy_level: number;
  by_technology: Record<NetworkTechnology, number>;
  by_company: Record<TelecomCompany, number>;
}

export interface CoverageGap {
  id: string;
  location: { lat: number; lng: number };
  area: number; // sq km
  population_affected: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_cost: number;
  expected_revenue: number;
  timeline: string;
}

export interface QualityAnalytics {
  overall_quality_score: number;
  signal_strength_avg: number;
  call_success_rate: number;
  call_drop_rate: number;
  handover_success_rate: number;
  data_session_success_rate: number;
  voice_quality_score: number;
  data_throughput_avg: number;
  latency_avg: number;
  quality_issues: QualityIssue[];
  sla_compliance: number;
}

export interface QualityIssue {
  id: string;
  type: 'coverage' | 'interference' | 'capacity' | 'equipment' | 'configuration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_towers: string[];
  impact_area: number; // sq km
  customers_affected: number;
  duration: number; // minutes
  root_cause?: string;
  resolution_time?: number;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
}

export interface CapacityAnalytics {
  total_capacity: number; // Mbps
  used_capacity: number; // Mbps
  utilization_percentage: number;
  peak_utilization: number;
  capacity_per_tower: number;
  capacity_growth_rate: number;
  bottlenecks: CapacityBottleneck[];
  expansion_needs: ExpansionNeed[];
  efficiency_score: number;
}

export interface CapacityBottleneck {
  tower_id: string;
  utilization: number;
  max_capacity: number;
  peak_demand: number;
  time_periods: string[];
  impact_severity: 'low' | 'medium' | 'high' | 'critical';
  recommended_action: string;
}

export interface ExpansionNeed {
  location: { lat: number; lng: number };
  projected_demand: number;
  current_capacity: number;
  capacity_gap: number;
  priority_score: number;
  investment_required: number;
  expected_roi: number;
  timeline: string;
}

export interface UtilizationAnalytics {
  average_utilization: number;
  peak_utilization: number;
  off_peak_utilization: number;
  utilization_trends: TimeSeriesData[];
  utilization_by_hour: Record<string, number>;
  utilization_by_day: Record<string, number>;
  utilization_by_location: Record<string, number>;
  efficiency_opportunities: EfficiencyOpportunity[];
}

export interface EfficiencyOpportunity {
  type: 'load_balancing' | 'capacity_upgrade' | 'configuration_optimization' | 'equipment_upgrade';
  description: string;
  affected_towers: string[];
  potential_improvement: number; // percentage
  implementation_cost: number;
  implementation_time: number; // days
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface IncidentAnalytics {
  total_incidents: number;
  open_incidents: number;
  resolved_incidents: number;
  average_resolution_time: number; // hours
  incident_types: Record<string, number>;
  incident_severity: Record<string, number>;
  mttr: number; // mean time to repair
  mtbf: number; // mean time between failures
  availability: number; // percentage
  sla_breaches: number;
  incident_trends: TimeSeriesData[];
}

// Reporting
export interface Report extends BaseEntity {
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  format: ReportFormat;
  schedule: ReportSchedule;
  recipients: string[];
  filters: ReportFilters;
  charts: ChartConfiguration[];
  tables: TableConfiguration[];
  status: ReportStatus;
  file_url?: string;
  file_size?: number;
  generation_time?: number; // seconds
  last_generated?: string;
  next_generation?: string;
}

export type ReportType =
  | 'dashboard'
  | 'summary'
  | 'detailed'
  | 'executive'
  | 'operational'
  | 'regulatory'
  | 'custom';

export type ReportCategory =
  | 'performance'
  | 'business'
  | 'network'
  | 'financial'
  | 'operational'
  | 'compliance'
  | 'analytics';

export type ReportFormat =
  | 'pdf'
  | 'excel'
  | 'csv'
  | 'json'
  | 'html'
  | 'powerpoint';

export interface ReportSchedule {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_week?: number; // 0-6
  day_of_month?: number; // 1-31
  time: string; // HH:mm
  timezone: string;
  auto_send: boolean;
  retention_days: number;
}

export interface ReportFilters {
  date_range: DateRange;
  companies?: TelecomCompany[];
  technologies?: NetworkTechnology[];
  regions?: string[];
  tower_types?: string[];
  custom_filters?: Record<string, any>;
}

export type ReportStatus =
  | 'draft'
  | 'scheduled'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Charts and Visualizations
export interface ChartConfiguration {
  id: string;
  type: ChartType;
  title: string;
  description?: string;
  data_source: DataSource;
  x_axis: AxisConfiguration;
  y_axis: AxisConfiguration;
  series: SeriesConfiguration[];
  styling: ChartStyling;
  interactions: ChartInteractions;
}

export type ChartType =
  | 'line'
  | 'bar'
  | 'column'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'gauge'
  | 'funnel'
  | 'treemap'
  | 'sankey'
  | 'waterfall'
  | 'candlestick'
  | 'radar';

export interface DataSource {
  type: 'metric' | 'query' | 'api' | 'static';
  source: string;
  parameters?: Record<string, any>;
  refresh_interval?: number;
  cache_duration?: number;
}

export interface AxisConfiguration {
  title: string;
  type: 'category' | 'value' | 'time' | 'log';
  min?: number;
  max?: number;
  format?: string;
  unit?: string;
  grid: boolean;
  labels: boolean;
}

export interface SeriesConfiguration {
  name: string;
  type?: ChartType;
  data_field: string;
  color?: string;
  line_style?: 'solid' | 'dashed' | 'dotted';
  marker?: boolean;
  fill?: boolean;
  stack?: string;
  y_axis?: 'primary' | 'secondary';
}

export interface ChartStyling {
  colors: string[];
  font_family: string;
  font_size: number;
  background_color: string;
  grid_color: string;
  legend: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  animation: boolean;
  responsive: boolean;
}

export interface ChartInteractions {
  zoom: boolean;
  pan: boolean;
  selection: boolean;
  tooltip: boolean;
  crosshair: boolean;
  click_events: boolean;
  export: boolean;
}

// Table Configuration
export interface TableConfiguration {
  id: string;
  title: string;
  data_source: DataSource;
  columns: TableColumn[];
  pagination: TablePagination;
  sorting: TableSorting;
  filtering: TableFiltering;
  styling: TableStyling;
}

export interface TableColumn {
  field: string;
  title: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean' | 'custom';
  width?: number;
  format?: string;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
  alignment: 'left' | 'center' | 'right';
  renderer?: string;
}

export interface TablePagination {
  enabled: boolean;
  page_size: number;
  page_sizes: number[];
  show_info: boolean;
}

export interface TableSorting {
  enabled: boolean;
  multiple: boolean;
  default_sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface TableFiltering {
  enabled: boolean;
  quick_filter: boolean;
  advanced_filter: boolean;
  filter_operators: string[];
}

export interface TableStyling {
  striped_rows: boolean;
  bordered: boolean;
  hover_effect: boolean;
  compact: boolean;
  header_styling: Record<string, any>;
  row_styling: Record<string, any>;
}

// Alerts and Monitoring
export interface Alert extends BaseEntity {
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  condition: AlertCondition;
  notifications: AlertNotification[];
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  metadata: Record<string, any>;
}

export type AlertType =
  | 'threshold'
  | 'anomaly'
  | 'trend'
  | 'pattern'
  | 'composite'
  | 'external';

export type AlertSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type AlertStatus =
  | 'active'
  | 'acknowledged'
  | 'resolved'
  | 'suppressed'
  | 'expired';

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'between' | 'not_between';
  threshold: number | number[];
  duration: number; // minutes
  aggregation: AggregationType;
  filters?: Record<string, any>;
}

export interface AlertNotification {
  channel: 'email' | 'sms' | 'slack' | 'webhook' | 'push';
  recipients: string[];
  template: string;
  delay: number; // minutes
  repeat_interval?: number; // minutes
  max_repeats?: number;
}

// Data Export
export interface DataExport extends BaseEntity {
  name: string;
  type: 'analytics' | 'reports' | 'raw_data' | 'dashboards';
  format: 'csv' | 'excel' | 'json' | 'pdf' | 'api';
  filters: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // percentage
  file_url?: string;
  file_size?: number;
  download_count: number;
  expires_at: string;
  requested_by: string;
}