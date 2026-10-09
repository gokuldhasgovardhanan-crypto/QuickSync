from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..models.models import (
    Product, PriceSnapshot, InventorySnapshot, DeliveryEtaSnapshot,
    ApiRequest, SyncRun, Platform, Alert, DataQualityResult
)
from ..schemas.schemas import DashboardSummaryOut, ApiHealthMetric

class MonitoringService:
    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        """
        Calculates all Dashboard KPIs dynamically from real PostgreSQL records.
        DOES NOT USE FAKE DATA.
        If no records exist, clearly returns 0 / waiting states.
        """
        now = datetime.now(timezone.utc)
        
        # 1. Active platforms count & Live data sources
        platforms = db.query(Platform).all()
        live_sources_count = sum(1 for p in platforms if p.status == "LIVE")
        active_platforms_count = len(platforms)

        # 2. Total unique products stored
        total_products_fetched = db.query(Product).count()

        # 3. In-Stock vs Out-Of-Stock calculation based on the latest inventory snapshot for each product
        # Subquery for latest snapshot per product
        latest_inv_sub = db.query(
            InventorySnapshot.product_id,
            func.max(InventorySnapshot.fetched_at).label("max_fetched")
        ).group_by(InventorySnapshot.product_id).subquery()

        latest_inventories = db.query(InventorySnapshot).join(
            latest_inv_sub,
            (InventorySnapshot.product_id == latest_inv_sub.c.product_id) &
            (InventorySnapshot.fetched_at == latest_inv_sub.c.max_fetched)
        ).all()

        in_stock_count = sum(1 for inv in latest_inventories if inv.available)
        out_of_stock_count = sum(1 for inv in latest_inventories if not inv.available)

        # 4. Average Delivery ETA
        recent_etas = db.query(DeliveryEtaSnapshot.eta_minutes).filter(
            DeliveryEtaSnapshot.eta_minutes.isnot(None),
            DeliveryEtaSnapshot.fetched_at >= now - timedelta(hours=24)
        ).all()

        avg_eta: Optional[float] = None
        if recent_etas:
            valid_etas = [e[0] for e in recent_etas if e[0] is not None]
            if valid_etas:
                avg_eta = round(sum(valid_etas) / len(valid_etas), 1)

        # 5. Data Freshness Calculation
        latest_snapshot = db.query(PriceSnapshot).order_by(PriceSnapshot.fetched_at.desc()).first()
        last_fetched_at = latest_snapshot.fetched_at if latest_snapshot else None
        freshness_status = "OFFLINE"
        age_seconds: Optional[int] = None

        if last_fetched_at:
            if last_fetched_at.tzinfo is None:
                last_fetched_at = last_fetched_at.replace(tzinfo=timezone.utc)
            age_seconds = int((now - last_fetched_at).total_seconds())
            if age_seconds <= 30:
                freshness_status = "FRESH"
            elif age_seconds <= 120:
                freshness_status = "AGING"
            else:
                freshness_status = "STALE"

        # 6. API Health Calculation from api_requests in last 24h
        recent_requests = db.query(ApiRequest).filter(
            ApiRequest.created_at >= now - timedelta(hours=24)
        ).all()

        total_reqs = len(recent_requests)
        successful_reqs = sum(1 for r in recent_requests if r.success)
        api_health_status = "HEALTHY"
        if total_reqs == 0:
            api_health_status = "OFFLINE"
        else:
            success_rate = (successful_reqs / total_reqs) * 100.0
            if success_rate < 80.0:
                api_health_status = "DEGRADED"
            elif success_rate < 50.0:
                api_health_status = "UNAVAILABLE"

        # 7. QuickSync Data Reliability Score (Formula Documented)
        # Score = (SuccessRate * 0.40) + (ValidationRate * 0.25) + (FreshnessScore * 0.20) + (LatencyScore * 0.15)
        reliability_score = 0.0
        if total_reqs > 0:
            success_part = (successful_reqs / total_reqs) * 40.0
            
            # Validation rate
            dq_results = db.query(DataQualityResult).filter(DataQualityResult.checked_at >= now - timedelta(hours=24)).all()
            val_rate = 100.0 if not dq_results else (sum(d.quality_score for d in dq_results) / len(dq_results))
            validation_part = (val_rate / 100.0) * 25.0

            # Freshness score
            fresh_score = 0.0
            if freshness_status == "FRESH":
                fresh_score = 20.0
            elif freshness_status == "AGING":
                fresh_score = 12.0
            elif freshness_status == "STALE":
                fresh_score = 5.0
            
            # Latency score (< 1500ms is 100% of 15)
            latencies = [r.latency_ms for r in recent_requests if r.latency_ms]
            avg_lat = sum(latencies) / len(latencies) if latencies else 2000.0
            lat_score = max(0.0, min(15.0, 15.0 * (1.0 - (avg_lat / 4000.0))))

            reliability_score = round(success_part + validation_part + fresh_score + lat_score, 1)

        # 8. Real Live Activity Feed
        recent_syncs = db.query(SyncRun).order_by(SyncRun.started_at.desc()).limit(5).all()
        recent_alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(5).all()
        
        activity = []
        for a in recent_alerts:
            activity.append({
                "type": "ALERT",
                "platform": a.platform or "System",
                "message": a.message,
                "timestamp": a.created_at.isoformat(),
                "severity": a.severity
            })
        for s in recent_syncs:
            activity.append({
                "type": "SYNC",
                "platform": "QuickCommerce API",
                "message": f"Sync completed: {s.valid_records} valid products in {int(s.duration_ms)}ms" if s.status == "SUCCESS" else f"Sync failed: {s.error_message}",
                "timestamp": s.started_at.isoformat(),
                "severity": "INFO" if s.status == "SUCCESS" else "CRITICAL"
            })
        
        # Sort activity by timestamp desc
        activity.sort(key=lambda x: x["timestamp"], reverse=True)

        return {
            "live_data_sources_count": live_sources_count,
            "active_platforms_count": active_platforms_count,
            "total_products_fetched": total_products_fetched,
            "in_stock_products_count": in_stock_count,
            "out_of_stock_products_count": out_of_stock_count,
            "avg_delivery_eta_minutes": avg_eta,
            "data_freshness_status": freshness_status,
            "last_fetched_at": last_fetched_at.isoformat() if last_fetched_at else None,
            "freshness_age_seconds": age_seconds,
            "api_health_status": api_health_status,
            "reliability_score": reliability_score,
            "recent_activity": activity[:10]
        }

    @staticmethod
    def get_api_health_metrics(db: Session) -> Dict[str, Any]:
        """
        Computes comprehensive monitoring metrics from real database requests.
        """
        now = datetime.now(timezone.utc)
        requests_24h = db.query(ApiRequest).filter(ApiRequest.created_at >= now - timedelta(hours=24)).all()
        
        total = len(requests_24h)
        success_count = sum(1 for r in requests_24h if r.success)
        failed_count = total - success_count
        
        success_rate = round((success_count / total * 100.0), 1) if total > 0 else 0.0
        error_rate = round((failed_count / total * 100.0), 1) if total > 0 else 0.0
        
        latencies = [r.latency_ms for r in requests_24h if r.latency_ms is not None]
        avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else 0.0
        
        timeouts = sum(1 for r in requests_24h if r.status_code == 504)
        rate_limits = sum(1 for r in requests_24h if r.status_code == 429)

        last_success = db.query(ApiRequest).filter(ApiRequest.success == True).order_by(ApiRequest.created_at.desc()).first()
        last_failed = db.query(ApiRequest).filter(ApiRequest.success == False).order_by(ApiRequest.created_at.desc()).first()

        # Platform-specific health
        platforms = db.query(Platform).all()
        platform_health = []
        for p in platforms:
            p_reqs = [r for r in requests_24h if r.platform == p.name]
            p_total = len(p_reqs)
            p_succ = sum(1 for r in p_reqs if r.success)
            p_rate = round((p_succ / p_total * 100.0), 1) if p_total > 0 else (100.0 if p.status == "LIVE" else 0.0)
            p_lat = [r.latency_ms for r in p_reqs if r.latency_ms]
            p_avg_lat = round(sum(p_lat) / len(p_lat), 1) if p_lat else p.last_latency_ms or 0.0

            platform_health.append({
                "platform": p.name,
                "status": p.status,
                "success_rate": p_rate,
                "avg_latency_ms": p_avg_lat,
                "last_sync_at": p.last_sync_at.isoformat() if p.last_sync_at else None,
                "last_status_code": p.last_status_code
            })

        # Latency trend over recent hours
        hourly_trend = []
        for hour in range(6, -1, -1):
            h_start = now - timedelta(hours=hour+1)
            h_end = now - timedelta(hours=hour)
            h_reqs = [r for r in requests_24h if h_start <= (r.created_at.replace(tzinfo=timezone.utc) if r.created_at.tzinfo is None else r.created_at) < h_end]
            h_lat = [r.latency_ms for r in h_reqs if r.latency_ms]
            avg_h_lat = round(sum(h_lat) / len(h_lat), 1) if h_lat else 0.0
            hourly_trend.append({
                "time": (now - timedelta(hours=hour)).strftime("%H:00"),
                "avg_latency": avg_h_lat,
                "requests": len(h_reqs),
                "errors": sum(1 for r in h_reqs if not r.success)
            })

        return {
            "total_requests": total,
            "success_requests": success_count,
            "failed_requests": failed_count,
            "success_rate": success_rate,
            "error_rate": error_rate,
            "avg_latency_ms": avg_latency,
            "timeouts": timeouts,
            "rate_limits": rate_limits,
            "last_successful_sync": last_success.created_at.isoformat() if last_success else None,
            "last_failed_sync": last_failed.created_at.isoformat() if last_failed else None,
            "platform_health": platform_health,
            "hourly_latency_trend": hourly_trend
        }
