from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.dto.cv import CVDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import ENGLISH, Language
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
async def get_language(language: Language = ENGLISH) -> Language:
    """Dependency to get language from request, defaulting to English."""
    return language


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


# Initialize CV Adapter
cv_adapter = CVAdapterApplication()


@app.post("/api/generate-competences")
async def generate_competences(
    request: GenerateCompetencesRequest,
    language: Language = Depends(get_language),
) -> dict[str, list[str]]:
    try:
        with language_context(language):
            competences = cv_adapter.generate_core_competences(
                cv_text=request.cv_text,
                job_description=request.job_description,
                notes=request.notes,
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
        personal_info = PersonalInfoDTO(
            full_name=request.personal_info.full_name,
            email=request.personal_info.email,
            phone=request.personal_info.phone,
            location=request.personal_info.location,
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
