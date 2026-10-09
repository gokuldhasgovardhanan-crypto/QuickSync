from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.config import settings
from ..models.models import User, AuditLog
from ..schemas.schemas import SettingsOut, SettingsUpdate
from .deps import get_current_user, RequireRole

router = APIRouter(prefix="/settings", tags=["Configuration & Settings"])

@router.get("", response_model=SettingsOut)
def get_settings(current_user: User = Depends(get_current_user)):
    key = settings.QUICKCOMMERCE_API_KEY
    is_configured = bool(key and len(key.strip()) > 0)
    masked_key = ""
    if is_configured:
        if len(key) > 8:
            masked_key = f"{key[:6]}{'*' * (len(key) - 8)}{key[-2:]}"
        else:
            masked_key = "********"

    return SettingsOut(
        quickcommerce_api_key_configured=is_configured,
        quickcommerce_api_key_masked=masked_key,
        default_city=settings.DEFAULT_CITY,
        default_area=settings.DEFAULT_AREA,
        default_latitude=settings.DEFAULT_LATITUDE,
        default_longitude=settings.DEFAULT_LONGITUDE,
        default_pincode=settings.DEFAULT_PINCODE,
        sync_interval_seconds=settings.SYNC_INTERVAL_SECONDS,
        api_timeout_seconds=settings.API_TIMEOUT_SECONDS,
        max_retries=settings.MAX_RETRIES
    )

@router.put("", response_model=SettingsOut)
def update_settings(
    req: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["ADMIN"]))
):
    if req.quickcommerce_api_key is not None:
        settings.QUICKCOMMERCE_API_KEY = req.quickcommerce_api_key.strip()
    if req.default_city is not None:
        settings.DEFAULT_CITY = req.default_city.strip()
    if req.default_area is not None:
        settings.DEFAULT_AREA = req.default_area.strip()
    if req.default_latitude is not None:
        settings.DEFAULT_LATITUDE = req.default_latitude
    if req.default_longitude is not None:
        settings.DEFAULT_LONGITUDE = req.default_longitude
    if req.default_pincode is not None:
        settings.DEFAULT_PINCODE = req.default_pincode.strip()
    if req.sync_interval_seconds is not None:
        settings.SYNC_INTERVAL_SECONDS = req.sync_interval_seconds
    if req.api_timeout_seconds is not None:
        settings.API_TIMEOUT_SECONDS = req.api_timeout_seconds
    if req.max_retries is not None:
        settings.MAX_RETRIES = req.max_retries

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="API_CONFIG_CHANGED",
        metadata_json={"sync_interval": settings.SYNC_INTERVAL_SECONDS}
    )
    db.add(audit)
    db.commit()

    return get_settings(current_user=current_user)
