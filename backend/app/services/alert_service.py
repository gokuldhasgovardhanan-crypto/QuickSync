from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models.models import Alert
from ..websocket.manager import ws_manager

class AlertService:
    @staticmethod
    def get_alerts(
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        platform: Optional[str] = None,
        limit: int = 100
    ) -> List[Alert]:
        query = db.query(Alert)
        if status:
            query = query.filter(Alert.status == status)
        if severity:
            query = query.filter(Alert.severity == severity)
        if platform and platform != "ALL":
            query = query.filter(Alert.platform == platform)
        return query.order_by(Alert.created_at.desc()).limit(limit).all()

    @staticmethod
    async def create_alert(
        db: Session,
        type: str,
        message: str,
        severity: str = "INFO",
        platform: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> Alert:
        now = datetime.now(timezone.utc)
        alert = Alert(
            type=type,
            severity=severity,
            platform=platform,
            message=message,
            details=details,
            status="OPEN",
            created_at=now
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        await ws_manager.broadcast("alert_created", {
            "id": alert.id,
            "type": alert.type,
            "severity": alert.severity,
            "platform": alert.platform,
            "message": alert.message,
            "created_at": alert.created_at.isoformat()
        })
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert_id: str, resolved_by: str = "Admin") -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = "RESOLVED"
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by = resolved_by
        db.commit()
        db.refresh(alert)
        return alert
