from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.models import Alert, User
from ..schemas.schemas import AlertOut, AlertResolveRequest
from ..services.alert_service import AlertService
from .deps import get_current_user, RequireRole

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AlertService.get_alerts(db, status=status, severity=severity, platform=platform, limit=limit)

@router.post("/{id}/resolve", response_model=AlertOut)
def resolve_alert(
    id: str,
    req: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["ADMIN", "OPERATOR"]))
):
    resolved = AlertService.resolve_alert(db, alert_id=id, resolved_by=current_user.email or "Admin")
    if not resolved:
        raise HTTPException(status_code=404, detail="Alert not found")
    return resolved
