"""Test fixtures for the application."""

import os
from typing import Generator

import pytest
from app.core.deps import get_db
from app.main import app
from app.models.models import Base
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")


@pytest.fixture(scope="session")
def test_engine() -> Engine:
    """Create test engine."""
    is_sqlite = TEST_DATABASE_URL.startswith("sqlite")
    _engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False} if is_sqlite else {},
        poolclass=StaticPool if is_sqlite else None,
    )
    return _engine


@pytest.fixture
def db(test_engine: Engine) -> Generator[Session, None, None]:
    """Get database session."""
    Base.metadata.create_all(bind=test_engine)
    SessionLocal = sessionmaker(bind=test_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client."""

    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
