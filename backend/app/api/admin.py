from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..core.security import get_password_hash
from ..models.models import User, AuditLog
from ..schemas.schemas import UserOut, UserCreate
from .deps import get_current_user, RequireRole

router = APIRouter(prefix="/admin", tags=["Admin Management"])

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["ADMIN"]))
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.post("/users", response_model=UserOut)
def create_user(
    req: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["ADMIN"]))
):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        role=req.role.upper(),
        full_name=req.full_name,
        is_active=True
    )
    db.add(new_user)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="USER_CREATED",
        metadata_json={"created_user": req.email, "role": req.role}
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["ADMIN"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "user_id": l.user_id,
        "user_email": l.user_email,
        "action": l.action,
        "ip_address": l.ip_address,
        "metadata": l.metadata_json,
        "timestamp": l.created_at.isoformat()
    } for l in logs]
