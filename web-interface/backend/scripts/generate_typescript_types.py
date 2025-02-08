"""Script to generate TypeScript interface definitions from Python models.

This script generates TypeScript definitions for the API by converting Python models to
JSON Schema and then to TypeScript using json-schema-to-typescript.
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Literal, Type

from pydantic import BaseModel
from pydantic.json_schema import models_json_schema

# Add backend directory to Python path before importing local modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Local imports
from cv_adapter.dto.cv import PersonalInfoDTO as PersonalInfo  # noqa: E402
from app.api.generations import GenerateCompetencesRequest, GenerateCVRequest  # noqa: E402
from app.schemas.cv import (  # noqa: E402
    DetailedCVBase,
    DetailedCVCreate,
    DetailedCVUpdate,
    DetailedCVResponse,
    JobDescriptionBase,
    JobDescriptionCreate,
    JobDescriptionUpdate,
    JobDescriptionResponse,
    GeneratedCVBase,
    GeneratedCVCreate,
    GeneratedCVResponse,
)
from app.schemas.base import BaseResponseModel, TimestampedModel  # noqa: E402

from cv_adapter.dto.cv import (  # noqa: E402
    CVDTO,
    ContactDTO,
    CoreCompetenceDTO,
    EducationDTO,
    ExperienceDTO,
    InstitutionDTO,
    MinimalCVDTO,
    PersonalInfoDTO,
    SkillDTO,
    SkillGroupDTO,
    SummaryDTO,
    TitleDTO,
)
from cv_adapter.dto.language import Language  # noqa: E402

# Alias for clarity
PersonalInfoRequest = PersonalInfo  # type: ignore


def generate_typescript_types() -> None:
    """Generate TypeScript interface definitions from Python models."""
    # Create types directory if it doesn't exist
    target_dir = Path(__file__).parent.parent.parent / "frontend" / "src" / "types"
    target_dir.mkdir(exist_ok=True)
    output_file = target_dir / "api.ts"

    # List all models that need TypeScript interfaces
    models: List[tuple[Type[BaseModel], Literal["validation", "serialization"]]] = [
        (CVDTO, "validation"),
        (MinimalCVDTO, "validation"),
        (ContactDTO, "validation"),
        (PersonalInfoDTO, "validation"),
        (CoreCompetenceDTO, "validation"),
        (InstitutionDTO, "validation"),
        (ExperienceDTO, "validation"),
        (EducationDTO, "validation"),
        (SkillDTO, "validation"),
        (SkillGroupDTO, "validation"),
        (TitleDTO, "validation"),
        (SummaryDTO, "validation"),
        (Language, "validation"),
        (GenerateCompetencesRequest, "validation"),
        (GenerateCVRequest, "validation"),
        (PersonalInfoRequest, "validation"),
        # New models for persistence
        (BaseResponseModel, "validation"),
        (TimestampedModel, "validation"),
        (DetailedCVBase, "validation"),
        (DetailedCVCreate, "validation"),
        (DetailedCVUpdate, "validation"),
        (DetailedCVResponse, "validation"),
        (JobDescriptionBase, "validation"),
        (JobDescriptionCreate, "validation"),
        (JobDescriptionUpdate, "validation"),
        (JobDescriptionResponse, "validation"),
        (GeneratedCVBase, "validation"),
        (GeneratedCVCreate, "validation"),
        (GeneratedCVResponse, "validation"),
    ]

    # Generate JSON schema using Pydantic
    _, combined_schema = models_json_schema(models, title="CV Adapter API")

    root_schema = create_root_schema(combined_schema)
    generate_typescript_file(root_schema, target_dir, output_file)
    print(f"TypeScript interfaces generated at {output_file}")


def create_root_schema(combined_schema: Dict[str, Any]) -> Dict[str, Any]:
    """Create the root schema with all types as properties."""
    root_schema: Dict[str, Any] = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {},
        "$defs": combined_schema.get("$defs", {}),
    }

    # Get all model names from the schema
    model_names = list(root_schema["$defs"].keys())

    # Add all models as properties
    for name in model_names:
        root_schema["properties"][name] = {"$ref": f"#/$defs/{name}"}
        root_schema["required"] = root_schema.get("required", []) + [name]

    return root_schema


def generate_typescript_file(
    root_schema: Dict[str, Any], target_dir: Path, output_file: Path
) -> None:
    """Generate TypeScript file from JSON schema."""
    try:
        # Convert schema to JSON string
        schema_json = json.dumps(root_schema, indent=2)

        # Use npx to run json-schema-to-typescript and pipe schema through stdin
        process = subprocess.run(
            ["npx", "json-schema-to-typescript", "/dev/stdin"],
            input=schema_json,
            cwd=str(target_dir.parent),
            check=True,
            capture_output=True,
            text=True,
        )
    except Exception as e:
        print(f"Error generating TypeScript types: {e}")
        raise

    # Clean up the output by removing eslint-disable comment and write to file
    output = process.stdout.replace("/* eslint-disable */\n", "")
    with open(output_file, "w") as f:
        f.write(output)
        f.write(
            """
export interface GenerateCompetencesResponse {
    competences: string[];
}
"""
        )


if __name__ == "__main__":
    generate_typescript_types()
