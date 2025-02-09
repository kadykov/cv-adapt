#!/usr/bin/env python3
"""Script to export OpenAPI schema from FastAPI app."""
import json
import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

def export_schema() -> None:
    """Export OpenAPI schema to JSON file."""
    # Get schema from FastAPI app
    schema = app.openapi()

    # Create target directory if it doesn't exist
    target_dir = Path(__file__).parent.parent.parent / "frontend" / "src" / "api"
    target_dir.mkdir(exist_ok=True)

    # Write schema to file
    schema_path = target_dir / "openapi.json"
    with open(schema_path, "w") as f:
        json.dump(schema, f, indent=2)

    print(f"OpenAPI schema exported to {schema_path}")

if __name__ == "__main__":
    # Ensure we're in test mode to get all endpoints
    os.environ["TESTING"] = "1"
    export_schema()
