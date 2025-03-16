"""Database configuration and session management."""

import os
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

TESTING = os.getenv("TESTING", "0") == "1"

DATABASE_URL = (
    "sqlite:///:memory:"
    if TESTING
    else os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@db:5432/cv_adapt",
    )
)

# Always use check_same_thread=False for SQLite to allow multiple threads in tests
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)


# Create all tables on startup
def create_db_and_tables() -> None:
    """Create database tables."""
    SQLModel.metadata.create_all(engine)


def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    with Session(engine) as db:
        try:
            yield db
        finally:
            db.close()
