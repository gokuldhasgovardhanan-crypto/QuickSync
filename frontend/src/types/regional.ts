export interface PlatformActivityPictogram {
  platform: string;
  metric_name: string;
  raw_value: number;
  formatted_value: string;
  intensity_score: number; // 1 to 5 (🛒 🛒 🛒 🛒 🛒)
  percentage_of_region: number;
  is_open: boolean;
  avg_eta_minutes?: number;
}

export interface RegionActivityDetail {
  region_id: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  activity_level: 'HIGH ACTIVITY' | 'MEDIUM ACTIVITY' | 'LOW ACTIVITY';
  total_live_products: number;
  total_in_stock_products: number;
  availability_rate_pct: number;
  total_inventory_count: number;
  avg_delivery_eta_mins: number;
  active_platforms_count: number;
  sales_data_status: string;
  last_updated: string;
  data_freshness_seconds: number;
  platform_comparison: PlatformActivityPictogram[];
  top_products_in_region: Array<{
    product_id: string;
    name: string;
    brand: string;
    platform: string;
    category: string;
    rating?: number;
    image_url?: string;
  }>;
}

export interface IndiaRegionalMapData {
  selected_metric: string;
  total_monitored_regions: number;
  regions: RegionActivityDetail[];
  overall_leading_platform: string;
  generated_at: string;
}

export interface ViewSourceTraceability {
  region: string;
  platform: string;
  data_source: string;
  request_id: string;
  fetched_timestamp: string;
  store_id: string;
  raw_response_reference: string;
  metric_calculation: string;
  verified_real_data: boolean;
}
