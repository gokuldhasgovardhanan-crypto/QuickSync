from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.models import PriceSnapshot, Product, User
from ..schemas.schemas import PriceSnapshotOut
from .deps import get_current_user

router = APIRouter(prefix="/prices", tags=["Price Monitoring"])

@router.get("", response_model=List[dict])
def get_price_monitoring_overview(
    platform: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns products with current price, previous price, absolute change, and percentage change.
    Calculated exclusively from actual stored price snapshots.
    """
    products_q = db.query(Product)
    if platform and platform != "ALL":
        products_q = products_q.filter(Product.platform == platform)
    products = products_q.limit(limit).all()

    monitoring_items = []
    for p in products:
        snapshots = db.query(PriceSnapshot).filter(
            PriceSnapshot.product_id == p.id
        ).order_by(PriceSnapshot.fetched_at.desc()).limit(2).all()

        if not snapshots:
            continue

        curr = snapshots[0]
        prev = snapshots[1] if len(snapshots) > 1 else None

        curr_price = curr.offer_price
        prev_price = prev.offer_price if prev else curr_price
        diff = round(curr_price - prev_price, 2)
        pct = round((diff / prev_price) * 100.0, 1) if prev_price > 0 else 0.0

        monitoring_items.append({
            "product_id": p.id,
            "name": p.name,
            "brand": p.brand,
            "platform": p.platform,
            "current_price": curr_price,
            "previous_price": prev_price,
            "price_difference": diff,
            "percentage_change": pct,
            "mrp": curr.mrp,
            "discount_percentage": curr.discount_percentage,
            "fetched_at": curr.fetched_at.isoformat(),
            "request_id": curr.request_id
        })

    return monitoring_items

@router.get("/{product_id}/history", response_model=List[PriceSnapshotOut])
def get_price_history(
    product_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    snapshots = db.query(PriceSnapshot).filter(
        PriceSnapshot.product_id == product_id
    ).order_by(PriceSnapshot.fetched_at.desc()).limit(limit).all()
    return snapshots
