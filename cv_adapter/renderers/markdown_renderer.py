from pathlib import Path
from typing import Union

from cv_adapter.models.cv import CV, Education, Experience, SkillGroup
from cv_adapter.renderers.base import BaseRenderer, RendererError


class MarkdownRenderer(BaseRenderer):
    """Renderer for CV in Markdown format."""

    def _render_header(self, cv: CV) -> str:
        return f"# {cv.full_name}\n\n## {cv.title}\n\n{cv.description.text}\n\n"

    def _render_core_competences(self, cv: CV) -> str:
        return (
            "## Core Competences\n\n"
            + "\n".join(f"* {comp.text}" for comp in cv.core_competences.items)
            + "\n\n"
        )

    def _render_experience(self, exp: Experience) -> str:
        company_info = exp.company.name
        if exp.company.location:
            company_info += f" ({exp.company.location})"

        date_range = f"{exp.start_date.strftime('%b %Y')} - "
        date_range += exp.end_date.strftime("%b %Y") if exp.end_date else "Present"

        return (
            f"### {exp.position} at {company_info}\n"
            f"_{date_range}_\n\n"
            f"{exp.description}\n\n"
            "**Technologies:** " + ", ".join(exp.technologies) + "\n\n"
        )

    def _render_experiences(self, cv: CV) -> str:
        return "## Professional Experience\n\n" + "".join(
            self._render_experience(exp) for exp in cv.experiences
        )

    def _render_education(self, edu: Education) -> str:
        uni_info = edu.university.name
        if edu.university.location:
            uni_info += f" ({edu.university.location})"

        date_range = f"{edu.start_date.strftime('%b %Y')} - "
        date_range += edu.end_date.strftime("%b %Y") if edu.end_date else "Present"

        return (
            f"### {edu.degree}\n_{uni_info}_\n_{date_range}_\n\n{edu.description}\n\n"
        )

    def _render_educations(self, cv: CV) -> str:
        return "## Education\n\n" + "".join(
            self._render_education(edu) for edu in cv.education
        )

    def _render_skill_group(self, group: SkillGroup) -> str:
        return (
            f"### {group.name}\n"
            + ", ".join(skill.text for skill in group.skills)
            + "\n\n"
        )

    def _render_skills(self, cv: CV) -> str:
        return "## Skills\n\n" + "".join(
            self._render_skill_group(group) for group in cv.skills.groups
        )

    def _render_contacts(self, cv: CV) -> str:
        return (
            "## Contacts\n\n"
            + "\n".join(f"* {k}: {v}" for k, v in cv.contacts.items())
            + "\n"
        )

    def render_to_string(self, cv: CV) -> str:
        """Render CV to Markdown string.

        Args:
            cv: CV object to render

        Returns:
            Markdown string representation of the CV

        Raises:
            RendererError: If rendering fails
        """
        try:
            sections = [
                self._render_header(cv),
                self._render_core_competences(cv),
                self._render_experiences(cv),
                self._render_educations(cv),
                self._render_skills(cv),
                self._render_contacts(cv),
            ]
            return "".join(sections)
        except Exception as e:
            raise RendererError(f"Error rendering CV to Markdown: {e}")

    def render_to_file(self, cv: CV, file_path: Union[str, Path]) -> None:
        """Render CV to Markdown file.

        Args:
            cv: CV object to render
            file_path: Path where to save the Markdown file

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            with open(file_path, "w") as f:
                f.write(self.render_to_string(cv))
        except Exception as e:
            raise RendererError(f"Error saving CV to Markdown file: {e}")
