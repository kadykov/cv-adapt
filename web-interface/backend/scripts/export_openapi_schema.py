#!/usr/bin/env python3
"""Script to export OpenAPI schema from FastAPI app."""

import json
import os
import sys
from pathlib import Path

from app.main import app

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


def export_schema() -> None:
    """Export OpenAPI schema to JSON file."""
    # Get schema from FastAPI app
    schema = app.openapi()

    # Create target directory in backend/docs/api if it doesn't exist
    target_dir = Path(__file__).parent.parent / "docs" / "api"
    target_dir.mkdir(exist_ok=True)

    # Write schema to file
    schema_path = target_dir / "openapi.json"
    with open(schema_path, "w") as f:
        json.dump(schema, f, indent=2)

    print(f"OpenAPI schema exported to {schema_path}")

    # Print reminder about schema location change
    print("\nNote: OpenAPI schema is now exported to backend/docs/api/")
    print(
        "Frontend applications should fetch the schema from this location during build."
    )


if __name__ == "__main__":
    # Ensure we're in test mode to get all endpoints
    os.environ["TESTING"] = "1"
    export_schema()
