"""Base database service."""

from typing import Any, Generic, List, Optional, Type, TypeVar

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models.models import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseDBService(Generic[ModelType]):
    """Base class for database services."""

    def __init__(self, db: Session, model: Type[ModelType]):
        """Initialize service with database session and model."""
        self.db = db
        self.model = model

    def get(self, id: int) -> Optional[ModelType]:
        """Get model instance by ID."""
        return self.db.query(self.model).filter(self.model.id == id).first()  # type: ignore

    def get_multi(self, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Get multiple model instances with pagination."""
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, **data: Any) -> ModelType:
        """Create new model instance."""
        db_obj = self.model(**data)
        self.db.add(db_obj)
        try:
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            self.db.rollback()
            raise e

    def update(self, db_obj: ModelType, **data: Any) -> ModelType:
        """Update model instance."""
        for key, value in data.items():
            setattr(db_obj, key, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, id: int) -> bool:
        """Delete model instance by ID."""
        obj = self.get(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False
