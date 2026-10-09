from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from ..core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from ..models.models import User, RefreshToken, Platform, Location, AuditLog
from ..schemas.schemas import UserCreate

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    @staticmethod
    def create_user_session(db: Session, user: User) -> dict:
        access_token = create_access_token(subject=user.id, role=user.role)
        refresh_token = create_refresh_token(subject=user.id, role=user.role)
        
        # Save refresh token in database
        rf_entry = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            revoked=False
        )
        db.add(rf_entry)
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }

    @staticmethod
    def refresh_access_token(db: Session, refresh_token_str: str) -> Optional[dict]:
        payload = decode_token(refresh_token_str, is_refresh=True)
        if not payload or payload.get("type") != "refresh":
            return None
        
        user_id = payload.get("sub")
        token_record = db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token_str,
            RefreshToken.revoked == False
        ).first()
        
        if not token_record:
            return None
            
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            return None

        # Generate new access token
        new_access_token = create_access_token(subject=user.id, role=user.role)
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "user": user
        }

    @staticmethod
    def seed_defaults(db: Session):
        """
        Seeds initial roles, admin users, default platforms, and default Bangalore location.
        """
        # 1. Default Users
        users_to_seed = [
            ("admin@quicksync.app", "Admin123!", "ADMIN", "QuickSync System Admin"),
            ("operator@quicksync.app", "Operator123!", "OPERATOR", "Platform Operator"),
            ("analyst@quicksync.app", "Analyst123!", "ANALYST", "Data Analyst"),
            ("demo@quicksync.app", "QuickSyncDemo2026!", "ADMIN", "Demo Enterprise Admin")
        ]
        for email, pwd, role, name in users_to_seed:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                u = User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    role=role,
                    full_name=name,
                    is_active=True
                )
                db.add(u)

        # 2. Default Platforms
        platforms_to_seed = [
            ("BlinkIt", "blinkit", "https://upload.wikimedia.org/wikipedia/commons/2/2f/Blinkit-yellow-app-icon.svg"),
            ("Zepto", "zepto", "https://upload.wikimedia.org/wikipedia/commons/8/82/Zepto_Logo.png"),
            ("Swiggy", "swiggy", "https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg"),
            ("BigBasket", "bigbasket", "https://upload.wikimedia.org/wikipedia/commons/7/76/Bigbasket_Logo.svg"),
            ("DMart", "dmart", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/DMart_logo.svg/512px-DMart_logo.svg.png"),
            ("JioMart", "jiomart", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/JioMart_logo.svg/512px-JioMart_logo.svg.png"),
            ("Minutes", "minutes", "")
        ]
        for name, slug, logo in platforms_to_seed:
            existing_p = db.query(Platform).filter(Platform.slug == slug).first()
            if not existing_p:
                p = Platform(
                    name=name,
                    slug=slug,
                    logo_url=logo,
                    is_active=True,
                    status="LIVE"
                )
                db.add(p)

        # 3. Default Location (Bangalore)
        default_loc = db.query(Location).filter(Location.is_default == True).first()
        if not default_loc:
            loc = Location(
                city="Bangalore",
                area="Indiranagar",
                latitude=12.9716,
                longitude=77.5946,
                pincode="560001",
                is_default=True
            )
            db.add(loc)

        # Also seed other major locations for easy location selector
        other_locs = [
            ("Mumbai", "Bandra West", 19.0596, 72.8295, "400050"),
            ("Delhi NCR", "Connaught Place", 28.6315, 77.2167, "110001"),
            ("Hyderabad", "Hitec City", 17.4474, 78.3762, "500081"),
            ("Pune", "Koregaon Park", 18.5362, 73.8939, "411001"),
            ("Chennai", "T. Nagar", 13.0418, 80.2341, "600017")
        ]
        for city, area, lat, lon, pin in other_locs:
            if not db.query(Location).filter(Location.city == city, Location.area == area).first():
                db.add(Location(
                    city=city,
                    area=area,
                    latitude=lat,
                    longitude=lon,
                    pincode=pin,
                    is_default=False
                ))

        db.commit()
