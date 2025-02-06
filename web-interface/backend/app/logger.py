import logging
import os
import sys
from typing import Any

# Configure log level from environment variable
log_level = os.environ.get("LOG_LEVEL", "INFO").upper()

# Custom formatter with more details
class DetailedFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        record.pathname = record.pathname.split('app/')[-1] if 'app/' in record.pathname else record.pathname
        return super().format(record)

# Create formatters
detailed_formatter = DetailedFormatter(
    '%(asctime)s | %(levelname)-8s | %(pathname)s:%(lineno)d | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Create handlers
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(detailed_formatter)

# Configure root logger
logging.basicConfig(
    level=getattr(logging, log_level),
    handlers=[console_handler]
)

def get_logger(name: str, level: str | None = None) -> logging.Logger:
    """
    Get a logger with the specified name and optional level.

    Args:
        name: The name of the logger
        level: Optional log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        A configured logger instance
    """
    logger = logging.getLogger(name)
    if level:
        logger.setLevel(getattr(logging, level.upper()))
    return logger

# Create main application logger
logger = get_logger("cv-adapter")

# Create specialized loggers
auth_logger = get_logger("cv-adapter.auth", "DEBUG")
api_logger = get_logger("cv-adapter.api")
db_logger = get_logger("cv-adapter.db")
