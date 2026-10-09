import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index, JSON
)
from sqlalchemy.orm import relationship
from ..core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="ANALYST", nullable=False, index=True) # ADMIN, OPERATOR, ANALYST
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False)
    permissions = Column(JSON, nullable=True) # list of permission keys

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(512), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")

class Location(Base):
    __tablename__ = "locations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    city = Column(String(100), nullable=False, index=True)
    area = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    pincode = Column(String(20), nullable=False, index=True)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

class Platform(Base):
    __tablename__ = "platforms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True) # BlinkIt, Zepto, Swiggy, etc.
    slug = Column(String(100), unique=True, nullable=False, index=True)
    logo_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="LIVE", nullable=False) # LIVE, DEGRADED, OFFLINE, RATE_LIMITED
    last_sync_at = Column(DateTime, nullable=True)
    last_latency_ms = Column(Float, nullable=True)
    last_status_code = Column(Integer, nullable=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    external_product_id = Column(String(255), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    name = Column(String(500), nullable=False, index=True)
    brand = Column(String(255), nullable=True, index=True)
    category = Column(String(150), default="General Grocery", nullable=False, index=True)
    quantity = Column(String(100), nullable=True)
    image_url = Column(Text, nullable=True)
    deeplink = Column(Text, nullable=True)
    rating = Column(Float, nullable=True)
    rating_count = Column(Integer, nullable=True)
    
    # Demand & Lifecycle Management
    lifecycle_status = Column(String(50), default="ACTIVE", nullable=False, index=True) 
    # ACTIVE, UNDER_REVIEW, REPLENISHMENT_RECOMMENDED, REPLACEMENT_RECOMMENDED, DISCONTINUATION_RECOMMENDED, DISCONTINUED, REPLACEMENT_COMPLETED
    seller_id = Column(String(100), default="SELLER_PRIMARY_01", nullable=False, index=True)
    lead_time_days = Column(Integer, default=2, nullable=False)
    safety_stock_days = Column(Integer, default=3, nullable=False)
    min_stock_threshold = Column(Integer, default=15, nullable=False)
    replacement_target_product_id = Column(String(36), ForeignKey("products.id"), nullable=True)

    # Product Identity & Canonical Matching
    gtin = Column(String(50), nullable=True, index=True) # Barcode / EAN / UPC
    canonical_product_id = Column(String(36), ForeignKey("canonical_products.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    __table_args__ = (
        Index("ix_products_platform_ext_id", "platform", "external_product_id", unique=True),
    )

class ProductSnapshot(Base):
    __tablename__ = "product_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    external_product_id = Column(String(255), nullable=False, index=True)
    name = Column(String(500), nullable=False)
    brand = Column(String(255), nullable=True)
    quantity = Column(String(100), nullable=True)
    image_url = Column(Text, nullable=True)
    deeplink = Column(Text, nullable=True)
    rating = Column(Float, nullable=True)
    rating_count = Column(Integer, nullable=True)
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=True, index=True)
    request_id = Column(String(100), nullable=True, index=True)
    raw_response_id = Column(String(36), nullable=True)
    fetched_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    mrp = Column(Float, nullable=True)
    offer_price = Column(Float, nullable=False)
    discount_percentage = Column(Float, nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=True, index=True)
    request_id = Column(String(100), nullable=True, index=True)
    raw_response_id = Column(String(36), nullable=True)
    fetched_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class InventorySnapshot(Base):
    __tablename__ = "inventory_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    store_id = Column(String(255), nullable=True, index=True)
    inventory = Column(Integer, nullable=True) # Stock count
    available = Column(Boolean, default=True, nullable=False, index=True)
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=True, index=True)
    request_id = Column(String(100), nullable=True, index=True)
    raw_response_id = Column(String(36), nullable=True)
    fetched_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class AvailabilitySnapshot(Base):
    __tablename__ = "availability_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    store_id = Column(String(255), nullable=True, index=True)
    available = Column(Boolean, nullable=False, index=True)
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=True, index=True)
    request_id = Column(String(100), nullable=True, index=True)
    raw_response_id = Column(String(36), nullable=True)
    fetched_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class DeliveryEtaSnapshot(Base):
    __tablename__ = "delivery_eta_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    platform = Column(String(100), nullable=False, index=True)
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=True, index=True)
    store_id = Column(String(255), nullable=True, index=True)
    eta_minutes = Column(Integer, nullable=True)
    open = Column(Boolean, default=True, nullable=False)
    request_id = Column(String(100), nullable=True, index=True)
    raw_response_id = Column(String(36), nullable=True)
    fetched_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class SyncJob(Base):
    __tablename__ = "sync_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    interval_seconds = Column(Integer, default=60, nullable=False)
    platform = Column(String(100), nullable=True) # None means ALL
    query = Column(String(255), nullable=False)
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

class SyncRun(Base):
    __tablename__ = "sync_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sync_job_id = Column(String(36), ForeignKey("sync_jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(50), nullable=False) # SUCCESS, FAILED, PARTIAL, RUNNING
    duration_ms = Column(Float, default=0.0)
    products_retrieved = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    api_calls = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)

class DataQualityResult(Base):
    __tablename__ = "data_quality_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(100), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    total_fields_checked = Column(Integer, default=0)
    missing_fields = Column(Integer, default=0)
    invalid_fields = Column(Integer, default=0)
    quality_score = Column(Float, default=100.0) # percentage
    status = Column(String(50), default="PASSED") # PASSED, WARNING, FAILED
    error_details = Column(JSON, nullable=True)
    checked_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    type = Column(String(100), nullable=False, index=True) # PRICE_CHANGE, STOCK_CHANGE, OUT_OF_STOCK, BACK_IN_STOCK, API_FAILURE, DATA_STALE, RATE_LIMIT, AUTH_ERROR, SYNC_FAILURE, ETA_CHANGE
    severity = Column(String(50), default="INFO", nullable=False, index=True) # INFO, WARNING, CRITICAL
    platform = Column(String(100), nullable=True, index=True)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    status = Column(String(50), default="OPEN", nullable=False, index=True) # OPEN, RESOLVED, ACKNOWLEDGED
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(255), nullable=True)

class ApiRequest(Base):
    __tablename__ = "api_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(100), nullable=False, index=True)
    endpoint = Column(String(255), nullable=False)
    platform = Column(String(100), nullable=True, index=True)
    method = Column(String(20), default="GET", nullable=False)
    status_code = Column(Integer, nullable=True)
    latency_ms = Column(Float, nullable=True)
    success = Column(Boolean, default=True, nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    credits_remaining = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(100), nullable=False, index=True)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    user_email = Column(String(255), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True) # LOGIN, LOGOUT, API_CONFIG_CHANGED, SYNC_STARTED, etc.
    ip_address = Column(String(100), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

class RawApiResponse(Base):
    __tablename__ = "raw_api_responses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(100), nullable=False, index=True)
    endpoint = Column(String(255), nullable=False)
    platform = Column(String(100), nullable=True, index=True)
    request_timestamp = Column(DateTime, default=get_utc_now, nullable=False)
    response_timestamp = Column(DateTime, default=get_utc_now, nullable=False)
    status_code = Column(Integer, nullable=False)
    response_json = Column(JSON, nullable=True)
    latency_ms = Column(Float, nullable=False)

# ==========================================
# DEMAND-DRIVEN PRODUCT MANAGEMENT MODELS
# ==========================================

class CustomerFeedback(Base):
    __tablename__ = "customer_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    customer_id = Column(String(100), nullable=True)
    order_id = Column(String(100), nullable=True)
    rating = Column(Float, nullable=False) # 1.0 to 5.0
    sentiment = Column(String(50), default="POSITIVE", nullable=False) # POSITIVE, NEUTRAL, NEGATIVE
    review_text = Column(Text, nullable=True)
    feedback_tags = Column(JSON, nullable=True) # e.g. ["freshness", "packaging", "taste"]
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    product = relationship("Product", foreign_keys=[product_id])

class OrderTransaction(Base):
    __tablename__ = "order_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    order_id = Column(String(100), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    order_status = Column(String(50), default="DELIVERED", nullable=False) # DELIVERED, RETURNED, CANCELLED
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    product = relationship("Product", foreign_keys=[product_id])

class DailyDemandSnapshot(Base):
    __tablename__ = "daily_demand_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(100), nullable=False, index=True)
    snapshot_date = Column(DateTime, nullable=False, index=True)
    order_count = Column(Integer, default=0, nullable=False)
    units_sold = Column(Integer, default=0, nullable=False)
    sales_value = Column(Float, default=0.0, nullable=False)
    avg_rating = Column(Float, nullable=True)
    review_count = Column(Integer, default=0, nullable=False)
    stock_end_of_day = Column(Integer, default=0, nullable=False)
    out_of_stock_hours = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    product = relationship("Product", foreign_keys=[product_id])

    __table_args__ = (
        Index("ix_daily_demand_product_date", "product_id", "snapshot_date", unique=True),
    )

class ProductRecommendation(Base):
    __tablename__ = "product_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_type = Column(String(100), nullable=False, index=True) # REPLENISHMENT, REPLACEMENT, DISCONTINUATION, KEEP_MONITORING, INSUFFICIENT_DATA
    demand_classification = Column(String(50), nullable=False, index=True) # INCREASING_DEMAND, STABLE_DEMAND, DECLINING_DEMAND, INSUFFICIENT_DATA
    analysis_period_days = Column(Integer, default=14, nullable=False)
    
    # Quantitative Signals
    current_stock = Column(Integer, default=0, nullable=False)
    recent_demand = Column(Integer, default=0, nullable=False)
    previous_demand = Column(Integer, default=0, nullable=False)
    demand_change_pct = Column(Float, default=0.0, nullable=False)
    avg_daily_demand = Column(Float, default=0.0, nullable=False)
    estimated_stock_coverage_days = Column(Float, default=0.0, nullable=False)
    
    # Suggested Replenishment Calculation
    suggested_replenishment_qty = Column(Integer, nullable=True)
    replenishment_formula_params = Column(JSON, nullable=True) # {lead_time_days, safety_stock_days, avg_daily_demand, available_stock}
    
    # Alternative Product (if recommendation is REPLACEMENT)
    suggested_alternative_product_id = Column(String(36), ForeignKey("products.id"), nullable=True)
    
    # Explanation & Structured Evidence
    reason_explanation = Column(Text, nullable=False)
    evidence_json = Column(JSON, nullable=False)
    
    # Workflow & Status
    status = Column(String(50), default="PENDING_REVIEW", nullable=False, index=True) # PENDING_REVIEW, SELLER_APPROVED, SELLER_REJECTED, ACTION_COMPLETED, MANUAL_ACTION_REQUIRED
    seller_decision = Column(String(50), nullable=True) # KEEP, REPLENISH, REPLACE, DISCONTINUE, REJECT
    decision_notes = Column(Text, nullable=True)
    decided_by = Column(String(255), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    action_attempted = Column(String(100), nullable=True)
    action_result = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    product = relationship("Product", foreign_keys=[product_id])
    suggested_alternative = relationship("Product", foreign_keys=[suggested_alternative_product_id])

class SellerDecisionLog(Base):
    __tablename__ = "seller_decision_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_id = Column(String(36), ForeignKey("product_recommendations.id"), nullable=True, index=True)
    recommendation_type = Column(String(100), nullable=False)
    decision = Column(String(50), nullable=False) # KEEP, REPLENISH, REPLACE, DISCONTINUE, REJECT
    seller_email = Column(String(255), nullable=False, index=True)
    data_period = Column(String(50), nullable=False)
    evidence_summary = Column(Text, nullable=False)
    action_attempted = Column(String(100), nullable=False)
    action_result = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    product = relationship("Product", foreign_keys=[product_id])

# ==========================================
# CANONICAL IDENTITY & PRODUCT MATCHING
# ==========================================

class CanonicalProduct(Base):
    __tablename__ = "canonical_products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    canonical_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. QS-PROD-000101
    canonical_name = Column(String(500), nullable=False, index=True)
    brand = Column(String(255), nullable=True, index=True)
    normalized_name = Column(String(500), nullable=False, index=True)
    quantity = Column(String(100), nullable=True)
    normalized_quantity = Column(String(100), nullable=True, index=True)
    category = Column(String(150), nullable=True, index=True)
    gtin = Column(String(50), nullable=True, index=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    products = relationship("Product", backref="canonical_product_rel", foreign_keys="Product.canonical_product_id")
    matches = relationship("ProductIdentityMatch", back_populates="canonical_product", cascade="all, delete-orphan")
    aliases = relationship("ProductAlias", back_populates="canonical_product", cascade="all, delete-orphan")

class ProductIdentityMatch(Base):
    __tablename__ = "product_identity_matches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    canonical_product_id = Column(String(36), ForeignKey("canonical_products.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    match_score = Column(Float, nullable=False) # 0.0 to 100.0
    confidence_level = Column(String(50), nullable=False, index=True) # HIGH_CONFIDENCE, MEDIUM_CONFIDENCE, LOW_CONFIDENCE, UNMATCHED, REQUIRES_REVIEW
    match_reason = Column(Text, nullable=False)
    matching_attributes = Column(JSON, nullable=False) # {"brand_match": true, "pack_match": true, "similarity": 0.94, ...}
    status = Column(String(50), default="AUTO_MATCHED", nullable=False, index=True) # AUTO_MATCHED, PENDING_REVIEW, ACCEPTED, REJECTED
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    canonical_product = relationship("CanonicalProduct", back_populates="matches")
    product = relationship("Product", foreign_keys=[product_id])
    reviews = relationship("ProductMatchReview", back_populates="match", cascade="all, delete-orphan")

class ProductAlias(Base):
    __tablename__ = "product_aliases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    canonical_product_id = Column(String(36), ForeignKey("canonical_products.id", ondelete="CASCADE"), nullable=False, index=True)
    alias_name = Column(String(500), nullable=False, index=True)
    platform = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    canonical_product = relationship("CanonicalProduct", back_populates="aliases")

class ProductMatchReview(Base):
    __tablename__ = "product_match_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    match_id = Column(String(36), ForeignKey("product_identity_matches.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(255), nullable=False, index=True)
    decision = Column(String(50), nullable=False) # ACCEPTED, REJECTED
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    match = relationship("ProductIdentityMatch", back_populates="reviews")


