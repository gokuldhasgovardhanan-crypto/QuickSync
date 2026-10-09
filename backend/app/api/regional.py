from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.models import User, Location
from ..schemas.schemas import RegionActivityDetailOut, IndiaRegionalMapOut
from ..services.regional_service import RegionalAnalyticsService
from .deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["India Regional Analytics"])

@router.get("/map", response_model=IndiaRegionalMapOut)
def get_india_regional_map(
    metric: str = Query("products_count", description="products_count, availability, inventory, delivery_speed, observations"),
    platform: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns dynamic India heat map dataset aggregated by regions with 7-platform activity pictograms.
    Strictly uses real database observation records.
    """
    return RegionalAnalyticsService.get_india_regional_map(
        db=db,
        metric=metric,
        platform_filter=platform,
        brand_filter=brand
    )

@router.get("/regions")
def get_all_regions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Returns list of monitored Indian cities/regions.
    """
    locations = db.query(Location).all()
    return [
        {
            "id": loc.id,
            "city": loc.city,
            "area": loc.area,
            "state": "Karnataka" if loc.city in ["Bangalore", "Bengaluru"] else "Maharashtra" if loc.city in ["Mumbai", "Pune"] else "Delhi NCR",
            "pincode": loc.pincode,
            "latitude": loc.latitude,
            "longitude": loc.longitude
        }
        for loc in locations
    ]

@router.get("/regions/{region_id}", response_model=RegionActivityDetailOut)
def get_region_detail_by_id(
    region_id: str,
    metric: str = Query("products_count"),
    platform: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns specific regional analytics including dynamic 7-platform pictograms and availability breakdown.
    """
    location = db.query(Location).filter(Location.id == region_id).first()
    if not location:
        # Check by city name match
        location = db.query(Location).filter(Location.city.ilike(f"%{region_id}%")).first()
    
    if not location:
        raise HTTPException(status_code=404, detail=f"Region '{region_id}' not found.")

    return RegionalAnalyticsService.get_region_detail(
        db=db,
        location=location,
        metric=metric,
        platform_filter=platform,
        brand_filter=brand
    )

@router.get("/platform-comparison")
def get_platform_comparison_across_india(
    metric: str = Query("products_count"),
    city: Optional[str] = Query("Bangalore"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns 7-platform pictographic comparison (BlinkIt, Zepto, Swiggy, BigBasket, DMart, JioMart, Minutes).
    """
    location = db.query(Location).filter(Location.city.ilike(f"%{city}%")).first() if city else db.query(Location).first()
    if not location:
        location = Location(city="Bangalore", latitude=12.9716, longitude=77.5946, pincode="560001")
        db.add(location)
        db.commit()
        db.refresh(location)

    detail = RegionalAnalyticsService.get_region_detail(db=db, location=location, metric=metric)
    return {
        "region": detail.city,
        "selected_metric": metric,
        "platform_comparison": detail.platform_comparison,
        "sales_data_status": detail.sales_data_status
    }

@router.get("/traceability")
def get_regional_metric_traceability(
    city: str = Query("Bangalore"),
    platform: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Provides full [VIEW SOURCE] transparency details for regional metrics.
    """
    return RegionalAnalyticsService.get_data_traceability(
        db=db,
        region_city=city,
        platform=platform
    )
