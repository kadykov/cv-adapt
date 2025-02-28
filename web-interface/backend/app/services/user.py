"""User database service."""

from typing import Optional

import bcrypt
from sqlalchemy.orm import Session

from ..models.models import User
from ..schemas.user import UserCreate, UserUpdate
from .base import BaseDBService


class UserService(BaseDBService[User]):
    """Service for handling user database operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db, User)

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def create_user(self, user_data: UserCreate) -> User:
        """Create new user with hashed password."""
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(user_data.password.encode(), salt)
        db_user = User(
            email=user_data.email,
            hashed_password=hashed_password.decode(),
            personal_info={},
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update_personal_info(self, user: User, user_data: UserUpdate) -> User:
        """Update user's personal info."""
        return self.update(user, personal_info=user_data.personal_info)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hashed password."""
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password."""
        from ..logger import auth_logger

        auth_logger.debug(f"Authenticating user with email: {email}")
        user = self.get_by_email(email)

        if not user:
            auth_logger.warning(f"Authentication failed - user not found: {email}")
            return None

        if not self.verify_password(password, str(user.hashed_password)):
            auth_logger.warning(
                f"Authentication failed - invalid password for user: {email}"
            )
            return None

        auth_logger.info(f"Authentication successful for user: {email}")
        return user
