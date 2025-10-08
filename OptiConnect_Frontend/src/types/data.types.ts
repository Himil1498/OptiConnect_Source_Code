import type {
  BaseEntity,
  Coordinates,
  TelecomCompany,
  NetworkTechnology,
  FrequencyBand,
  TowerStatus,
  InfrastructureType,
  SignalQuality,
  CoverageType,
  IndianState,
  Region,
  DataQuality,
  FileFormat,
  ImportConfig,
} from './common.types';

// Core Infrastructure Types
export interface TelecomTower extends BaseEntity {
  name: string;
  type: InfrastructureType;
  position: Coordinates;
  status: TowerStatus;
  company: TelecomCompany;

  // Physical specifications
  height: number; // in meters
  structure_type: 'monopole' | 'lattice' | 'concealed' | 'rooftop' | 'water_tank' | 'building';
  foundation_type: 'concrete' | 'steel' | 'guyed' | 'self_supporting';

  // Technical specifications
  frequency_bands: FrequencyBand[];
  technologies: NetworkTechnology[];
  max_capacity: number; // in users/Mbps
  power_consumption: number; // in watts
  backup_power: {
    type: 'battery' | 'generator' | 'solar' | 'hybrid';
    capacity: number; // in hours
    auto_start: boolean;
  };

  // Coverage information
  coverage_radius: number; // in meters
  azimuth_angles: number[]; // antenna directions
  tilt_angles: number[]; // antenna tilts

  // Administrative data
  license_number: string;
  installation_date: string;
  last_maintenance: string;
  next_maintenance: string;
  maintenance_contract: string;

  // Location details
  address: {
    street: string;
    city: string;
    state: IndianState;
    pincode: string;
    landmark?: string;
  };
  land_details: {
    ownership: 'owned' | 'leased' | 'shared';
    lease_expiry?: string;
    area: number; // in sq meters
    cost_per_month?: number;
  };

  // Technical specifications
  equipment: TowerEquipment[];
  antennas: AntennaDetails[];

  // Compliance and safety
  compliance_certificates: ComplianceCertificate[];
  safety_measures: SafetyMeasure[];
  environmental_clearance: boolean;

  // Performance metrics
  performance: TowerPerformance;

  // Connectivity
  backhaul: BackhaulConnection[];

  // Additional metadata
  photos: string[];
  documents: string[];
  notes: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Data quality
  data_quality: DataQuality;
}

export interface TowerEquipment {
  id: string;
  type: 'bts' | 'rru' | 'antenna' | 'combiner' | 'amplifier' | 'filter' | 'cabinet' | 'other';
  manufacturer: string;
  model: string;
  serial_number: string;
  installation_date: string;
  warranty_expiry: string;
  status: 'active' | 'inactive' | 'maintenance' | 'faulty';
  specifications: Record<string, any>;
}

export interface AntennaDetails {
  id: string;
  type: 'panel' | 'omni' | 'yagi' | 'parabolic' | 'sector';
  frequency_range: string;
  gain: number; // in dBi
  azimuth: number; // in degrees
  tilt: number; // in degrees
  height_agl: number; // height above ground level
  polarization: 'vertical' | 'horizontal' | 'circular' | 'dual';
  manufacturer: string;
  model: string;
}

export interface ComplianceCertificate {
  type: 'dot' | 'pollution_board' | 'fire_safety' | 'structural' | 'emi' | 'other';
  certificate_number: string;
  issued_by: string;
  issue_date: string;
  expiry_date: string;
  status: 'valid' | 'expired' | 'pending_renewal';
  document_url?: string;
}

export interface SafetyMeasure {
  type: 'lightning_arrester' | 'earthing' | 'fire_extinguisher' | 'safety_signage' | 'fencing' | 'security';
  description: string;
  installation_date: string;
  last_inspection: string;
  next_inspection: string;
  status: 'compliant' | 'non_compliant' | 'needs_attention';
}

export interface TowerPerformance {
  uptime: number; // percentage
  throughput: number; // in Mbps
  latency: number; // in ms
  packet_loss: number; // percentage
  active_users: number;
  peak_users: number;
  signal_strength: number; // in dBm
  quality_index: number; // 0-100
  last_measured: string;
}

export interface BackhaulConnection {
  id: string;
  type: 'fiber' | 'microwave' | 'satellite' | 'copper';
  provider: string;
  bandwidth: number; // in Mbps
  latency: number; // in ms
  redundancy: boolean;
  cost_per_month: number;
  contract_expiry: string;
  status: 'active' | 'inactive' | 'backup';
}

// Network Coverage Types
export interface NetworkCoverage extends BaseEntity {
  tower_id: string;
  technology: NetworkTechnology;
  frequency_band: FrequencyBand;
  coverage_type: CoverageType;

  // Geographic coverage
  coverage_area: Coordinates[]; // polygon coordinates
  signal_strength: SignalQualityData[];

  // Performance metrics
  quality_metrics: CoverageQualityMetrics;
  capacity_metrics: CapacityMetrics;

  // Analysis data
  population_covered: number;
  area_covered: number; // in sq km
  predicted_vs_actual: {
    predicted_coverage: Coordinates[];
    actual_coverage: Coordinates[];
    accuracy: number; // percentage
  };

  // Interference data
  interference_sources: InterferenceSource[];

  // Testing data
  drive_test_data: DriveTestResult[];
  customer_complaints: number;

  metadata: Record<string, any>;
}

export interface SignalQualityData {
  position: Coordinates;
  rssi: number; // Received Signal Strength Indicator (dBm)
  rsrp: number; // Reference Signal Received Power (dBm)
  rsrq: number; // Reference Signal Received Quality (dB)
  sinr: number; // Signal to Interference plus Noise Ratio (dB)
  quality: SignalQuality;
  timestamp: string;
}

export interface CoverageQualityMetrics {
  average_rssi: number;
  min_rssi: number;
  max_rssi: number;
  coverage_probability: number; // percentage
  quality_distribution: Record<SignalQuality, number>;
  handover_success_rate: number; // percentage
  call_drop_rate: number; // percentage
  blocked_call_rate: number; // percentage
}

export interface CapacityMetrics {
  max_throughput: number; // in Mbps
  average_throughput: number; // in Mbps
  peak_hour_utilization: number; // percentage
  concurrent_users: number;
  data_volume: number; // in GB
  voice_minutes: number;
  sms_count: number;
}

export interface InterferenceSource {
  source_type: 'co_channel' | 'adjacent_channel' | 'intermodulation' | 'external';
  interference_level: number; // in dB
  source_location?: Coordinates;
  frequency_affected: FrequencyBand;
  impact_severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation_actions: string[];
}

export interface DriveTestResult {
  id: string;
  test_date: string;
  route: Coordinates[];
  technology: NetworkTechnology;
  measurements: {
    position: Coordinates;
    timestamp: string;
    rssi: number;
    throughput_dl: number; // download throughput
    throughput_ul: number; // upload throughput
    latency: number;
    serving_cell: string;
  }[];
  summary: {
    total_distance: number; // in km
    coverage_percentage: number;
    average_throughput: number;
    worst_spots: Coordinates[];
  };
}

// Data Import/Export Types
export interface DataImportJob extends BaseEntity {
  type: 'towers' | 'coverage' | 'performance' | 'maintenance';
  status: 'pending' | 'processing' | 'validating' | 'completed' | 'failed' | 'cancelled';
  file_info: {
    name: string;
    size: number;
    format: FileFormat;
    checksum: string;
    upload_url: string;
  };

  configuration: ImportConfig;

  progress: {
    total_records: number;
    processed_records: number;
    valid_records: number;
    invalid_records: number;
    percentage: number;
  };

  validation_results: {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    summary: Record<string, number>;
  };

  result: {
    imported_records: number;
    updated_records: number;
    skipped_records: number;
    error_records: number;
  };

  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;

  metadata: {
    source: string;
    imported_by: string;
    notes?: string;
  };
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  error_code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  row: number;
  field: string;
  value: any;
  warning_code: string;
  message: string;
  suggestion?: string;
}

export interface DataExportJob extends BaseEntity {
  type: 'towers' | 'coverage' | 'analytics' | 'reports';
  format: 'csv' | 'excel' | 'json' | 'pdf' | 'kml' | 'geojson';
  status: 'pending' | 'processing' | 'completed' | 'failed';

  filters: {
    date_range?: { start: string; end: string };
    companies?: TelecomCompany[];
    states?: IndianState[];
    tower_types?: InfrastructureType[];
    technologies?: NetworkTechnology[];
    custom_filters?: Record<string, any>;
  };

  options: {
    include_coordinates: boolean;
    include_performance: boolean;
    include_equipment: boolean;
    include_compliance: boolean;
    coordinate_format: 'decimal' | 'dms';
    date_format: string;
  };

  result?: {
    file_url: string;
    file_size: number;
    record_count: number;
    expires_at: string;
  };

  requested_by: string;
  estimated_completion?: string;
  started_at?: string;
  completed_at?: string;
}

// Filtering and Search Types
export interface DataFilter {
  companies: TelecomCompany[];
  states: IndianState[];
  regions: Region[];
  tower_types: InfrastructureType[];
  technologies: NetworkTechnology[];
  status_filters: TowerStatus[];
  date_range?: { start: string; end: string };
  height_range?: { min: number; max: number };
  coverage_radius_range?: { min: number; max: number };
  signal_strength_range?: { min: number; max: number };
  geographic_bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  custom_attributes?: Record<string, any>;
}

export interface SearchQuery {
  text: string;
  fields: string[];
  filters?: Partial<DataFilter>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

// Data Quality and Validation
export interface DataQualityReport {
  entity_type: 'towers' | 'coverage';
  total_records: number;
  quality_score: number; // 0-100

  completeness: {
    score: number;
    missing_fields: Array<{
      field: string;
      missing_count: number;
      percentage: number;
    }>;
  };

  accuracy: {
    score: number;
    issues: Array<{
      field: string;
      issue_type: string;
      affected_records: number;
    }>;
  };

  consistency: {
    score: number;
    conflicts: Array<{
      field: string;
      conflict_type: string;
      records: string[];
    }>;
  };

  timeliness: {
    score: number;
    outdated_records: number;
    average_age: number; // in days
  };

  recommendations: DataQualityRecommendation[];

  generated_at: string;
  generated_by: string;
}

export interface DataQualityRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'completeness' | 'accuracy' | 'consistency' | 'timeliness';
  description: string;
  affected_records: number;
  suggested_action: string;
  effort_estimate: 'low' | 'medium' | 'high';
}

// Bulk Operations
export interface BulkOperation extends BaseEntity {
  type: 'update' | 'delete' | 'status_change' | 'assign_company' | 'add_tags';
  target_entity: 'towers' | 'coverage';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  selection_criteria: {
    ids?: string[];
    filters?: Partial<DataFilter>;
    query?: string;
  };

  operation_data: Record<string, any>;

  progress: {
    total_records: number;
    processed_records: number;
    successful_records: number;
    failed_records: number;
    percentage: number;
  };

  errors: Array<{
    record_id: string;
    error_message: string;
    error_code: string;
  }>;

  initiated_by: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
}