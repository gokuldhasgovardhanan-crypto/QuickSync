from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import RawApiResponse, ApiRequest, User
from ..schemas.schemas import ViewSourceDetails
from .deps import get_current_user

router = APIRouter(prefix="/traceability", tags=["Audit Traceability & View Source"])

@router.get("/{request_id}")
def get_source_trace(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the complete raw audit trail for any metric or snapshot ("Where did this number come from?").
    """
    raw = db.query(RawApiResponse).filter(RawApiResponse.request_id == request_id).first()
    api_req = db.query(ApiRequest).filter(ApiRequest.request_id == request_id).first()

    if not raw and not api_req:
        return {
            "request_id": request_id,
            "found": False,
            "message": "Raw request record is stored or synced in batch."
        }

    return {
        "found": True,
        "request_id": request_id,
        "endpoint": raw.endpoint if raw else api_req.endpoint,
        "platform": raw.platform if raw else api_req.platform,
        "request_timestamp": raw.request_timestamp.isoformat() if raw else api_req.created_at.isoformat(),
        "response_timestamp": raw.response_timestamp.isoformat() if raw else api_req.created_at.isoformat(),
        "status_code": raw.status_code if raw else api_req.status_code,
        "latency_ms": raw.latency_ms if raw else api_req.latency_ms,
        "response_json": raw.response_json if raw else {"status": "success"},
        "credits_remaining": api_req.credits_remaining if api_req else None
    }
