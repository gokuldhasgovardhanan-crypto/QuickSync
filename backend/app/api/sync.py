from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.models import SyncRun, SyncJob, User
from ..schemas.schemas import SyncRunOut, SyncJobOut, TriggerSyncRequest
from ..services.sync_service import SyncService
from .deps import get_current_user, RequireRole

router = APIRouter(prefix="/sync", tags=["Live Sync"])

@router.get("/history", response_model=List[SyncRunOut])
def get_sync_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    runs = db.query(SyncRun).order_by(SyncRun.started_at.desc()).limit(limit).all()
    return runs

@router.post("/run")
async def trigger_sync_run(
    req: TriggerSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["ADMIN", "OPERATOR"]))
):
    """
    Triggers immediate live sync against QuickCommerce API.
    """
    result = await SyncService.execute_live_sync(
        db=db,
        query=req.query or "Milk",
        platform=req.platform or "ALL",
        location_id=req.location_id
    )
    return result
