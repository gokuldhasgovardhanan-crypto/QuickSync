export type DemandClassification =
  | 'INCREASING_DEMAND'
  | 'STABLE_DEMAND'
  | 'DECLINING_DEMAND'
  | 'INSUFFICIENT_DATA';

export type LifecycleStatus =
  | 'ACTIVE'
  | 'UNDER_REVIEW'
  | 'REPLENISHMENT_RECOMMENDED'
  | 'REPLACEMENT_RECOMMENDED'
  | 'DISCONTINUATION_RECOMMENDED'
  | 'DISCONTINUED'
  | 'REPLACEMENT_COMPLETED';

export type RecommendationType =
  | 'REPLENISHMENT'
  | 'REPLACEMENT'
  | 'DISCONTINUATION'
  | 'KEEP_MONITORING'
  | 'INSUFFICIENT_DATA';

export interface CustomerFeedback {
  id: string;
  product_id: string;
  platform: string;
  customer_id?: string;
  order_id?: string;
  rating: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  review_text?: string;
  feedback_tags?: string[];
  created_at: string;
}

export interface AlternativeProductCandidate {
  product_id: string;
  name: string;
  brand?: string;
  platform: string;
  category: string;
  offer_price: number;
  mrp?: number;
  rating?: number;
  rating_count?: number;
  available: boolean;
  current_stock: number;
  eta_minutes?: number;
  demand_classification: DemandClassification;
  recent_units_sold: number;
  image_url?: string;
  match_score: number;
}

export interface ProductDemandAnalysis {
  product_id: string;
  external_product_id: string;
  name: string;
  brand?: string;
  platform: string;
  category: string;
  image_url?: string;
  lifecycle_status: LifecycleStatus;
  seller_id: string;

  // Classification & Trends
  demand_classification: DemandClassification;
  analysis_period_days: number;
  has_sufficient_data: boolean;
  data_points_count: number;

  // Quantitative Demand
  current_period_demand: number;
  previous_period_demand: number;
  demand_change_pct: number;
  avg_daily_demand: number;
  units_sold: number;
  sales_value: number;

  // Inventory & SLAs
  current_stock: number;
  min_stock_threshold: number;
  lead_time_days: number;
  safety_stock_days: number;
  estimated_stock_coverage_days: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;

  // Feedback & Ratings
  rating?: number;
  rating_count?: number;
  rating_trend: 'UPWARD' | 'STABLE' | 'DOWNWARD' | 'NO_DATA';
  positive_reviews_count: number;
  negative_reviews_count: number;
  feedback_available: boolean;
  recent_reviews: CustomerFeedback[];

  // Recommendation
  recommendation_id?: string;
  recommendation_type: RecommendationType;
  reason_explanation: string;
  suggested_replenishment_qty?: number;
  replenishment_formula_params?: {
    expected_demand_lead_time: number;
    safety_stock: number;
    current_stock: number;
    lead_time_days: number;
    safety_stock_days: number;
    avg_daily_demand: number;
    suggested_replenishment_qty: number;
  };
  suggested_alternative_product_id?: string;
  alternative_candidates: AlternativeProductCandidate[];

  // Status & Decision
  recommendation_status: string;
  seller_decision?: string;
  decided_at?: string;
  decided_by?: string;
  evidence_json: Record<string, any>;
}

export interface DemandDashboardSummary {
  analysis_period_days: number;
  total_products_monitored: number;
  increasing_demand_count: number;
  stable_demand_count: number;
  declining_demand_count: number;
  insufficient_data_count: number;

  high_demand_low_stock_count: number;
  replenishment_recommended_count: number;
  replacement_recommended_count: number;
  discontinuation_recommended_count: number;

  top_replenishment_items: ProductDemandAnalysis[];
  top_declining_items: ProductDemandAnalysis[];
  top_increasing_items: ProductDemandAnalysis[];
  insufficient_data_items: ProductDemandAnalysis[];
  category_demand_distribution: Array<{
    category: string;
    total_products: number;
    total_units_sold: number;
    increasing_count: number;
    declining_count: number;
  }>;
  recent_feedback_signals: CustomerFeedback[];
}

export interface SellerDecisionRequest {
  recommendation_id?: string;
  product_id: string;
  decision: 'KEEP' | 'REPLENISH' | 'REPLACE' | 'DISCONTINUE' | 'REJECT';
  replenishment_quantity?: number;
  target_replacement_product_id?: string;
  notes?: string;
}

export interface SellerDecisionResult {
  success: boolean;
  product_id: string;
  new_lifecycle_status: LifecycleStatus;
  action_type: string;
  action_execution_status: string;
  message: string;
  audit_log_id: string;
  timestamp: string;
}

export interface SellerDecisionLog {
  id: string;
  product_id: string;
  product_name?: string;
  product_brand?: string;
  platform?: string;
  recommendation_id?: string;
  recommendation_type: string;
  decision: string;
  seller_email: string;
  data_period: string;
  evidence_summary: string;
  action_attempted: string;
  action_result: string;
  notes?: string;
  timestamp: string;
}
