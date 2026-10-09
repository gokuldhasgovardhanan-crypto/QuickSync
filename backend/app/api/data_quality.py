from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import User
from ..schemas.schemas import DataQualityReportOut
from ..services.data_quality_service import DataQualityService
from .deps import get_current_user

router = APIRouter(prefix="/data-quality", tags=["Data Quality"])

@router.get("", response_model=DataQualityReportOut)
def get_data_quality_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DataQualityService.get_quality_report(db)
