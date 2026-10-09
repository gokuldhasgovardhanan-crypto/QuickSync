import pytest
from backend.app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.models import User
from backend.app.services.auth_service import AuthService

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    AuthService.seed_defaults(db)
    yield db
    db.close()

def test_password_hashing():
    pwd = "TestSecurePassword123!"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_generation_and_decoding():
    user_id = "test-user-uuid-1234"
    role = "ADMIN"
    token = create_access_token(subject=user_id, role=role)
    assert token is not None
    
    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == user_id
    assert payload.get("role") == role
    assert payload.get("type") == "access"

def test_authenticate_user_success(db_session):
    user = AuthService.authenticate_user(db_session, "admin@quicksync.app", "Admin123!")
    assert user is not None
    assert user.role == "ADMIN"

def test_authenticate_user_invalid_password(db_session):
    user = AuthService.authenticate_user(db_session, "admin@quicksync.app", "IncorrectPass!")
    assert user is None
