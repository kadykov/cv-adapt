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
                "name": "Technical Skills",
                "skills": [
                    {"text": "Python"},
                    {"text": "Kubernetes"},
                    {"text": "Docker"},
                    {"text": "AWS"},
                    {"text": "Cloud Architecture"},
                    {"text": "Apache Spark"},
                    {"text": "Airflow"},
                ],
            },
            {
                "name": "Soft Skills",
                "skills": [
                    {"text": "Team Leadership"},
                    {"text": "Project Management"},
                    {"text": "Communication"},
                    {"text": "Problem Solving"},
                ],
            },
            {
                "name": "Languages",
                "skills": [
                    {"text": "English (Native)"},
                    {"text": "Spanish (Professional)"},
                ],
            },
            {
                "name": "Certifications",
                "skills": [
                    {"text": "AWS Certified Solutions Architect"},
                    {"text": "Kubernetes Administrator (CKA)"},
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
            core_competences=(
                "Python Development, Cloud Architecture, "
                "Team Leadership, Data Engineering"
            ),
        )

        assert isinstance(skills, Skills)
        assert len(skills.groups) >= 1

        # Find technical skills group
        tech_group = next(g for g in skills.groups if g.name == "Technical Skills")
        assert len(tech_group.skills) >= 5
        assert any(s.text == "Python" for s in tech_group.skills)

        # Find soft skills group
        soft_group = next(g for g in skills.groups if g.name == "Soft Skills")
        assert any(s.text == "Team Leadership" for s in soft_group.skills)

        # Find languages group
        lang_group = next(g for g in skills.groups if g.name == "Languages")
        assert len(lang_group.skills) >= 1

        # Find certifications group
        cert_group = next(g for g in skills.groups if g.name == "Certifications")
        assert len(cert_group.skills) >= 1


def test_skills_generator_with_notes(test_model: TestModel) -> None:
    generator = SkillsGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        skills = generator.generate(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences=(
                "Python Development, Cloud Architecture, "
                "Team Leadership, Data Engineering"
            ),
            notes="Focus on cloud and DevOps skills",
        )

        assert isinstance(skills, Skills)
        tech_group = next(g for g in skills.groups if g.name == "Technical Skills")
        assert any("cloud" in s.text.lower() for s in tech_group.skills)


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
