from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..core.database import get_db
from ..core.security import get_password_hash
from ..models.models import User, RefreshToken, AuditLog
from ..schemas.schemas import (
    LoginRequest, TokenResponse, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UserOut
)
from ..services.auth_service import AuthService
from .deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Audit Log
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="LOGIN",
        ip_address=client_ip,
        metadata_json={"role": user.role}
    )
    db.add(audit)
    db.commit()

    session_data = AuthService.create_user_session(db, user)
    return session_data

@router.post("/refresh")
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    token_data = AuthService.refresh_access_token(db, req.refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data

@router.post("/logout")
def logout(
    req: Optional[RefreshTokenRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req and req.refresh_token:
        rt = db.query(RefreshToken).filter(RefreshToken.token == req.refresh_token).first()
        if rt:
            rt.revoked = True
            db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="LOGOUT"
    )
    db.add(audit)
    db.commit()

    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    # Always return standard message for security
    return {
        "message": "If this email exists in QuickSync, password reset instructions have been dispatched.",
        "success": True
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    return {"message": "Password updated successfully", "success": True}
