from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.models import Product, PriceSnapshot, InventorySnapshot, DeliveryEtaSnapshot, User
from ..schemas.schemas import PlatformComparisonItem
from .deps import get_current_user

router = APIRouter(prefix="/comparison", tags=["Cross-Platform Comparison"])

@router.get("", response_model=List[PlatformComparisonItem])
def compare_product_across_platforms(
    q: str = Query("Milk", description="Product name to compare across platforms"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compares live prices, availability, stock, and ETA for a specific product query across all platforms.
    All data comes from real snapshots stored in PostgreSQL.
    """
    matching_products = db.query(Product).filter(
        Product.name.ilike(f"%{q}%") | Product.brand.ilike(f"%{q}%")
    ).all()

    comparison_results = []
    seen_platforms = set()

    for p in matching_products:
        if p.platform in seen_platforms:
            continue
        seen_platforms.add(p.platform)

        latest_price = db.query(PriceSnapshot).filter(
            PriceSnapshot.product_id == p.id
        ).order_by(PriceSnapshot.fetched_at.desc()).first()

        latest_inv = db.query(InventorySnapshot).filter(
            InventorySnapshot.product_id == p.id
        ).order_by(InventorySnapshot.fetched_at.desc()).first()

        latest_eta = db.query(DeliveryEtaSnapshot).filter(
            DeliveryEtaSnapshot.platform == p.platform
        ).order_by(DeliveryEtaSnapshot.fetched_at.desc()).first()

        if latest_price:
            comparison_results.append(PlatformComparisonItem(
                platform=p.platform,
                price=latest_price.offer_price,
                mrp=latest_price.mrp,
                discount=latest_price.discount_percentage,
                available=latest_inv.available if latest_inv else True,
                inventory=latest_inv.inventory if latest_inv else None,
                eta_minutes=latest_eta.eta_minutes if latest_eta else None,
                store_id=latest_inv.store_id if latest_inv else None,
                rating=p.rating,
                deeplink=p.deeplink,
                fetched_at=latest_price.fetched_at.isoformat(),
                request_id=latest_price.request_id
            ))

    return comparison_results
