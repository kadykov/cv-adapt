---
name: repo
type: repo
agent: CodeActAgent
---

Repository: CV Adapt
Description: Application for adapting CV and generating cover letters based on job descriptions

Directory Structure:
- `cv_adapter/`: Main application code
- `tests/`: Test files

Setup:
- Run `just install` to install dependencies
- Run `source .venv/bin/activate`to activate the environment

Guidelines:
- Write tests for all new features
- Run `just lint` for running linting checks
- Run `just test` for running all tests
- Before commiting anything run `just all` and fix errors if necessary
- When adding new packages, always use `uv add` instead of `uv pip install`
- This project uses `pydantic-ai` Python pakcage for type-safe interaction with LLMs
