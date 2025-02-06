#!/usr/bin/env python3
"""Database initialization script."""
import os
import sys
from typing import Optional

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine, text

# Default configuration - matches docker-compose.yml
DEFAULT_DB_USER = "postgres"
DEFAULT_DB_PASSWORD = "postgres"
DEFAULT_DB_HOST = "db"
DEFAULT_DB_PORT = "5432"
DEFAULT_DB_NAME = "cv_adapt"

def get_db_url(database: Optional[str] = None) -> str:
    """Get the database URL with optional database name."""
    db_user = os.getenv("POSTGRES_USER", DEFAULT_DB_USER)
    db_password = os.getenv("POSTGRES_PASSWORD", DEFAULT_DB_PASSWORD)
    db_host = os.getenv("POSTGRES_HOST", DEFAULT_DB_HOST)
    db_port = os.getenv("POSTGRES_PORT", DEFAULT_DB_PORT)

    if database:
        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{database}"
    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}"

def create_database() -> None:
    """Create the database if it doesn't exist."""
    db_name = os.getenv("POSTGRES_DB", DEFAULT_DB_NAME)

    # Connect to PostgreSQL server (not to a specific database)
    conn = psycopg2.connect(get_db_url())
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # Check if database exists
    cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (db_name,))
    exists = cur.fetchone()

    if not exists:
        print(f"Creating database {db_name}...")
        cur.execute(f'CREATE DATABASE "{db_name}"')
        print(f"Database {db_name} created successfully!")
    else:
        print(f"Database {db_name} already exists.")

    cur.close()
    conn.close()

def verify_database() -> bool:
    """Verify database connection and basic functionality."""
    try:
        engine = create_engine(get_db_url(DEFAULT_DB_NAME))
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            return bool(result.scalar())
    except Exception as e:
        print(f"Database verification failed: {e}")
        return False

def main() -> None:
    """Main initialization function."""
    try:
        print("Initializing database...")
        create_database()

        if verify_database():
            print("Database initialization successful!")
            # Import and run alembic upgrade after verifying we're in the right directory
            if os.path.exists("alembic.ini"):
                print("Running database migrations...")
                os.system("alembic upgrade head")
                print("Migrations completed successfully!")
            else:
                print("Error: alembic.ini not found. Make sure you're running this script from the backend directory.")
                sys.exit(1)
        else:
            print("Error: Database verification failed.")
            sys.exit(1)

    except Exception as e:
        print(f"Error during database initialization: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
