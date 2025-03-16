"""Database configuration and session management."""

import os
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@db:5432/cv_adapt",
)

is_sqlite = DATABASE_URL.startswith("sqlite")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)


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
