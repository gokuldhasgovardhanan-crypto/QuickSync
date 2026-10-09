from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "ANALYST"
    full_name: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: str
    role: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Location Schemas
class LocationCreate(BaseModel):
    city: str
    area: Optional[str] = None
    latitude: float
    longitude: float
    pincode: str
    is_default: Optional[bool] = False

class LocationOut(BaseModel):
    id: str
    city: str
    area: Optional[str] = None
    latitude: float
    longitude: float
    pincode: str
    is_default: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Platform Schemas
class PlatformOut(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    is_active: bool
    status: str # LIVE, DEGRADED, OFFLINE, RATE_LIMITED
    last_sync_at: Optional[datetime] = None
    last_latency_ms: Optional[float] = None
    last_status_code: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# Normalized Product Item (Standard Live Quick-Commerce Schema)
class NormalizedProductItem(BaseModel):
    platform: str
    external_product_id: str
    name: str
    brand: Optional[str] = None
    quantity: Optional[str] = None
    mrp: Optional[float] = None
    offer_price: float
    discount_percentage: Optional[float] = None
    available: bool = True
    inventory: Optional[int] = None
    store_id: Optional[str] = None
    rating: Optional[float] = None
    rating_count: Optional[int] = None
    eta_minutes: Optional[int] = None
    image_url: Optional[str] = None
    deeplink: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    fetched_at: str # ISO string
    request_id: Optional[str] = None
    raw_response_id: Optional[str] = None
    currency: str = "INR"

# Live Search Schemas
class LiveSearchRequest(BaseModel):
    q: str
    platform: Optional[str] = "ALL"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pincode: Optional[str] = None
    city: Optional[str] = None

class LiveSearchResponse(BaseModel):
    query: str
    location: Dict[str, Any]
    total_results: int
    data_source_status: str # LIVE, OFFLINE, RATE_LIMITED, AUTH_ERROR, DEGRADED
    source_provider: str = "QuickCommerce API"
    latency_ms: float
    request_id: str
    fetched_at: str
    products: List[NormalizedProductItem]
    errors: Optional[List[Dict[str, Any]]] = None
    is_cached: bool = False
    cache_age_seconds: Optional[int] = None

# Snapshot Schemas
class PriceSnapshotOut(BaseModel):
    id: str
    product_id: str
    platform: str
    mrp: Optional[float] = None
    offer_price: float
    discount_percentage: Optional[float] = None
    currency: str
    request_id: Optional[str] = None
    fetched_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InventorySnapshotOut(BaseModel):
    id: str
    product_id: str
    platform: str
    store_id: Optional[str] = None
    inventory: Optional[int] = None
    available: bool
    request_id: Optional[str] = None
    fetched_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductDetailOut(BaseModel):
    id: str
    external_product_id: str
    platform: str
    name: str
    brand: Optional[str] = None
    quantity: Optional[str] = None
    image_url: Optional[str] = None
    deeplink: Optional[str] = None
    rating: Optional[float] = None
    rating_count: Optional[int] = None
    latest_price: Optional[PriceSnapshotOut] = None
    latest_inventory: Optional[InventorySnapshotOut] = None
    latest_eta: Optional[int] = None
    price_history: List[PriceSnapshotOut] = []
    inventory_history: List[InventorySnapshotOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Delivery ETA Schemas
class DeliveryEtaOut(BaseModel):
    id: str
    platform: str
    location_id: Optional[str] = None
    store_id: Optional[str] = None
    eta_minutes: Optional[int] = None
    open: bool
    request_id: Optional[str] = None
    fetched_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Comparison Item
class PlatformComparisonItem(BaseModel):
    platform: str
    price: float
    mrp: Optional[float] = None
    discount: Optional[float] = None
    available: bool
    inventory: Optional[int] = None
    eta_minutes: Optional[int] = None
    store_id: Optional[str] = None
    rating: Optional[float] = None
    deeplink: Optional[str] = None
    fetched_at: str
    request_id: Optional[str] = None

# Dashboard KPIs
class DashboardSummaryOut(BaseModel):
    live_data_sources_count: int
    active_platforms_count: int
    total_products_fetched: int
    in_stock_products_count: int
    out_of_stock_products_count: int
    avg_delivery_eta_minutes: Optional[float] = None
    data_freshness_status: str # FRESH, AGING, STALE, OFFLINE
    last_fetched_at: Optional[datetime] = None
    freshness_age_seconds: Optional[int] = None
    api_health_status: str # HEALTHY, DEGRADED, UNAVAILABLE
    reliability_score: float
    recent_activity: List[Dict[str, Any]] = []

# Monitoring & Metrics
class ApiHealthMetric(BaseModel):
    total_requests: int
    success_requests: int
    failed_requests: int
    success_rate: float
    error_rate: float
    avg_latency_ms: float
    timeouts: int
    rate_limits: int
    last_successful_sync: Optional[datetime] = None
    last_failed_sync: Optional[datetime] = None
    hourly_latency_trend: List[Dict[str, Any]] = []
    platform_health: List[Dict[str, Any]] = []

# Alerts
class AlertOut(BaseModel):
    id: str
    type: str
    severity: str
    platform: Optional[str] = None
    message: str
    details: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AlertResolveRequest(BaseModel):
    resolved_by: Optional[str] = "Admin"

# Sync
class SyncJobOut(BaseModel):
    id: str
    name: str
    interval_seconds: int
    platform: Optional[str] = None
    query: str
    is_active: bool
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SyncRunOut(BaseModel):
    id: str
    sync_job_id: Optional[str] = None
    status: str
    duration_ms: float
    products_retrieved: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    api_calls: int
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TriggerSyncRequest(BaseModel):
    query: Optional[str] = "Milk"
    platform: Optional[str] = "ALL"
    location_id: Optional[str] = None

# Settings
class SettingsOut(BaseModel):
    quickcommerce_api_key_configured: bool
    quickcommerce_api_key_masked: str
    default_city: str
    default_area: str
    default_latitude: float
    default_longitude: float
    default_pincode: str
    sync_interval_seconds: int
    api_timeout_seconds: int
    max_retries: int

class SettingsUpdate(BaseModel):
    quickcommerce_api_key: Optional[str] = None
    default_city: Optional[str] = None
    default_area: Optional[str] = None
    default_latitude: Optional[float] = None
    default_longitude: Optional[float] = None
    default_pincode: Optional[str] = None
    sync_interval_seconds: Optional[int] = None
    api_timeout_seconds: Optional[int] = None
    max_retries: Optional[int] = None

# Traceability & Raw Response
class ViewSourceDetails(BaseModel):
    request_id: str
    endpoint: str
    platform: Optional[str] = None
    request_timestamp: datetime
    response_timestamp: datetime
    status_code: int
    latency_ms: float
    response_json: Optional[Any] = None
    location: Optional[Dict[str, Any]] = None
    store_id: Optional[str] = None

# Data Quality
class DataQualityReportOut(BaseModel):
    total_records: int
    valid_records: int
    invalid_records: int
    completeness_percentage: float
    duplicate_count: int
    stale_records_count: int
    api_errors_count: int
    quality_score: float
    validation_failures_summary: List[Dict[str, Any]] = []

# ==========================================
# DEMAND-DRIVEN PRODUCT MANAGEMENT SCHEMAS
# ==========================================

class CustomerFeedbackOut(BaseModel):
    id: str
    product_id: str
    platform: str
    customer_id: Optional[str] = None
    order_id: Optional[str] = None
    rating: float
    sentiment: str
    review_text: Optional[str] = None
    feedback_tags: Optional[List[str]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrderTransactionOut(BaseModel):
    id: str
    product_id: str
    platform: str
    order_id: str
    quantity: int
    unit_price: float
    total_amount: float
    order_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DailyDemandSnapshotOut(BaseModel):
    id: str
    product_id: str
    platform: str
    snapshot_date: datetime
    order_count: int
    units_sold: int
    sales_value: float
    avg_rating: Optional[float] = None
    review_count: int
    stock_end_of_day: int
    out_of_stock_hours: float

    model_config = ConfigDict(from_attributes=True)

class AlternativeProductCandidateOut(BaseModel):
    product_id: str
    name: str
    brand: Optional[str] = None
    platform: str
    category: str
    offer_price: float
    mrp: Optional[float] = None
    rating: Optional[float] = None
    rating_count: Optional[int] = None
    available: bool
    current_stock: int
    eta_minutes: Optional[int] = None
    demand_classification: str # INCREASING_DEMAND, STABLE_DEMAND
    recent_units_sold: int
    image_url: Optional[str] = None
    match_score: float # 0-100% relevance match

class ProductDemandAnalysisOut(BaseModel):
    product_id: str
    external_product_id: str
    name: str
    brand: Optional[str] = None
    platform: str
    category: str
    image_url: Optional[str] = None
    lifecycle_status: str # ACTIVE, UNDER_REVIEW, REPLENISHMENT_RECOMMENDED, etc.
    seller_id: str
    
    # Classification & Trends
    demand_classification: str # INCREASING_DEMAND, STABLE_DEMAND, DECLINING_DEMAND, INSUFFICIENT_DATA
    analysis_period_days: int
    has_sufficient_data: bool
    data_points_count: int
    
    # Quantitative demand & sales
    current_period_demand: int
    previous_period_demand: int
    demand_change_pct: float
    avg_daily_demand: float
    units_sold: int
    sales_value: float
    
    # Inventory & SLAs
    current_stock: int
    min_stock_threshold: int
    lead_time_days: int
    safety_stock_days: int
    estimated_stock_coverage_days: float
    is_low_stock: bool
    is_out_of_stock: bool
    
    # Customer Feedback & Ratings
    rating: Optional[float] = None
    rating_count: Optional[int] = None
    rating_trend: str # UPWARD, STABLE, DOWNWARD, NO_DATA
    positive_reviews_count: int
    negative_reviews_count: int
    feedback_available: bool
    recent_reviews: List[CustomerFeedbackOut] = []
    
    # Recommendation
    recommendation_id: Optional[str] = None
    recommendation_type: str # REPLENISHMENT, REPLACEMENT, DISCONTINUATION, KEEP_MONITORING, INSUFFICIENT_DATA
    reason_explanation: str
    suggested_replenishment_qty: Optional[int] = None
    replenishment_formula_params: Optional[Dict[str, Any]] = None
    suggested_alternative_product_id: Optional[str] = None
    alternative_candidates: List[AlternativeProductCandidateOut] = []
    
    # Status
    recommendation_status: str # PENDING_REVIEW, SELLER_APPROVED, etc.
    seller_decision: Optional[str] = None
    decided_at: Optional[datetime] = None
    decided_by: Optional[str] = None
    
    # Evidence breakdown
    evidence_json: Dict[str, Any] = {}

class DemandDashboardSummaryOut(BaseModel):
    analysis_period_days: int
    total_products_monitored: int
    increasing_demand_count: int
    stable_demand_count: int
    declining_demand_count: int
    insufficient_data_count: int
    
    high_demand_low_stock_count: int
    replenishment_recommended_count: int
    replacement_recommended_count: int
    discontinuation_recommended_count: int
    
    top_replenishment_items: List[ProductDemandAnalysisOut] = []
    top_declining_items: List[ProductDemandAnalysisOut] = []
    top_increasing_items: List[ProductDemandAnalysisOut] = []
    insufficient_data_items: List[ProductDemandAnalysisOut] = []
    category_demand_distribution: List[Dict[str, Any]] = []
    recent_feedback_signals: List[CustomerFeedbackOut] = []

class SellerDecisionRequest(BaseModel):
    recommendation_id: Optional[str] = None
    product_id: str
    decision: str # KEEP, REPLENISH, REPLACE, DISCONTINUE, REJECT
    replenishment_quantity: Optional[int] = None
    target_replacement_product_id: Optional[str] = None
    notes: Optional[str] = None

class SellerDecisionResult(BaseModel):
    success: bool
    product_id: str
    new_lifecycle_status: str
    action_type: str
    action_execution_status: str # "MANUAL_ACTION_REQUIRED", "COMPLETED", "DEFERRED"
    message: str
    audit_log_id: str
    timestamp: datetime

class SellerDecisionLogOut(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    product_brand: Optional[str] = None
    platform: Optional[str] = None
    recommendation_id: Optional[str] = None
    recommendation_type: str
    decision: str
    seller_email: str
    data_period: str
    evidence_summary: str
    action_attempted: str
    action_result: str
    notes: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# EXCEL DATA EXPORT SCHEMAS
# ==========================================

class ExportFilterRequest(BaseModel):
    brands: Optional[List[str]] = None
    platforms: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    location_id: Optional[str] = None
    city: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    include_sales_metrics: bool = False
    include_identity_matches: bool = True
    data_types: Optional[List[str]] = None # ["products", "prices", "inventory", "delivery", "matches"]

class ExportMetadataOut(BaseModel):
    total_records: int
    brands_count: int
    platforms_count: int
    generated_at: datetime
    sales_data_status: str # "DATA NOT AVAILABLE FROM CURRENT SOURCE" or "INCLUDED"
    file_size_estimate_kb: float

# ==========================================
# PRODUCT IDENTITY & MATCHING SCHEMAS
# ==========================================

class CanonicalProductOut(BaseModel):
    id: str
    canonical_code: str
    canonical_name: str
    brand: Optional[str] = None
    normalized_name: str
    quantity: Optional[str] = None
    normalized_quantity: Optional[str] = None
    category: Optional[str] = None
    gtin: Optional[str] = None
    image_url: Optional[str] = None
    linked_products_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductIdentityMatchOut(BaseModel):
    id: str
    canonical_product_id: str
    canonical_code: str
    canonical_name: str
    canonical_brand: Optional[str] = None
    product_id: str
    platform: str
    platform_product_name: str
    platform_brand: Optional[str] = None
    platform_quantity: Optional[str] = None
    offer_price: Optional[float] = None
    mrp: Optional[float] = None
    current_stock: Optional[int] = None
    image_url: Optional[str] = None
    match_score: float
    confidence_level: str # HIGH_CONFIDENCE, MEDIUM_CONFIDENCE, LOW_CONFIDENCE, UNMATCHED, REQUIRES_REVIEW
    match_reason: str
    matching_attributes: Dict[str, Any]
    status: str # AUTO_MATCHED, PENDING_REVIEW, ACCEPTED, REJECTED
    created_at: datetime
    updated_at: datetime

class MatchReviewRequest(BaseModel):
    decision: str # ACCEPTED, REJECTED
    reason: Optional[str] = None
    target_canonical_id: Optional[str] = None

class MatchReviewResult(BaseModel):
    success: bool
    match_id: str
    decision: str
    canonical_product_id: str
    message: str
    timestamp: datetime

class MatchEngineStatsOut(BaseModel):
    total_platform_products: int
    total_canonical_products: int
    high_confidence_matches: int
    medium_confidence_matches: int
    low_confidence_matches: int
    pending_review_count: int
    accepted_matches_count: int
    rejected_matches_count: int
    unmatched_count: int
    last_engine_run_at: Optional[datetime] = None

# ==========================================
# INDIA REGIONAL ANALYTICS SCHEMAS
# ==========================================

class PlatformActivityPictogram(BaseModel):
    platform: str
    metric_name: str # "Live Products", "Available Products", "Inventory Count", "Avg Speed (Mins)"
    raw_value: float
    formatted_value: str
    intensity_score: int # 1 to 5 icons (e.g. 5 = 🛒 🛒 🛒 🛒 🛒)
    percentage_of_region: float
    is_open: bool = True
    avg_eta_minutes: Optional[int] = None

class RegionActivityDetailOut(BaseModel):
    region_id: str
    city: str
    state: str
    pincode: str
    latitude: float
    longitude: float
    activity_level: str # HIGH ACTIVITY, MEDIUM ACTIVITY, LOW ACTIVITY
    total_live_products: int
    total_in_stock_products: int
    availability_rate_pct: float
    total_inventory_count: int
    avg_delivery_eta_mins: float
    active_platforms_count: int
    sales_data_status: str = "SALES DATA SOURCE NOT CONFIGURED" # Explicit zero-mock disclosure
    last_updated: datetime
    data_freshness_seconds: int
    platform_comparison: List[PlatformActivityPictogram] = []
    top_products_in_region: List[Dict[str, Any]] = []

class IndiaRegionalMapOut(BaseModel):
    selected_metric: str # "availability", "products_count", "inventory", "delivery_speed", "observations"
    total_monitored_regions: int
    regions: List[RegionActivityDetailOut] = []
    overall_leading_platform: str
    generated_at: datetime


