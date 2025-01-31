import sys
from typing import List, Optional

from fastapi import Body, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.dto.cv import CVDTO, ContactDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import ENGLISH, Language, LanguageCode
from cv_adapter.models.context import language_context

app = FastAPI(title="CV Adapter Web Interface")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Language dependency
async def get_language(language_code: str = Query(default="en")) -> Language:
    """Dependency to get language from request, defaulting to English."""
    try:
        if not language_code:
            return ENGLISH
        # Validate language code before trying to get Language instance
        lang_code = LanguageCode(language_code)
        return Language.get(lang_code)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["query", "language_code"],
                    "msg": f"Invalid language code: {language_code}",
                    "type": "value_error",
                }
            ],
        )


# Request models
class GenerateCompetencesRequest(BaseModel):
    cv_text: str
    job_description: str
    notes: Optional[str] = None


class PersonalInfo(BaseModel):
    full_name: str
    email: dict
    phone: Optional[dict] = None
    location: Optional[dict] = None


class GenerateCVRequest(BaseModel):
    cv_text: str
    job_description: str
    personal_info: PersonalInfo
    approved_competences: List[str]
    notes: Optional[str] = None


# Initialize CV Adapter with configurable AI model
cv_adapter = CVAdapterApplication(
    ai_model="test" if "pytest" in sys.modules else "openai:gpt-4o"
)


@app.post("/api/generate-competences")
async def generate_competences(
    data: GenerateCompetencesRequest = Body(...),
    language: Language = Depends(get_language),
) -> dict[str, list[str]]:
    try:
        with language_context(language):
            competences = cv_adapter.generate_core_competences(
                cv_text=data.cv_text,
                job_description=data.job_description,
                notes=data.notes,
            )
            return {"competences": [comp.text for comp in competences]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-cv")
async def generate_cv(
    request: GenerateCVRequest,
    language: Language = Depends(get_language),
) -> CVDTO:
    try:
        # Convert personal info to DTO
        # Convert dict to ContactDTO objects
        email = ContactDTO(**request.personal_info.email, icon=None, url=None)
        phone = (
            ContactDTO(**request.personal_info.phone, icon=None, url=None)
            if request.personal_info.phone
            else None
        )
        location = (
            ContactDTO(**request.personal_info.location, icon=None, url=None)
            if request.personal_info.location
            else None
        )

        personal_info = PersonalInfoDTO(
            full_name=request.personal_info.full_name,
            email=email,
            phone=phone,
            location=location,
        )

        # Convert approved competences to CoreCompetenceDTO
        core_competences = [
            CoreCompetenceDTO(text=comp) for comp in request.approved_competences
        ]

        # Generate complete CV with competences
        with language_context(language):
            cv = cv_adapter.generate_cv_with_competences(
                cv_text=request.cv_text,
                job_description=request.job_description,
                personal_info=personal_info,
                core_competences=core_competences,
                notes=request.notes,
            )

        return cv
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
