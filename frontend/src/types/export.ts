export interface ExportFilterRequest {
  brands?: string[];
  platforms?: string[];
  categories?: string[];
  location_id?: string;
  city?: string;
  date_from?: string;
  date_to?: string;
  include_sales_metrics?: boolean;
  include_identity_matches?: boolean;
  data_types?: string[];
}

export interface ExportOptions {
  brands: string[];
  platforms: string[];
  categories: string[];
  locations: Array<{
    id: string;
    city: string;
    area?: string;
    pincode: string;
  }>;
  available_metrics: string[];
  sales_data_notice: string;
}

export interface ExportMetadata {
  total_records: number;
  brands_count: number;
  platforms_count: number;
  generated_at: string;
  sales_data_status: string;
  file_size_estimate_kb: number;
}
