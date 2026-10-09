from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.models import DeliveryEtaSnapshot, Platform, User
from ..schemas.schemas import DeliveryEtaOut
from .deps import get_current_user

router = APIRouter(prefix="/delivery", tags=["Delivery ETA"])

@router.get("", response_model=List[dict])
def get_delivery_etas(
    platform: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns latest delivery ETA snapshots across platforms.
    """
    platforms = db.query(Platform).all()
    results = []
    
    for p in platforms:
        if platform and platform != "ALL" and p.name != platform:
            continue
            
        latest_eta = db.query(DeliveryEtaSnapshot).filter(
            DeliveryEtaSnapshot.platform == p.name
        ).order_by(DeliveryEtaSnapshot.fetched_at.desc()).first()

        results.append({
            "platform": p.name,
            "status": p.status,
            "eta_minutes": latest_eta.eta_minutes if latest_eta else None,
            "store_id": latest_eta.store_id if latest_eta else None,
            "is_open": latest_eta.open if latest_eta else True,
            "fetched_at": latest_eta.fetched_at.isoformat() if latest_eta else None,
            "request_id": latest_eta.request_id if latest_eta else None
        })
        
    return results
