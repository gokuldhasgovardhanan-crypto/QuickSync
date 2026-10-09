from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.models import Platform, User
from ..schemas.schemas import PlatformOut
from ..connectors.quickcommerce import QuickCommerceConnector
from .deps import get_current_user, RequireRole

router = APIRouter(prefix="/sources", tags=["Data Sources"])

@router.get("", response_model=List[PlatformOut])
def get_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Platform).all()

@router.post("/test")
async def test_api_source_connection(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["ADMIN", "OPERATOR"]))
):
    """
    Executes a real connection test against QuickCommerce API.
    """
    connector = QuickCommerceConnector()
    test_result = await connector.test_connection(db=db)
    
    # Update platform records status
    platforms = db.query(Platform).all()
    for p in platforms:
        p.status = "LIVE" if test_result["success"] else "OFFLINE"
        p.last_latency_ms = test_result.get("latency_ms")
        p.last_status_code = test_result.get("status_code")
    db.commit()

    return test_result
