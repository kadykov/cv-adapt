import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import Skills
from cv_adapter.services.skills_generator import SkillsGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model."""
    model = TestModel()
    model.custom_result_args = {
        "groups": [
            {
                "name": "Programming",
                "skills": [
                    {"text": "Python"},
                    {"text": "JavaScript"},
                    {"text": "SQL"},
                ],
            },
            {
                "name": "Cloud & DevOps",
                "skills": [
                    {"text": "AWS"},
                    {"text": "Docker"},
                    {"text": "Kubernetes"},
                ],
            },
            {
                "name": "Soft Skills",
                "skills": [
                    {"text": "Team Leadership"},
                    {"text": "Agile Project Management"},
                    {"text": "Technical Mentoring"},
                ],
            },
        ]
    }
    return model


def test_skills_generator(test_model: TestModel) -> None:
    generator = SkillsGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        skills = generator.generate(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences="Python Development, Cloud Architecture, Team Leadership, Data Engineering",
        )

        assert isinstance(skills, Skills)
        assert len(skills.groups) == 3

        # Test programming group
        prog_group = skills.groups[0]
        assert prog_group.name == "Programming"
        assert len(prog_group.skills) == 3
        assert prog_group.skills[0].text == "Python"

        # Test cloud group
        cloud_group = skills.groups[1]
        assert cloud_group.name == "Cloud & DevOps"
        assert len(cloud_group.skills) == 3
        assert "AWS" in [skill.text for skill in cloud_group.skills]

        # Test soft skills group
        soft_group = skills.groups[2]
        assert soft_group.name == "Soft Skills"
        assert len(soft_group.skills) == 3
        assert "Team Leadership" in [skill.text for skill in soft_group.skills]


def test_skills_generator_with_notes(test_model: TestModel) -> None:
    generator = SkillsGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        skills = generator.generate(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences="Python Development, Cloud Architecture, Team Leadership, Data Engineering",
            notes="Focus on cloud and DevOps skills",
        )

        assert len(skills.groups) == 3
        cloud_group = [g for g in skills.groups if g.name == "Cloud & DevOps"][0]
        assert len(cloud_group.skills) == 3


def test_skills_validation(test_model: TestModel) -> None:
    generator = SkillsGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        with pytest.raises(ValueError, match="CV text is required"):
            generator.generate(
                cv_text="",
                job_description=("# Job Description\n\nSeeking a senior developer..."),
                core_competences="Python Development",
            )

        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(
                cv_text="# CV\n\nDetailed professional experience...",
                job_description="",
                core_competences="Python Development",
            )

        with pytest.raises(ValueError, match="Core competences are required"):
            generator.generate(
                cv_text="# CV\n\nDetailed professional experience...",
                job_description=("# Job Description\n\nSeeking a senior developer..."),
                core_competences="",
            )
