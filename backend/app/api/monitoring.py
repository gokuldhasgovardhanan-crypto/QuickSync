from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import User
from ..services.monitoring_service import MonitoringService
from ..schemas.schemas import DashboardSummaryOut, ApiHealthMetric
from .deps import get_current_user

router = APIRouter(prefix="/monitoring", tags=["Monitoring & Health"])

@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes all live KPI cards for the main Dashboard from actual PostgreSQL records.
    """
    return MonitoringService.get_dashboard_summary(db)

@router.get("/health", response_model=ApiHealthMetric)
def get_monitoring_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes API health metrics, success rates, latency distributions, and platform status.
    """
    return MonitoringService.get_api_health_metrics(db)

@router.get("/metrics")
def get_detailed_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MonitoringService.get_api_health_metrics(db)
