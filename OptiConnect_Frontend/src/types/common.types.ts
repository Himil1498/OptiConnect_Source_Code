// Common types used across the application

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface TimeRange {
  startTime: string;
  endTime: string;
  timezone?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ProgressState {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}

// Telecom Industry Specific Types
export type TelecomCompany =
  | 'Jio'
  | 'Airtel'
  | 'Vi'
  | 'BSNL'
  | 'Idea'
  | 'Tata'
  | 'Reliance'
  | 'Sify'
  | 'Optimal Telemedia'
  | 'JTM Internet'
  | 'Other';

export type NetworkTechnology =
  | '2G'
  | '3G'
  | '4G'
  | '5G'
  | 'LTE'
  | 'NR'
  | 'GSM'
  | 'UMTS'
  | 'CDMA'
  | 'WiMAX'
  | 'Fiber';

export type FrequencyBand =
  | '700MHz'
  | '800MHz'
  | '850MHz'
  | '900MHz'
  | '1800MHz'
  | '2100MHz'
  | '2300MHz'
  | '2500MHz'
  | '3500MHz'
  | '26GHz'
  | 'mmWave';

export type TowerStatus =
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'error'
  | 'planned'
  | 'decommissioned';

export type InfrastructureType =
  | 'cell_tower'
  | 'base_station'
  | 'fiber_node'
  | 'repeater'
  | 'small_cell'
  | 'macrocell'
  | 'microcell'
  | 'picocell'
  | 'femtocell'
  | 'antenna'
  | 'hub'
  | 'exchange';

export type SignalQuality =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'no_signal';

export type CoverageType =
  | 'urban'
  | 'suburban'
  | 'rural'
  | 'highway'
  | 'indoor'
  | 'outdoor';

// User Roles and Permissions
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'analyst'
  | 'engineer'
  | 'technician'
  | 'viewer'
  | 'guest';

export type Permission =
  | 'read'
  | 'write'
  | 'delete'
  | 'admin'
  | 'all'
  | 'manage_team'
  | 'manage_users'
  | 'manage_towers'
  | 'manage_analytics'
  | 'export_data'
  | 'import_data'
  | 'view_reports'
  | 'create_reports'
  | 'system_config'
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'towers:create'
  | 'towers:read'
  | 'towers:update'
  | 'towers:delete'
  | 'analytics:read'
  | 'analytics:export'
  | 'settings:read'
  | 'settings:update'
  | 'audit:read';

// Geographic and Regional Types
export type IndianState =
  | 'Andhra Pradesh'
  | 'Arunachal Pradesh'
  | 'Assam'
  | 'Bihar'
  | 'Chhattisgarh'
  | 'Goa'
  | 'Gujarat'
  | 'Haryana'
  | 'Himachal Pradesh'
  | 'Jharkhand'
  | 'Karnataka'
  | 'Kerala'
  | 'Madhya Pradesh'
  | 'Maharashtra'
  | 'Manipur'
  | 'Meghalaya'
  | 'Mizoram'
  | 'Nagaland'
  | 'Odisha'
  | 'Punjab'
  | 'Rajasthan'
  | 'Sikkim'
  | 'Tamil Nadu'
  | 'Telangana'
  | 'Tripura'
  | 'Uttar Pradesh'
  | 'Uttarakhand'
  | 'West Bengal'
  | 'Delhi'
  | 'Jammu and Kashmir'
  | 'Ladakh'
  | 'Chandigarh'
  | 'Dadra and Nagar Haveli'
  | 'Daman and Diu'
  | 'Lakshadweep'
  | 'Puducherry'
  | 'Andaman and Nicobar Islands';

export type Region =
  | 'North'
  | 'South'
  | 'East'
  | 'West'
  | 'Central'
  | 'Northeast';

export type UrbanClassification =
  | 'metropolitan'
  | 'urban'
  | 'semi_urban'
  | 'rural'
  | 'remote';

// Environment and Deployment Types
export type Environment =
  | 'development'
  | 'staging'
  | 'production'
  | 'testing';

export type AppMode =
  | 'development'
  | 'production'
  | 'maintenance'
  | 'testing';

export type DeploymentMode =
  | 'cloud'
  | 'on_premise'
  | 'hybrid'
  | 'edge';

// Data Quality and Validation
export interface DataQuality {
  completeness: number; // 0-100%
  accuracy: number; // 0-100%
  consistency: number; // 0-100%
  timeliness: number; // 0-100%
  validity: number; // 0-100%
  lastUpdated: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  rule: string | RegExp | ((value: any) => boolean);
  message: string;
}

// File and Data Import/Export
export type FileFormat =
  | 'csv'
  | 'excel'
  | 'json'
  | 'xml'
  | 'kml'
  | 'geojson'
  | 'shp'
  | 'pdf';

export type ExportFormat =
  | 'csv'
  | 'excel'
  | 'json'
  | 'pdf'
  | 'png'
  | 'svg';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  checksum?: string;
}

export interface ImportConfig {
  format: FileFormat;
  hasHeader: boolean;
  delimiter?: string;
  encoding?: string;
  mapping: Record<string, string>;
  validation: ValidationRule[];
}

// Performance and Monitoring
export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: 'up' | 'down' | 'unknown';
    responseTime?: number;
    lastCheck: string;
  }>;
  timestamp: string;
}

// Feature Flags and Configuration
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  conditions?: Record<string, any>;
}

export interface AppConfiguration {
  features: FeatureFlag[];
  limits: {
    maxTowersPerRequest: number;
    maxExportSize: number;
    sessionTimeout: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
}

// Event and Audit Types
export type EventType =
  | 'user_action'
  | 'system_event'
  | 'data_change'
  | 'security_event'
  | 'performance_event';

export interface AuditEvent {
  id: string;
  type: EventType;
  action: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  metadata: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}