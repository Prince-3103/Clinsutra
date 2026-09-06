"""
Test fixtures.

Runs against a real MySQL database (`clinsutra_test` by default, override with
`TEST_DATABASE_URL`) rather than SQLite, since a few things here (native
ENUM columns, JSON columns) are MySQL-specific and worth catching in CI.
Every test gets a clean schema: tables are dropped and recreated per test
function, which keeps tests independent without needing transactional
rollback tricks around FastAPI's own session handling.
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL", "mysql+pymysql://clinsutra:clinsutra_dev_pw@localhost:3306/clinsutra_test"
    ),
)

from app.core.database import Base, get_db  # noqa: E402
from app import models as _models  # noqa: E402,F401  (registers every model on Base.metadata)
from app.main import app  # noqa: E402

TEST_DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(TEST_DATABASE_URL, future=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


@pytest.fixture(autouse=True)
def _clean_schema():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def client():
    return TestClient(app)
