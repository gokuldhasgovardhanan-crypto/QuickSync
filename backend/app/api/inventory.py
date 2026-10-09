from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.models import InventorySnapshot, Product, User
from .deps import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory Monitoring"])

@router.get("", response_model=List[dict])
def get_inventory_overview(
    platform: Optional[str] = None,
    status_filter: Optional[str] = None, # IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns inventory overview with stock signals (IN STOCK >5, LOW STOCK 1-5, OUT OF STOCK 0).
    Inventory values come directly from actual live API snapshots.
    """
    products_q = db.query(Product)
    if platform and platform != "ALL":
        products_q = products_q.filter(Product.platform == platform)
    products = products_q.limit(limit).all()

    items = []
    for p in products:
        inv = db.query(InventorySnapshot).filter(
            InventorySnapshot.product_id == p.id
        ).order_by(InventorySnapshot.fetched_at.desc()).first()

        if not inv:
            continue

        stock_signal = "OUT_OF_STOCK"
        if inv.available:
            if inv.inventory is not None:
                if inv.inventory > 5:
                    stock_signal = "IN_STOCK"
                elif inv.inventory > 0:
                    stock_signal = "LOW_STOCK"
                else:
                    stock_signal = "OUT_OF_STOCK"
            else:
                stock_signal = "IN_STOCK"
        else:
            stock_signal = "OUT_OF_STOCK"

        if status_filter and status_filter != "ALL" and stock_signal != status_filter:
            continue

        items.append({
            "product_id": p.id,
            "name": p.name,
            "brand": p.brand,
            "platform": p.platform,
            "inventory_count": inv.inventory,
            "available": inv.available,
            "stock_signal": stock_signal,
            "store_id": inv.store_id,
            "fetched_at": inv.fetched_at.isoformat(),
            "request_id": inv.request_id
        })

    return items
