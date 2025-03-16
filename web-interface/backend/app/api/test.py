"""Test endpoints for E2E testing."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import engine
from app.core.deps import get_db
from app.models.sqlmodels import SQLModel

router = APIRouter(prefix="/test", tags=["test"])


@router.post("/reset-db")
async def reset_database(db: Session = Depends(get_db)) -> dict:
    """Reset the database to a clean state.
    This endpoint is only available in test environments.
    """
    # Drop all tables
    SQLModel.metadata.drop_all(bind=engine)
    # Recreate all tables
    SQLModel.metadata.create_all(bind=engine)
    return {"message": "Database reset successfully"}
