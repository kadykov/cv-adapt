import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.cv import SkillDTO, SkillGroupDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.services.generators.skills_generator import SkillsGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model for skills generation."""
    model = TestModel()
    model.custom_result_args = {
        "data": {
            "groups": [
                {
                    "name": "Programming Languages",
                    "skills": [
                        {"text": "Python"},
                        {"text": "JavaScript"},
                        {"text": "TypeScript"},
                    ],
                },
                {
                    "name": "Frameworks",
                    "skills": [
                        {"text": "React"},
                        {"text": "Django"},
                        {"text": "FastAPI"},
                    ],
                },
            ]
        }
    }
    return model


def test_skills_generator_dto_output(test_model: TestModel) -> None:
    """Test that the skills generator returns a valid List[SkillGroupDTO]."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Initialize generator
        generator = SkillsGenerator(ai_model="test")

        # Use agent override to set the test model
        with generator.agent.override(model=test_model):
            # Generate skills
            result = generator.generate(
                cv="Experienced software engineer with diverse technical skills",
                job_description=(
                    "Seeking a senior software engineer "
                    "with full-stack development skills"
                ),
                core_competences="Technical Leadership, Advanced Learning",
            )

            # Verify the result is a list of SkillGroupDTO
            assert isinstance(result, list)
            assert all(isinstance(group, SkillGroupDTO) for group in result)

            # Verify skill groups
            assert len(result) > 0

            # Verify each skill group
            for group in result:
                assert isinstance(group, SkillGroupDTO)
                assert isinstance(group.name, str)
                assert len(group.skills) > 0

                # Verify each skill
                for skill in group.skills:
                    assert isinstance(skill, SkillDTO)
                    assert isinstance(skill.text, str)
                    assert len(skill.text) > 0
