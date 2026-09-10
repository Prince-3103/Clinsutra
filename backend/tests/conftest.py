import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.services import auth_service

settings = get_settings()
engine = create_engine(settings.test_database_url, pool_pre_ping=True)
TestSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestSessionLocal()
    # Seed the demo doctor (with hashed credentials) so login and the
    # doctor-protected endpoints have an account to authenticate against.
    auth_service.seed_demo_doctor(session, settings)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def doctor_token():
    """A valid doctor JWT for the seeded demo doctor."""
    return create_access_token(subject=settings.doctor_id, role="doctor")


def _override(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    return override_get_db


@pytest.fixture()
def client(db_session, doctor_token):
    """Authenticated-as-doctor client (default). Doctor endpoints work; kiosk
    endpoints ignore the bearer header. Negative auth tests use `unauth_client`
    or send their own token."""
    app.dependency_overrides[get_db] = _override(db_session)
    with TestClient(app) as test_client:
        test_client.headers.update({"Authorization": f"Bearer {doctor_token}"})
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def unauth_client(db_session):
    """Client with no Authorization header — for 401/403 auth tests."""
    app.dependency_overrides[get_db] = _override(db_session)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
