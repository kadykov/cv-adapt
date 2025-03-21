"""Base database service."""

from typing import Any, Generic, Optional, Sequence, Type, TypeVar

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, SQLModel, select

ModelType = TypeVar("ModelType", bound=SQLModel)


class BaseDBService(Generic[ModelType]):
    """Base class for database services."""

    def __init__(self, db: Session, model: Type[ModelType]):
        """Initialize service with database session and model."""
        self.db = db
        self.model = model

    def get(self, id: int) -> Optional[ModelType]:
        """Get model instance by ID."""
        statement = select(self.model).where(self.model.id == id)  # type: ignore
        return self.db.exec(statement).first()

    def get_multi(self, *, skip: int = 0, limit: int = 100) -> Sequence[ModelType]:
        """Get multiple model instances with pagination."""
        statement = select(self.model).offset(skip).limit(limit)
        return self.db.exec(statement).all()

    def create(self, **data: Any) -> ModelType:
        """Create new model instance."""
        db_obj = self.model(**data)  # type: ignore[call-arg]
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
        statement = select(self.model).where(self.model.id == id)  # type: ignore
        db_obj = self.db.exec(statement).first()
        if db_obj:
            self.db.delete(db_obj)
            self.db.commit()
            return True
        return False
