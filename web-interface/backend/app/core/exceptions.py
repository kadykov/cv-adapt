"""Base exceptions for the application."""


class GenerationError(Exception):
    """Base exception for CV generation errors."""

    pass


class ValidationError(Exception):
    """Base exception for validation errors."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(message)
        self.field = field


class EntityNotFoundError(Exception):
    """Raised when a requested entity is not found."""

    pass


class AuthenticationError(Exception):
    """Base exception for authentication-related errors."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(message)
        self.field = field
