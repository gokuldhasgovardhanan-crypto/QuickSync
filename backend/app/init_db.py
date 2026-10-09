from app.core.database import engine, Base, SessionLocal
from app.models.models import *
from app.services.auth_service import AuthService

def init_db():
    print("Creating all tables in database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding baseline users, platforms, and locations...")
        AuthService.seed_defaults(db)
        user_count = db.query(User).count()
        platform_count = db.query(Platform).count()
        loc_count = db.query(Location).count()
        print(f"Database initialized successfully! (Users: {user_count}, Platforms: {platform_count}, Locations: {loc_count})")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
