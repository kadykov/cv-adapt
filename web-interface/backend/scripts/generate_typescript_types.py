"""Script to generate TypeScript interface definitions from Python models.

This script generates TypeScript definitions for the API by converting Python models to
JSON Schema and then to TypeScript using json-schema-to-typescript.
"""

import json
import subprocess
import sys
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any, Dict, List, Type

# Add backend directory to Python path before importing local modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Local imports
from app.main import (  # type: ignore[import-not-found] # noqa: E402
    GenerateCompetencesRequest,
    GenerateCVRequest,
    PersonalInfo,
)

from cv_adapter.dto.language import Language, LanguageCode  # noqa: E402
from cv_adapter.renderers.json_renderer import JSONRenderer  # noqa: E402

# Alias for clarity
PersonalInfoRequest = PersonalInfo


def generate_typescript_types() -> None:
    """Generate TypeScript interface definitions from Python models."""
    # Create types directory if it doesn't exist
    target_dir = Path(__file__).parent.parent.parent / "frontend" / "src" / "types"
    target_dir.mkdir(exist_ok=True)
    output_file = target_dir / "api.ts"

    # Get CV schema from JSONRenderer
    cv_schema = JSONRenderer.get_json_schema()

    # List of models that aren't part of CV schema but need types
    additional_models: List[Type[Any]] = [
        Language,
        LanguageCode,
        GenerateCompetencesRequest,
        GenerateCVRequest,
        PersonalInfoRequest,
    ]

    combined_schema = create_combined_schema(cv_schema, additional_models)
    root_schema = create_root_schema(combined_schema)

    generate_typescript_file(root_schema, target_dir, output_file)
    print(f"TypeScript interfaces generated at {output_file}")


def create_combined_schema(
    cv_schema: Dict[str, Any], additional_models: List[Type[Any]]
) -> Dict[str, Any]:
    """Create a combined JSON schema from CV schema and additional models."""
    combined_schema = cv_schema.copy()

    for model in additional_models:
        if hasattr(model, "model_json_schema"):
            # Handle Pydantic models
            model_schema = model.model_json_schema()
            # Convert definitions to $defs if present
            if "definitions" in model_schema:
                model_schema["$defs"] = model_schema.pop("definitions")
            if "$defs" in model_schema:
                combined_schema["$defs"].update(model_schema["$defs"])
            # Update refs to use $defs
            json_str = json.dumps(model_schema)
            json_str = json_str.replace('"#/definitions/', '"#/$defs/')
            model_schema = json.loads(json_str)
            # Add to $defs
            combined_schema["$defs"][model.__name__] = model_schema
        elif isinstance(model, type) and issubclass(model, LanguageCode):
            # Handle Enum
            enum_schema = {
                "type": "string",
                "enum": [e.value for e in model],
                "title": model.__name__,
            }
            combined_schema["$defs"][model.__name__] = enum_schema

    return combined_schema


def create_root_schema(combined_schema: Dict[str, Any]) -> Dict[str, Any]:
    """Create the root schema with all types as properties."""
    root_schema: Dict[str, Any] = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {},
        "$defs": combined_schema["$defs"],
    }

    # Add each model from CV schema and additional models to root properties
    all_model_names = [
        "CVDTO",
        "ContactDTO",
        "PersonalInfoDTO",
        "CoreCompetenceDTO",
        "InstitutionDTO",
        "ExperienceDTO",
        "EducationDTO",
        "SkillDTO",
        "SkillGroupDTO",
        "TitleDTO",
        "SummaryDTO",
        "Language",
        "LanguageCode",
        "GenerateCompetencesRequest",
        "GenerateCVRequest",
        "PersonalInfoRequest",
    ]

    for name in all_model_names:
        if name in combined_schema["$defs"]:
            root_schema["properties"][name] = {"$ref": f"#/$defs/{name}"}
            root_schema["required"] = root_schema.get("required", []) + [name]

    return root_schema


def generate_typescript_file(
    root_schema: Dict[str, Any], target_dir: Path, output_file: Path
) -> None:
    """Generate TypeScript file from JSON schema."""
    with NamedTemporaryFile(mode="w", suffix=".json") as schema_file:
        try:
            # Write schema to temp file
            schema_json = json.dumps(root_schema, indent=2)
            schema_file.write(schema_json)
            schema_file.flush()
        except Exception as e:
            print(f"Error generating schema: {e}")
            raise

        # Use npx to run json-schema-to-typescript and capture output
        process = subprocess.run(
            ["npx", "json-schema-to-typescript", schema_file.name],
            cwd=str(target_dir.parent),
            check=True,
            capture_output=True,
            text=True,
        )

        # Write the output to our file along with additional types
        with open(output_file, "w") as f:
            f.write(
                """/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the generation script to regenerate this file.
 */

"""
            )
            f.write(process.stdout)
            f.write(
                """
export interface GenerateCompetencesResponse {
    competences: string[];
}
"""
            )


if __name__ == "__main__":
    generate_typescript_types()
