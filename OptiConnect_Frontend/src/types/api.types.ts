import type { User } from './auth.types';
import type { TelecomTower, NetworkCoverage, DataImportJob, DataExportJob } from './data.types';
import type { AnalyticsMetric, Report } from './analytics.types';

// Base API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
  meta?: ApiMeta;
  timestamp: string;
  request_id: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ApiMeta {
  total?: number;
  page?: number;
  limit?: number;
  offset?: number;
  has_next?: boolean;
  has_previous?: boolean;
  total_pages?: number;
  filters_applied?: Record<string, any>;
  sort_applied?: {
    field: string;
    order: 'asc' | 'desc';
  };
  execution_time?: number; // milliseconds
  cache_hit?: boolean;
  version?: string;
}

// Request/Response Wrappers
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiMeta & {
    total: number;
    page: number;
    limit: number;
  };
}

export interface SearchResponse<T> extends PaginatedResponse<T> {
  facets?: Record<string, FacetResult[]>;
  suggestions?: string[];
  query_time?: number;
}

export interface FacetResult {
  value: string;
  count: number;
  selected?: boolean;
}

// API Configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'api_key';
    token?: string;
    username?: string;
    password?: string;
    api_key?: string;
  };
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
    max_size: number;
  };
}

// Request Options
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  cache?: boolean;
  retry?: boolean;
  signal?: AbortSignal;
}

// Authentication API
export interface LoginRequest {
  email: string;
  password: string;
  company?: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string[];
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
  reset_token_sent: boolean;
}

export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

// Tower Management API
export interface GetTowersRequest {
  filters?: {
    companies?: string[];
    states?: string[];
    types?: string[];
    status?: string[];
    technologies?: string[];
    date_range?: {
      start: string;
      end: string;
    };
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  search?: string;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
  include?: string[]; // related data to include
}

export interface CreateTowerRequest {
  tower: Omit<TelecomTower, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateTowerRequest {
  tower_id: string;
  updates: Partial<TelecomTower>;
}

export interface BulkTowerOperationRequest {
  operation: 'update' | 'delete' | 'status_change' | 'assign_company';
  tower_ids?: string[];
  filters?: GetTowersRequest['filters'];
  data?: Record<string, any>;
}

export interface BulkTowerOperationResponse {
  operation_id: string;
  total_affected: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: {
    successful: number;
    failed: number;
    errors: Array<{
      tower_id: string;
      error: string;
    }>;
  };
}

// Coverage API
export interface GetCoverageRequest {
  tower_id?: string;
  technology?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  quality_threshold?: number;
  include_predicted?: boolean;
}

export interface CoverageAnalysisRequest {
  location: { lat: number; lng: number };
  technologies: string[];
  radius?: number; // meters
}

export interface CoverageAnalysisResponse {
  location: { lat: number; lng: number };
  coverage_results: Array<{
    technology: string;
    covered: boolean;
    signal_strength: number;
    quality: string;
    serving_towers: Array<{
      tower_id: string;
      distance: number;
      signal_contribution: number;
    }>;
  }>;
  overall_score: number;
  recommendations: string[];
}

// Analytics API
export interface GetAnalyticsRequest {
  metrics: string[];
  time_range: {
    start: string;
    end: string;
    granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  };
  filters?: {
    companies?: string[];
    regions?: string[];
    tower_types?: string[];
    technologies?: string[];
  };
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  group_by?: string[];
}

export interface AnalyticsData {
  metric: string;
  value: number;
  timestamp: string;
  dimensions?: Record<string, string>;
}

export interface GetAnalyticsResponse {
  metrics: AnalyticsData[];
  summary: {
    total_data_points: number;
    time_range: {
      start: string;
      end: string;
    };
    aggregations: Record<string, number>;
  };
}

// Reporting API
export interface CreateReportRequest {
  report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
}

export interface GenerateReportRequest {
  report_id: string;
  parameters?: Record<string, any>;
  format?: 'pdf' | 'excel' | 'csv';
  delivery?: {
    method: 'download' | 'email' | 'api';
    recipients?: string[];
  };
}

export interface GenerateReportResponse {
  job_id: string;
  estimated_completion: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  download_url?: string;
}

// Data Import/Export API
export interface ImportDataRequest {
  file: File;
  type: 'towers' | 'coverage' | 'analytics';
  format: 'csv' | 'excel' | 'json' | 'kml';
  options: {
    has_header?: boolean;
    delimiter?: string;
    encoding?: string;
    mapping?: Record<string, string>;
    validation_rules?: Array<{
      field: string;
      rule: string;
      message: string;
    }>;
  };
}

export interface ImportDataResponse {
  import_job: DataImportJob;
  upload_url?: string; // for large files
}

export interface ExportDataRequest {
  type: 'towers' | 'coverage' | 'analytics' | 'reports';
  format: 'csv' | 'excel' | 'json' | 'pdf' | 'kml';
  filters?: Record<string, any>;
  options?: {
    include_headers?: boolean;
    date_format?: string;
    coordinate_format?: 'decimal' | 'dms';
    compression?: boolean;
  };
}

export interface ExportDataResponse {
  export_job: DataExportJob;
}

// Real-time Updates
export interface WebSocketMessage {
  type: string;
  event: string;
  data: any;
  timestamp: string;
  channel?: string;
}

export interface SubscriptionRequest {
  channels: string[];
  filters?: Record<string, any>;
}

export interface SubscriptionResponse {
  subscription_id: string;
  channels: string[];
  status: 'active' | 'inactive';
}

// File Upload
export interface FileUploadRequest {
  file: File;
  type: 'avatar' | 'document' | 'import' | 'attachment';
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  file_id: string;
  file_url: string;
  filename: string;
  size: number;
  content_type: string;
  checksum: string;
  upload_completed: boolean;
}

export interface MultipartUploadRequest {
  filename: string;
  size: number;
  content_type: string;
  chunk_size?: number;
}

export interface MultipartUploadResponse {
  upload_id: string;
  chunk_urls: string[];
  chunk_size: number;
  total_chunks: number;
}

// Health and Status
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: Record<string, ServiceHealth>;
  environment: string;
  uptime: number;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  response_time?: number;
  last_check: string;
  message?: string;
  dependencies?: Record<string, ServiceHealth>;
}

export interface SystemMetricsResponse {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  request_rate: number;
  error_rate: number;
  response_time_avg: number;
  timestamp: string;
}

// API Rate Limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retry_after?: number; // seconds
}

export interface RateLimitResponse extends ApiResponse {
  rate_limit: RateLimitInfo;
}

// Webhooks
export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  ssl_verification: boolean;
  content_type: 'json' | 'form';
  headers?: Record<string, string>;
  timeout: number;
  retry_policy: {
    max_attempts: number;
    backoff_strategy: 'linear' | 'exponential';
    base_delay: number;
  };
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature: string;
  delivery_id: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  response_code?: number;
  response_body?: string;
  created_at: string;
  delivered_at?: string;
}

// API Documentation
export interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description?: string;
  parameters?: ApiParameter[];
  request_body?: ApiRequestBody;
  responses: Record<string, ApiResponse>;
  security?: string[];
  tags?: string[];
  deprecated?: boolean;
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  description?: string;
  schema: any;
  example?: any;
}

export interface ApiRequestBody {
  description?: string;
  content: Record<string, {
    schema: any;
    example?: any;
  }>;
  required: boolean;
}

// Error Handling
export interface ApiErrorDetails {
  code: string;
  message: string;
  documentation_url?: string;
  request_id: string;
  timestamp: string;
  path: string;
  method: string;
  status: number;
  details?: Record<string, any>;
  stack_trace?: string[];
}

export interface ValidationErrorResponse extends ApiResponse {
  errors: Array<{
    field: string;
    code: string;
    message: string;
    value?: any;
  }>;
}

// Caching
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  max_size: number; // Maximum cache size in MB
  strategies: CacheStrategy[];
}

export interface CacheStrategy {
  pattern: string; // URL pattern to match
  ttl: number;
  vary?: string[]; // Headers to vary cache by
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  hit_rate: number;
  size: number; // Current cache size in MB
  entries: number;
  evictions: number;
}