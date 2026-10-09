from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timezone

from ..core.database import get_db
from ..core.config import settings
from ..models.models import Location, User
from ..schemas.schemas import LiveSearchResponse, LiveSearchRequest
from ..connectors.quickcommerce import QuickCommerceConnector
from ..services.sync_service import SyncService
from .deps import get_current_user

router = APIRouter(prefix="/live", tags=["Live Quick-Commerce Data"])

# Simple memory cache for search requests with short 30s TTL
_search_cache: Dict[str, Dict[str, Any]] = {}

@router.get("/search", response_model=LiveSearchResponse)
async def search_live_products(
    q: str = Query(..., description="Product search query (e.g. Milk, Bread, Rice, Eggs)"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    platform: Optional[str] = Query("ALL", description="BlinkIt, Zepto, Swiggy, BigBasket, DMart, JioMart, Minutes, or ALL"),
    pincode: Optional[str] = Query(None, description="Postal pincode"),
    city: Optional[str] = Query(None, description="City name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    latitude = lat if lat is not None else settings.DEFAULT_LATITUDE
    longitude = lon if lon is not None else settings.DEFAULT_LONGITUDE
    search_city = city or settings.DEFAULT_CITY
    search_pincode = pincode or settings.DEFAULT_PINCODE

    # Check cache (30s TTL)
    cache_key = f"{q.lower().strip()}_{platform}_{latitude}_{longitude}_{search_pincode}"
    now_ts = datetime.now(timezone.utc).timestamp()
    if cache_key in _search_cache:
        cached_entry = _search_cache[cache_key]
        if now_ts - cached_entry["cached_at"] < 30.0:
            cached_res = cached_entry["response"]
            cached_res.is_cached = True
            cached_res.cache_age_seconds = int(now_ts - cached_entry["cached_at"])
            return cached_res

    # Call real QuickCommerce API
    connector = QuickCommerceConnector()
    result = await connector.search_products(
        query=q,
        latitude=latitude,
        longitude=longitude,
        platform=platform,
        pincode=search_pincode,
        city=search_city,
        db=db
    )

    if not result["success"]:
        # DO NOT return fake data. Return actual error and status.
        return LiveSearchResponse(
            query=q,
            location={"city": search_city, "latitude": latitude, "longitude": longitude, "pincode": search_pincode},
            total_results=0,
            data_source_status=result.get("data_source_status", "OFFLINE"),
            source_provider="QuickCommerce API",
            latency_ms=result.get("latency_ms", 0.0),
            request_id=result.get("request_id", "N/A"),
            fetched_at=result.get("fetched_at", datetime.now(timezone.utc).isoformat()),
            products=[],
            errors=[{"error": result.get("error_message"), "status_code": result.get("status_code")}],
            is_cached=False
        )

    valid_products = result["products"]

    # Store snapshots in PostgreSQL
    loc = db.query(Location).filter(Location.latitude == latitude, Location.longitude == longitude).first()
    if not loc:
        loc = db.query(Location).filter(Location.is_default == True).first()

    await SyncService.process_live_products(
        db=db,
        items=valid_products,
        location=loc
    )

    response = LiveSearchResponse(
        query=q,
        location={"city": search_city, "latitude": latitude, "longitude": longitude, "pincode": search_pincode},
        total_results=len(valid_products),
        data_source_status="LIVE",
        source_provider="QuickCommerce API",
        latency_ms=result.get("latency_ms", 0.0),
        request_id=result.get("request_id", ""),
        fetched_at=result.get("fetched_at", datetime.now(timezone.utc).isoformat()),
        products=valid_products,
        errors=[],
        is_cached=False,
        cache_age_seconds=0
    )

    # Save to short cache
    _search_cache[cache_key] = {
        "cached_at": now_ts,
        "response": response
    }

    return response

@router.get("/item/{platform}/{item_id}")
async def get_live_item(
    platform: str,
    item_id: str,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    latitude = lat if lat is not None else settings.DEFAULT_LATITUDE
    longitude = lon if lon is not None else settings.DEFAULT_LONGITUDE

    connector = QuickCommerceConnector()
    resp = await connector.get_item_details(
        platform=platform,
        item_id=item_id,
        latitude=latitude,
        longitude=longitude,
        db=db
    )
    return resp

@router.get("/eta/{platform}")
async def get_live_eta(
    platform: str,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    latitude = lat if lat is not None else settings.DEFAULT_LATITUDE
    longitude = lon if lon is not None else settings.DEFAULT_LONGITUDE

    connector = QuickCommerceConnector()
    resp = await connector.get_platform_eta(
        platform=platform,
        latitude=latitude,
        longitude=longitude,
        db=db
    )
    return resp

@router.post("/refresh")
async def trigger_live_refresh(
    q: Optional[str] = "Milk",
    platform: Optional[str] = "ALL",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Triggers instant live sync
    result = await SyncService.execute_live_sync(
        db=db,
        query=q or "Milk",
        platform=platform or "ALL"
    )
    return result
