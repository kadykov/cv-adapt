"""API endpoints for CV generation."""

import sys
from datetime import datetime
from typing import Annotated, List, Literal

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi import status as http_status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ValidationError
from sqlmodel import Session

from cv_adapter.core.async_application import AsyncCVAdapterApplication
from cv_adapter.dto.cv import CVDTO, ContactDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import Language
from cv_adapter.renderers.json_renderer import JSONRenderer
from cv_adapter.renderers.markdown import MarkdownRenderer
from cv_adapter.renderers.pdf import PDFRenderer
from cv_adapter.renderers.yaml_renderer import YAMLRenderer

from ..core.database import get_db
from ..core.deps import get_current_user, get_language
from ..logger import logger
from ..models.sqlmodels import User
from ..schemas.common import (
    DateRange,
    GeneratedCVFilters,
    PaginatedResponse,
    PaginationParams,
)
from ..schemas.cv import (
    CoreCompetencesResponse,
    GeneratedCVCreate,
    GeneratedCVDirectResponse,
    GeneratedCVResponse,
    GeneratedCVUpdate,
    GenerationStatusResponse,
)
from ..services.generation.generation_service import CVGenerationServiceImpl
from ..services.generation.protocols import (
    GenerationError,
)
from ..services.generation.protocols import (
    ValidationError as GenerationValidationError,
)
from ..services.repositories import EntityNotFoundError

# Initialize Async CV Adapter with configurable AI model
cv_adapter = AsyncCVAdapterApplication(
    ai_model="test" if "pytest" in sys.modules else "openai:gpt-4"
)

# Initialize renderers
renderers = {
    "markdown": MarkdownRenderer(),
    "json": JSONRenderer(),
    "yaml": YAMLRenderer(),
    "pdf": PDFRenderer(),
}


def get_user_id(user: User) -> int:
    """Safely get user ID, ensuring it exists."""
    assert user.id is not None, "User ID must be set"
    return user.id


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


@router.post("/competences", response_model=CoreCompetencesResponse)
async def generate_competences(
    current_user: Annotated[User, Depends(get_current_user)],
    data: GenerateCompetencesRequest = Body(...),
    language: Language = Depends(get_language),
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> CoreCompetencesResponse:
    """Generate core competences from CV and job description.

    Requires authentication.
    """
    logger.debug(
        f"Generating competences for {current_user.id = } with {language.code = }"
    )
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
        response = CoreCompetencesResponse(
            core_competences=[comp.text for comp in competences]
        )
        logger.debug(f"Generated {len(competences)} competences")
        return response
    except GenerationError as e:
        logger.error(f"Generation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cv", response_model=CVDTO)
async def generate_cv(
    request: GenerateCVRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    language: Language = Depends(get_language),
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> CVDTO:
    """Generate a complete CV using core competences.

    Requires authentication.
    """
    logger.debug(
        f"Generating CV for user {current_user.id} with language: {language.code}"
    )
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

        return cv
    except GenerationError as e:
        logger.error(f"Generation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=GeneratedCVDirectResponse)
async def generate_and_save_cv(
    cv_data: GeneratedCVCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> GeneratedCVDirectResponse:
    """Generate and save a new CV for job application."""
    try:
        user_id = get_user_id(current_user)
        # Get generated CV and CVDTO
        stored_cv = await service.generate_and_store_cv(
            user_id=user_id,
            detailed_cv_id=cv_data.detailed_cv_id,
            job_description_id=cv_data.job_description_id,
            language_code=cv_data.language_code,
            generation_parameters=cv_data.generation_parameters,
        )

        # Convert to direct response with CVDTO
        # Create the response with reconstructed CVDTO
        try:
            cv_dto = CVDTO.model_validate(stored_cv.content)
            response = GeneratedCVDirectResponse(
                id=stored_cv.id,
                user_id=stored_cv.user_id,
                detailed_cv_id=stored_cv.detailed_cv_id,
                job_description_id=stored_cv.job_description_id,
                language_code=stored_cv.language_code,
                status=stored_cv.status,
                generation_status=stored_cv.generation_status,
                error_message=stored_cv.error_message,
                generation_parameters=stored_cv.generation_parameters,
                created_at=stored_cv.created_at,
                cv_content=cv_dto,
            )
            return response
        except ValidationError as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid CV data format: {str(e)}",
            ) from e
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except GenerationValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=PaginatedResponse[GeneratedCVResponse])
async def get_user_generations(
    current_user: Annotated[User, Depends(get_current_user)],
    service: CVGenerationServiceImpl = Depends(get_generation_service),
    offset: int = 0,
    limit: int = 10,
    status: str | None = None,
    language_code: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> PaginatedResponse[GeneratedCVResponse]:
    """Get all generated CVs for current user with filtering and pagination."""
    try:
        # Prepare filters
        date_range = None
        if start_date or end_date:
            date_range = DateRange(start=start_date, end=end_date)

        filters = GeneratedCVFilters(
            status=status,
            language_code=language_code,
            created_at=date_range,
        )

        pagination = PaginationParams(offset=offset, limit=limit)

        # Get CVs with filtering and pagination
        user_id = get_user_id(current_user)
        cvs, total = service.repository.get_user_generated_cvs(
            user_id,
            filters=filters,
            pagination=pagination,
        )

        # Convert to response models
        cv_responses = [GeneratedCVResponse.model_validate(cv) for cv in cvs]

        return PaginatedResponse.create(
            items=cv_responses,
            total=total,
            offset=offset,
            limit=limit,
        )

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
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
                status_code=http_status.HTTP_403_FORBIDDEN,
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
    except GenerationValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cv_id}/generation-status", response_model=GenerationStatusResponse)
async def check_generation_status(
    cv_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> GenerationStatusResponse:
    """Check the status of a CV generation process."""
    try:
        cv = service.repository.get_generated_cv(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

        # Check if CV belongs to current user
        if cv.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        # Get generation status
        status, error = await service.get_generation_status(cv_id)

        return GenerationStatusResponse(cv_id=cv_id, status=status, error=error)

    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking generation status: {str(e)}", exc_info=True)
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
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            ) from None

        return GeneratedCVResponse.model_validate(cv)

    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cv_id}/export")
async def export_generated_cv(
    cv_id: int,
    format: Literal["markdown", "json", "yaml", "pdf"],
    current_user: Annotated[User, Depends(get_current_user)],
    service: CVGenerationServiceImpl = Depends(get_generation_service),
) -> StreamingResponse:
    """Export a generated CV in the specified format."""
    try:
        # Get CV and check ownership
        cv = service.repository.get_generated_cv(cv_id)
        if not cv:
            raise EntityNotFoundError(
                f"Generated CV with id {cv_id} not found"
            ) from None

        if cv.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            ) from None

        # Get renderer for requested format
        try:
            renderer = renderers[format]
        except KeyError as e:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Format '{format}' is not supported",
            ) from e

        # Convert stored content to CVDTO and generate output
        try:
            cv_dto = CVDTO.model_validate(cv.content)
            export_content = renderer.render_to_string(cv_dto)
        except ValidationError as e:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid CV data format: {str(e)}",
            ) from e

        # Set appropriate content type and filename
        content_types = {
            "markdown": "text/markdown",
            "json": "application/json",
            "yaml": "application/x-yaml",
            "pdf": "application/pdf",
        }
        extensions = {
            "markdown": "md",
            "json": "json",
            "yaml": "yaml",
            "pdf": "pdf",
        }

        filename = f"cv_{cv_id}.{extensions[format]}"
        content_type = content_types[format]

        # Create streaming response
        headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

        return StreamingResponse(
            iter([export_content]),
            headers=headers,
            media_type=content_type,
        )

    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting CV: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e
