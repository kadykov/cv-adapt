#!/usr/bin/env python3
"""Reset database script for early development."""

import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, text

# Add backend directory to Python path for imports
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from app.core.database import Base  # noqa: E402

# Default configuration - matches docker-compose.yml
DEFAULT_DB_USER = "postgres"
DEFAULT_DB_PASSWORD = "postgres"
DEFAULT_DB_HOST = "db"
DEFAULT_DB_PORT = "5432"
DEFAULT_DB_NAME = "cv_adapt"


def get_db_url() -> str:
    """Get the database URL."""
    db_user = os.getenv("POSTGRES_USER", DEFAULT_DB_USER)
    db_password = os.getenv("POSTGRES_PASSWORD", DEFAULT_DB_PASSWORD)
    db_host = os.getenv("POSTGRES_HOST", DEFAULT_DB_HOST)
    db_port = os.getenv("POSTGRES_PORT", DEFAULT_DB_PORT)
    db_name = os.getenv("POSTGRES_DB", DEFAULT_DB_NAME)

    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


def reset_database() -> None:
    """Drop and recreate all tables."""
    try:
        print("Connecting to database...")
        engine = create_engine(get_db_url())

        print("Dropping all tables...")
        Base.metadata.drop_all(engine)
        print("Tables dropped successfully!")

        print("Creating all tables...")
        Base.metadata.create_all(engine)
        print("Tables created successfully!")

        # Verify database connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            if result.scalar():
                print("Database reset completed successfully!")
            else:
                print("Error: Database verification failed.")
                sys.exit(1)

    except Exception as e:
        print(f"Error during database reset: {e}")
        sys.exit(1)


if __name__ == "__main__":
    reset_database()
