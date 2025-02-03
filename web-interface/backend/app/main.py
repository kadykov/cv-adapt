import json
import sys
from typing import List, Optional

from fastapi import Body, Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from cv_adapter.core.async_application import AsyncCVAdapterApplication
from cv_adapter.dto.cv import ContactDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import ENGLISH, Language, LanguageCode
from cv_adapter.models.context import language_context
from cv_adapter.renderers.json_renderer import JSONRenderer

from . import logger

app = FastAPI(title="CV Adapter Web Interface")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Language dependency
async def get_language(language_code: str = Query(default="en")) -> Language:
    """Dependency to get language from request, defaulting to English."""
    try:
        if not language_code:
            logger.debug("No language code provided, defaulting to English")
            return ENGLISH
        # Validate language code before trying to get Language instance
        lang_code = LanguageCode(language_code)
        language = Language.get(lang_code)
        logger.debug(f"Using language: {language.code} ({language.name})")
        return language
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


class ContactRequest(BaseModel):
    value: str
    type: str
    icon: Optional[str] = None
    url: Optional[str] = None


class PersonalInfo(BaseModel):
    full_name: str
    email: ContactRequest
    phone: Optional[ContactRequest] = None
    location: Optional[ContactRequest] = None


class GenerateCVRequest(BaseModel):
    cv_text: str
    job_description: str
    personal_info: PersonalInfo
    approved_competences: List[str]
    notes: Optional[str] = None


# Initialize Async CV Adapter with configurable AI model
cv_adapter = AsyncCVAdapterApplication(
    ai_model="test" if "pytest" in sys.modules else "openai:gpt-4o"
)


@app.post("/api/generate-competences")
async def generate_competences(
    data: GenerateCompetencesRequest = Body(...),
    language: Language = Depends(get_language),
) -> dict[str, list[str]]:
    logger.debug(f"Generating competences with language: {language.code}")
    logger.debug(
        f"Request data: CV length={len(data.cv_text)}, "
        f"Job desc length={len(data.job_description)}"
    )
    try:
        with language_context(language):
            competences = await cv_adapter.generate_core_competences(
                cv_text=data.cv_text,
                job_description=data.job_description,
                notes=data.notes,
            )
            result = {"competences": [comp.text for comp in competences]}
            logger.debug(f"Generated {len(competences)} competences: {result}")
            return result
    except Exception as e:
        logger.error(f"Error generating competences: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-cv")
async def generate_cv(
    request: GenerateCVRequest,
    language: Language = Depends(get_language),
    response: Response = None,  # type: ignore[assignment]
) -> Response:
    logger.debug(f"Generating CV with language: {language.code}")
    logger.debug(
        f"Request data: CV length={len(request.cv_text)}, "
        f"Job desc length={len(request.job_description)}"
    )
    logger.debug(f"Approved competences: {request.approved_competences}")
    try:
        # Convert personal info to DTO
        logger.debug("Converting request data to DTOs")
        # Convert dict to ContactDTO objects
        email = ContactDTO(
            value=request.personal_info.email.value,
            type=request.personal_info.email.type,
            icon=request.personal_info.email.icon,
            url=request.personal_info.email.url,
        )
        phone = (
            ContactDTO(
                value=request.personal_info.phone.value,
                type=request.personal_info.phone.type,
                icon=request.personal_info.phone.icon,
                url=request.personal_info.phone.url,
            )
            if request.personal_info.phone
            else None
        )
        location = (
            ContactDTO(
                value=request.personal_info.location.value,
                type=request.personal_info.location.type,
                icon=request.personal_info.location.icon,
                url=request.personal_info.location.url,
            )
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
        logger.debug("Converting approved competences to CoreCompetenceDTO")
        core_competences = [
            CoreCompetenceDTO(text=comp) for comp in request.approved_competences
        ]
        logger.debug(f"Converted {len(core_competences)} competences")

        # Generate complete CV with competences
        with language_context(language):
            cv = await cv_adapter.generate_cv_with_competences(
                cv_text=request.cv_text,
                job_description=request.job_description,
                personal_info=personal_info,
                core_competences=core_competences,
                notes=request.notes,
            )

        logger.debug("CV generation successful")
        logger.debug(f"Generated CV title: {cv.title.text}")
        logger.debug(f"Generated CV summary length: {len(cv.summary.text)}")
        logger.debug(f"Number of experiences: {len(cv.experiences)}")
        logger.debug(f"Number of education entries: {len(cv.education)}")
        logger.debug(f"Number of skills: {len(cv.skills)}")

        # Use JSONRenderer to serialize CV DTO
        renderer = JSONRenderer()
        json_str = renderer.render_to_string(cv)
        return JSONResponse(content=json.loads(json_str))
    except Exception as e:
        logger.error(f"Error generating CV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
