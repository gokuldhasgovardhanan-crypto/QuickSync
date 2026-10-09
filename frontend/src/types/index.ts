export type UserRole = 'ADMIN' | 'OPERATOR' | 'ANALYST';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface NormalizedProductItem {
  platform: string;
  external_product_id: string;
  name: string;
  brand?: string;
  quantity?: string;
  mrp?: number;
  offer_price: number;
  discount_percentage?: number;
  available: boolean;
  inventory?: number;
  store_id?: string;
  rating?: number;
  rating_count?: number;
  eta_minutes?: number;
  image_url?: string;
  deeplink?: string;
  latitude?: number;
  longitude?: number;
  fetched_at: string;
  request_id?: string;
  raw_response_id?: string;
  currency?: string;
}

export interface LiveSearchResponse {
  query: string;
  location: {
    city: string;
    latitude: number;
    longitude: number;
    pincode: string;
  };
  total_results: number;
  data_source_status: 'LIVE' | 'OFFLINE' | 'RATE_LIMITED' | 'AUTH_ERROR' | 'DEGRADED';
  source_provider: string;
  latency_ms: number;
  request_id: string;
  fetched_at: string;
  products: NormalizedProductItem[];
  errors?: Array<{ error?: string; status_code?: number }>;
  is_cached: boolean;
  cache_age_seconds?: number;
}

export interface DashboardSummary {
  live_data_sources_count: number;
  active_platforms_count: number;
  total_products_fetched: number;
  in_stock_products_count: number;
  out_of_stock_products_count: number;
  avg_delivery_eta_minutes?: number;
  data_freshness_status: 'FRESH' | 'AGING' | 'STALE' | 'OFFLINE';
  last_fetched_at?: string;
  freshness_age_seconds?: number;
  api_health_status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'OFFLINE';
  reliability_score: number;
  recent_activity: Array<{
    type: string;
    platform: string;
    message: string;
    timestamp: string;
    severity: string;
  }>;
}

export interface PlatformHealth {
  platform: string;
  status: string;
  success_rate: number;
  avg_latency_ms: number;
  last_sync_at?: string;
  last_status_code?: number;
}

export interface ApiHealthMetric {
  total_requests: number;
  success_requests: number;
  failed_requests: number;
  success_rate: number;
  error_rate: number;
  avg_latency_ms: number;
  timeouts: number;
  rate_limits: number;
  last_successful_sync?: string;
  last_failed_sync?: string;
  platform_health: PlatformHealth[];
  hourly_latency_trend: Array<{
    time: string;
    avg_latency: number;
    requests: number;
    errors: number;
  }>;
}

export interface PlatformItem {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  is_active: boolean;
  status: 'LIVE' | 'DEGRADED' | 'OFFLINE' | 'RATE_LIMITED';
  last_sync_at?: string;
  last_latency_ms?: number;
  last_status_code?: number;
}

export interface AlertItem {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  platform?: string;
  message: string;
  details?: Record<string, any>;
  status: 'OPEN' | 'RESOLVED' | 'ACKNOWLEDGED';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface SyncRunItem {
  id: string;
  sync_job_id?: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PARTIAL';
  duration_ms: number;
  products_retrieved: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  api_calls: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface LocationItem {
  id: string;
  city: string;
  area?: string;
  latitude: number;
  longitude: number;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export interface PriceSnapshot {
  id: string;
  product_id: string;
  platform: string;
  mrp?: number;
  offer_price: number;
  discount_percentage?: number;
  currency: string;
  request_id?: string;
  fetched_at: string;
}

export interface InventorySnapshot {
  id: string;
  product_id: string;
  platform: string;
  store_id?: string;
  inventory?: number;
  available: boolean;
  request_id?: string;
  fetched_at: string;
}

export interface ProductDetail {
  id: string;
  external_product_id: string;
  platform: string;
  name: string;
  brand?: string;
  quantity?: string;
  image_url?: string;
  deeplink?: string;
  rating?: number;
  rating_count?: number;
  latest_price?: PriceSnapshot;
  latest_inventory?: InventorySnapshot;
  latest_eta?: number;
  price_history: PriceSnapshot[];
  inventory_history: InventorySnapshot[];
  created_at: string;
  updated_at: string;
}

export interface PlatformComparison {
  platform: string;
  price: number;
  mrp?: number;
  discount?: number;
  available: boolean;
  inventory?: number;
  eta_minutes?: number;
  store_id?: string;
  rating?: number;
  deeplink?: string;
  fetched_at: string;
  request_id?: string;
}

export interface SettingsData {
  quickcommerce_api_key_configured: boolean;
  quickcommerce_api_key_masked: string;
  default_city: string;
  default_area: string;
  default_latitude: number;
  default_longitude: number;
  default_pincode: string;
  sync_interval_seconds: number;
  api_timeout_seconds: number;
  max_retries: number;
}

export interface ViewSourceData {
  found: boolean;
  request_id: string;
  endpoint: string;
  platform?: string;
  request_timestamp: string;
  response_timestamp: string;
  status_code: number;
  latency_ms: number;
  response_json: any;
  credits_remaining?: number;
}

export interface DataQualityReport {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  completeness_percentage: number;
  duplicate_count: number;
  stale_records_count: number;
  api_errors_count: number;
  quality_score: number;
  validation_failures_summary: Array<{
    platform: string;
    item: string;
    errors: string[];
    checked_at: string;
  }>;
}
