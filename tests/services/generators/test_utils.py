from datetime import date

import pytest
from pydantic import BaseModel

from cv_adapter.dto.cv import (
    CVDTO,
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
from cv_adapter.dto.language import ENGLISH
from cv_adapter.services.generators.protocols import GenerationContext
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


class JobDescriptionDTO(BaseModel):
    title: str


def create_test_template(tmp_path, filename: str, content: str) -> str:
    """Create a temporary template file for testing."""
    template_path = tmp_path / filename
    template_path.write_text(content)
    return str(template_path)


def test_load_system_prompt_success(tmp_path):
    """Test successful loading of a system prompt template."""
    template_content = "You are a helpful AI assistant for CV generation."
    template_path = create_test_template(
        tmp_path, "system_prompt.txt", template_content
    )

    result = load_system_prompt(template_path)
    assert result == template_content


def test_load_system_prompt_file_not_found():
    """Test handling of non-existent template file."""
    with pytest.raises(FileNotFoundError):
        load_system_prompt("/path/to/nonexistent/template.txt")


def test_load_system_prompt_empty_template(tmp_path):
    """Test handling of an empty template."""
    template_path = create_test_template(tmp_path, "empty_prompt.txt", "")

    with pytest.raises(RuntimeError, match="Rendered system prompt is empty"):
        load_system_prompt(template_path)


def test_prepare_context_success(tmp_path):
    """Test successful context preparation."""
    # Create a test template
    template_content = """
    Language: {{ language }}
    Job Title: {{ job_description.title }}
    CV Name: {{ cv.personal_info.full_name }}
    Notes: {{ notes }}
    Extra: {{ extra_info }}
    """
    template_path = create_test_template(
        tmp_path, "context_template.txt", template_content
    )

    # Prepare test data
    context = GenerationContext(
        cv=CVDTO(
            personal_info=PersonalInfoDTO(full_name="John Doe"),
            title=TitleDTO(text="Software Engineer"),
            summary=SummaryDTO(text="Professional summary"),
            core_competences=[CoreCompetenceDTO(text="Core competence")],
            experiences=[
                ExperienceDTO(
                    company=InstitutionDTO(name="Test Company"),
                    position="Software Engineer",
                    start_date=date(2020, 1, 1),
                    description="Work experience",
                )
            ],
            education=[
                EducationDTO(
                    university=InstitutionDTO(name="Test University"),
                    degree="Computer Science",
                    start_date=date(2016, 1, 1),
                    end_date=date(2020, 1, 1),
                )
            ],
            skills=[
                SkillGroupDTO(name="Programming", skills=[SkillDTO(text="Python")])
            ],
            language=ENGLISH,
        ),
        job_description=JobDescriptionDTO(title="Software Engineer"),
        language=ENGLISH,
        notes="Test context",
    )

    # Prepare context with extra info
    result = prepare_context(template_path, context, extra_info="Additional details")

    # Verify the rendered context
    assert "Language: en" in result
    assert "Job Title: Software Engineer" in result
    assert "CV Name: John Doe" in result
    assert "Notes: Test context" in result
    assert "Extra: Additional details" in result


def test_prepare_context_file_not_found():
    """Test handling of non-existent context template."""
    context = GenerationContext(
        cv=CVDTO(
            personal_info=PersonalInfoDTO(full_name="John Doe"),
            title=TitleDTO(text="Software Engineer"),
            summary=SummaryDTO(text="Professional summary"),
            core_competences=[CoreCompetenceDTO(text="Core competence")],
            experiences=[
                ExperienceDTO(
                    company=InstitutionDTO(name="Test Company"),
                    position="Software Engineer",
                    start_date=date(2020, 1, 1),
                    description="Work experience",
                )
            ],
            education=[
                EducationDTO(
                    university=InstitutionDTO(name="Test University"),
                    degree="Computer Science",
                    start_date=date(2016, 1, 1),
                    end_date=date(2020, 1, 1),
                )
            ],
            skills=[
                SkillGroupDTO(name="Programming", skills=[SkillDTO(text="Python")])
            ],
            language=ENGLISH,
        ),
        job_description=JobDescriptionDTO(title="Software Engineer"),
        language=ENGLISH,
        notes="Test context",
    )

    with pytest.raises(ValueError, match="Context template file does not exist"):
        prepare_context("/path/to/nonexistent/template.txt", context)


def test_prepare_context_empty_template(tmp_path):
    """Test handling of an empty context template."""
    template_path = create_test_template(tmp_path, "empty_context.txt", "")

    context = GenerationContext(
        cv=CVDTO(
            personal_info=PersonalInfoDTO(full_name="John Doe"),
            title=TitleDTO(text="Software Engineer"),
            summary=SummaryDTO(text="Professional summary"),
            core_competences=[CoreCompetenceDTO(text="Core competence")],
            experiences=[
                ExperienceDTO(
                    company=InstitutionDTO(name="Test Company"),
                    position="Software Engineer",
                    start_date=date(2020, 1, 1),
                    description="Work experience",
                )
            ],
            education=[
                EducationDTO(
                    university=InstitutionDTO(name="Test University"),
                    degree="Computer Science",
                    start_date=date(2016, 1, 1),
                    end_date=date(2020, 1, 1),
                )
            ],
            skills=[
                SkillGroupDTO(name="Programming", skills=[SkillDTO(text="Python")])
            ],
            language=ENGLISH,
        ),
        job_description=JobDescriptionDTO(title="Software Engineer"),
        language=ENGLISH,
        notes="Test context",
    )

    with pytest.raises(RuntimeError, match="Rendered context template is empty"):
        prepare_context(template_path, context)
