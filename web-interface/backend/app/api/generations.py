"""API endpoints for CV generation."""

import sys
from typing import Annotated, Dict, List

from fastapi import APIRouter, Body, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from cv_adapter.core.async_application import AsyncCVAdapterApplication
from cv_adapter.dto.cv import ContactDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import Language

from ..core.database import get_db
from ..core.deps import get_current_user, get_language
from ..logger import logger
from ..models.models import User
from ..schemas.cv import (
    GeneratedCVCreate,
    GeneratedCVResponse,
    GeneratedCVUpdate,
)
from ..services.generation.protocols import (
    GenerationError,
    ValidationError,
)
from ..services.generation.service import CVGenerationServiceImpl
from ..services.repositories import EntityNotFoundError

# Initialize Async CV Adapter with configurable AI model
cv_adapter = AsyncCVAdapterApplication(
    ai_model="test" if "pytest" in sys.modules else "openai:gpt-4"
)


# Initialize service factory to be used by all routes
def get_generation_service(db: Session = Depends(get_db)) -> CVGenerationServiceImpl:
    """Get CV generation service instance."""
    return CVGenerationServiceImpl(db, cv_adapter)


router = APIRouter(prefix="/v1/api/generations", tags=["generations"])


# Request models
class GenerateCompetencesRequest(BaseModel):
    cv_text: str
    job_description: str
    notes: str | None = None


class ContactRequest(BaseModel):
    value: str
    type: str
    icon: str | None = None
    url: str | None = None


class PersonalInfo(BaseModel):
    full_name: str
    email: ContactRequest
    phone: ContactRequest | None = None
    location: ContactRequest | None = None


class GenerateCVRequest(BaseModel):
    cv_text: str
    job_description: str
    personal_info: PersonalInfo
    approved_competences: List[str]
    notes: str | None = None


@router.post("/competences")
async def generate_competences(
    data: GenerateCompetencesRequest = Body(...),
    language: Language = Depends(get_language),
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> Dict[str, List[str]]:
    """Generate core competences from CV and job description."""
    logger.debug(f"Generating competences with language: {language.code}")
    logger.debug(
        f"Request data: CV length={len(data.cv_text)}, "
        f"Job desc length={len(data.job_description)}"
    )
    try:
        competences = await service.generate_competences(
            cv_text=data.cv_text,
            job_description=data.job_description,
            notes=data.notes,
            language=language,
        )
        result = {"competences": [comp.text for comp in competences]}
        logger.debug(f"Generated {len(competences)} competences: {result}")
        return result
    except GenerationError as e:
        logger.error(f"Generation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cv")
async def generate_cv(
    request: GenerateCVRequest,
    language: Language = Depends(get_language),
    service: CVGenerationServiceImpl = Depends(get_generation_service),
    response: Response = None,  # type: ignore[assignment]
) -> Response:
    """Generate a complete CV using core competences."""
    logger.debug(f"Generating CV with language: {language.code}")
    logger.debug(
        f"Request data: CV length={len(request.cv_text)}, "
        f"Job desc length={len(request.job_description)}"
    )
    logger.debug(f"Approved competences: {request.approved_competences}")

    try:
        # Convert request data to DTOs
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
        core_competences = [
            CoreCompetenceDTO(text=comp) for comp in request.approved_competences
        ]

        # Generate CV using service
        cv = await service.generate_cv(
            cv_text=request.cv_text,
            job_description=request.job_description,
            personal_info=personal_info,
            competences=core_competences,
            notes=request.notes,
            language=language,
        )

        logger.debug("CV generation successful")
        logger.debug(f"Generated CV title: {cv.title.text}")
        logger.debug(f"Generated CV summary length: {len(cv.summary.text)}")
        logger.debug(f"Number of experiences: {len(cv.experiences)}")
        logger.debug(f"Number of education entries: {len(cv.education)}")
        logger.debug(f"Number of skills: {len(cv.skills)}")

        return Response(content=cv.model_dump_json(), media_type="application/json")
    except Exception as e:
        logger.error(f"Generation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=GeneratedCVResponse)
async def generate_and_save_cv(
    cv_data: GeneratedCVCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> GeneratedCVResponse:
    """Generate and save a new CV for job application."""
    try:
        return await service.generate_and_store_cv(
            user_id=int(current_user.id),
            detailed_cv_id=cv_data.detailed_cv_id,
            job_description_id=cv_data.job_description_id,
            language_code=cv_data.language_code,
            generation_parameters=cv_data.generation_parameters,
        )
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[GeneratedCVResponse])
async def get_user_generations(
    current_user: Annotated[User, Depends(get_current_user)],
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> list[GeneratedCVResponse]:
    """Get all generated CVs for current user."""
    try:
        user_cvs = service.repository.get_user_generated_cvs(int(current_user.id))
        return [GeneratedCVResponse.model_validate(cv) for cv in user_cvs]
    except Exception as e:
        logger.error(f"Error fetching user generations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{cv_id}", response_model=GeneratedCVResponse)
async def update_generated_cv(
    cv_id: int,
    cv_data: GeneratedCVUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> GeneratedCVResponse:
    """Update a generated CV's status or parameters."""
    try:
        cv = service.repository.get_generated_cv(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

        # Check if CV belongs to current user
        if cv.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        if cv_data.status is not None:
            return await service.update_cv_status(cv_id, cv_data.status)

        if cv_data.generation_parameters is not None:
            return await service.update_generation_parameters(
                cv_id, cv_data.generation_parameters
            )

        # No updates provided
        return GeneratedCVResponse.model_validate(cv)

    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cv_id}", response_model=GeneratedCVResponse)
async def get_generated_cv(
    cv_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> GeneratedCVResponse:
    """Get a specific generated CV."""
    try:
        cv = service.repository.get_generated_cv(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

        # Check if CV belongs to current user
        if cv.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        return GeneratedCVResponse.model_validate(cv)

    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
