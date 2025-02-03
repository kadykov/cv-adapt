"""Tests for JSON Schema generation in JSONRenderer."""

import json
from datetime import date
from typing import Any, Dict

import pytest
from pydantic import TypeAdapter

from cv_adapter.dto.cv import (
    CVDTO,
    ContactDTO,
    CoreCompetenceDTO,
    EducationDTO,
    ExperienceDTO,
    InstitutionDTO,
    PersonalInfoDTO,
    SkillDTO,
    SkillGroupDTO,
    SummaryDTO,
    TitleDTO,
)
from cv_adapter.dto.language import ENGLISH, LanguageCode
from cv_adapter.renderers.json_renderer import JSONRenderer


@pytest.fixture
def schema() -> Dict[str, Any]:
    """Get the JSON schema for testing."""
    return JSONRenderer.get_json_schema()


@pytest.fixture
def minimal_cv() -> CVDTO:
    """Create a minimal CV with required fields only."""
    return CVDTO(
        language=ENGLISH,
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(value="john@example.com", type=None, icon=None, url=None),
            phone=ContactDTO(value="+1234567890", type=None, icon=None, url=None),
        ),
        title=TitleDTO(text="Software Engineer"),
        summary=SummaryDTO(text="A software engineer"),
        core_competences=[CoreCompetenceDTO(text="Programming")],
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(name="Company"),
                position="Developer",
                start_date=date(2020, 1, 1),
                description="Development",
            )
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(name="University"),
                degree="Computer Science",
                start_date=date(2015, 1, 1),
                description="CS Degree",
            )
        ],
        skills=[SkillGroupDTO(name="Languages", skills=[SkillDTO(text="Python")])],
    )


@pytest.fixture
def complete_cv() -> CVDTO:
    """Create a complete CV with all fields populated."""
    return CVDTO(
        language=ENGLISH,
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(
                value="john@example.com",
                type="work",
                icon="📧",
                url="mailto:john@example.com",
            ),
            phone=ContactDTO(value="+1234567890", type="mobile", icon="📱", url=None),
            location=ContactDTO(value="New York", type=None, icon=None, url=None),
            github=ContactDTO(
                value="github.com/johndoe",
                type="github",
                icon="🔗",
                url="https://github.com/johndoe",
            ),
        ),
        title=TitleDTO(text="Senior Software Engineer"),
        summary=SummaryDTO(text="Experienced software engineer"),
        core_competences=[
            CoreCompetenceDTO(text="Python"),
            CoreCompetenceDTO(text="Architecture"),
        ],
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(name="Tech Corp", location="New York"),
                position="Senior Engineer",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 12, 31),
                description="Led backend development",
                technologies=["Python", "FastAPI"],
            ),
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(name="University", location="Boston"),
                degree="Computer Science",
                start_date=date(2015, 9, 1),
                end_date=date(2019, 5, 31),
                description="Focus on distributed systems",
            ),
        ],
        skills=[
            SkillGroupDTO(
                name="Programming",
                skills=[SkillDTO(text="Python"), SkillDTO(text="JavaScript")],
            ),
        ],
    )


def test_schema_structure(schema: Dict[str, Any]) -> None:
    """Test complete schema structure including all nested objects."""
    # Test schema metadata
    assert schema["$schema"] == "http://json-schema.org/draft-07/schema#"
    assert schema["title"] == "CV"
    assert "description" in schema

    # Test required fields
    required = schema.get("required", [])
    assert "language" in required
    assert "personal_info" in required

    # Test property types
    props = schema["properties"]
    assert props["language"]["type"] == "string"
    assert props["personal_info"]["type"] == "object"
    assert props["experiences"]["type"] == "array"
    assert props["skills"]["type"] == "array"

    # Test nested object structure
    personal_info = props["personal_info"]["properties"]
    assert "full_name" in personal_info
    assert "email" in personal_info
    assert "phone" in personal_info

    # Test array item definitions
    exp_items = props["experiences"]["items"]
    assert exp_items["type"] == "object"
    assert "start_date" in exp_items["properties"]
    assert "end_date" in exp_items["properties"]


def test_type_transformations(schema: Dict[str, Any]) -> None:
    """Test all custom type transformations in schema."""
    # Test Language enum transformation
    assert schema["properties"]["language"]["type"] == "string"
    assert set(schema["properties"]["language"]["enum"]) == {
        code.value for code in LanguageCode
    }

    # Test date format transformations
    exp_props = schema["properties"]["experiences"]["items"]["properties"]
    for date_field in ["start_date", "end_date"]:
        assert exp_props[date_field]["type"] == "string"
        assert exp_props[date_field]["format"] == "date"
        assert exp_props[date_field]["pattern"] == r"^\d{4}-\d{2}-\d{2}$"

    # Test ContactDTO schema
    contact_def = schema["$defs"]["ContactDTO"]
    assert contact_def["type"] == "object"
    props = contact_def["properties"]
    assert "value" in props
    assert "type" in props
    assert "icon" in props
    assert "url" in props


def test_schema_validation_edge_cases(schema: Dict[str, Any]) -> None:
    """Test validation of edge cases and boundary conditions."""
    renderer = JSONRenderer()

    # Test empty arrays
    cv = CVDTO(
        language=ENGLISH,
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(value="john@example.com", type=None, icon=None, url=None),
            phone=ContactDTO(value="+1234567890", type=None, icon=None, url=None),
        ),
        title=TitleDTO(text="Software Engineer"),
        summary=SummaryDTO(text="A software engineer"),
        core_competences=[],
        experiences=[],
        education=[
            EducationDTO(
                university=InstitutionDTO(name="University"),
                degree="Computer Science",
                start_date=date(2015, 1, 1),
                description="CS Degree",
            )
        ],
        skills=[],
    )

    # Use render_to_string to handle Language object conversion
    cv_json = renderer.render_to_string(cv)
    cv_dict = json.loads(cv_json)

    # Should validate successfully with empty arrays
    renderer.validate_json(cv_dict)


def test_schema_reusability(schema: Dict[str, Any]) -> None:
    """Test schema reuse and composition patterns."""
    # Test common definitions are properly referenced
    assert "$defs" in schema
    defs = schema["$defs"]

    # Test common types are defined once and reused
    assert "ContactDTO" in defs
    assert "InstitutionDTO" in defs

    # Verify references are used consistently
    exp_props = schema["properties"]["experiences"]["items"]["properties"]
    assert "company" in exp_props
    edu_props = schema["properties"]["education"]["items"]["properties"]
    assert "university" in edu_props


def test_property_constraints(schema: Dict[str, Any], complete_cv: CVDTO) -> None:
    """Test property constraints and validations."""
    renderer = JSONRenderer()

    # Test required field validation
    cv_json = renderer.render_to_string(complete_cv)
    cv_dict = json.loads(cv_json)
    renderer.validate_json(cv_dict)

    # Test missing required field
    invalid_dict = cv_dict.copy()
    del invalid_dict["personal_info"]["full_name"]
    with pytest.raises(Exception):
        renderer.validate_json(invalid_dict)

    # Test invalid language code
    invalid_dict = cv_dict.copy()
    invalid_dict["language"] = "invalid"
    with pytest.raises(Exception):
        renderer.validate_json(invalid_dict)


def test_schema_versioning(schema: Dict[str, Any]) -> None:
    """Test schema versioning and compatibility."""
    # Test schema version identifier
    assert schema["$schema"] == "http://json-schema.org/draft-07/schema#"

    # Get schema structure for version comparison
    def get_schema_structure(schema_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Extract core structure without metadata."""
        return {
            "properties": schema_dict["properties"],
            "required": schema_dict.get("required", []),
            "type": schema_dict["type"],
        }

    # Compare with Pydantic-generated base schema
    adapter = TypeAdapter(CVDTO)
    base_schema = adapter.json_schema()
    transformed_structure = get_schema_structure(schema)
    base_structure = get_schema_structure(base_schema)

    # Verify core structure remains compatible
    assert transformed_structure["type"] == base_structure["type"]
    assert set(transformed_structure["required"]) == set(base_structure["required"])


def test_minimal_cv_validation(schema: Dict[str, Any], minimal_cv: CVDTO) -> None:
    """Test validation of minimal CV with only required fields."""
    renderer = JSONRenderer()
    cv_json = renderer.render_to_string(minimal_cv)
    cv_dict = json.loads(cv_json)

    # Should validate with only required fields
    renderer.validate_json(cv_dict)
