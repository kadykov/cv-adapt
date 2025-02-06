import sys
from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import Body, Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from cv_adapter.core.async_application import AsyncCVAdapterApplication
from cv_adapter.dto.cv import ContactDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import ENGLISH, Language, LanguageCode
from cv_adapter.models.context import language_context

from . import auth_logger, logger
from .core.database import get_db
from .core.deps import get_current_user
from .core.security import create_access_token, create_refresh_token, verify_token
from .models.models import User
from .schemas.auth import AuthResponse
from .schemas.cv import (
    DetailedCVCreate,
    DetailedCVResponse,
    DetailedCVUpdate,
    GeneratedCVCreate,
    GeneratedCVResponse,
    JobDescriptionCreate,
    JobDescriptionResponse,
    JobDescriptionUpdate,
)
from .schemas.user import UserCreate, UserResponse, UserUpdate
from .services.cv import DetailedCVService, GeneratedCVService, JobDescriptionService
from .services.user import UserService

app = FastAPI(title="CV Adapter Web Interface")

# Configure CORS with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Allow both localhost variants
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods during development
    allow_headers=["*"],  # Allow all headers during development
    expose_headers=["*"],  # Expose all headers during development
    max_age=3600,  # Cache preflight requests for 1 hour
)


# Language dependency
async def get_language(language_code: str = Query(default="en")) -> Language:
    """Dependency to get language from request, defaulting to English."""
    try:
        if not language_code:
            logger.debug("No language code provided, defaulting to English")
            return ENGLISH
        # Validate language code and get registered language instance
        lang_code = LanguageCode(language_code)
        language = Language.get(lang_code)
        logger.debug(f"Using language: {language.code}")
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
        logger.debug(f"Raw request data: {request.model_dump()}")
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

        # Use Pydantic's model_dump with datetime serialization
        return JSONResponse(content=cv.model_dump(mode="json"))
    except Exception as e:
        logger.error(f"Error generating CV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Authentication routes
@app.post("/v1/auth/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate, db: Session = Depends(get_db)
) -> AuthResponse:
    """Register a new user."""
    auth_logger.debug(f"Registration attempt for email: {user_data.email}")

    user_service = UserService(db)
    existing_user = user_service.get_by_email(user_data.email)

    if existing_user:
        auth_logger.warning(f"Registration failed - email already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Email already registered",
                "code": "EMAIL_EXISTS",
                "field": "email"
            }
        )

    try:
        user = user_service.create_user(user_data)
        auth_logger.info(f"User registered successfully: {user.email}")
    except Exception as e:
        auth_logger.error(f"Registration failed for {user_data.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Registration failed", "code": "REGISTRATION_ERROR"}
        )

    # Create tokens
    access_token = create_access_token(int(user.id))
    refresh_token = create_refresh_token(int(user.id))

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=int(user.id),
            email=str(user.email),
            personal_info=dict(user.personal_info) if user.personal_info else None,
            created_at=datetime.fromtimestamp(
                user.created_at.timestamp()
            ),  # created_at should never be None for a valid user
        ),
    )


@app.post("/v1/auth/login", response_model=AuthResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> AuthResponse:
    """Login user."""
    auth_logger.debug(f"Login attempt for username: {form_data.username}")

    user_service = UserService(db)
    try:
        user = user_service.authenticate(form_data.username, form_data.password)
        if not user:
            auth_logger.warning(f"Login failed - invalid credentials for: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "message": "Incorrect email or password",
                    "code": "INVALID_CREDENTIALS",
                    "field": "password"
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        auth_logger.debug(f"Creating tokens for user: {user.email}")
        # Create tokens
        access_token = create_access_token(int(user.id))
        refresh_token = create_refresh_token(int(user.id))
        auth_logger.info(f"User logged in successfully: {user.email}")
    except HTTPException:
        raise
    except Exception as e:
        auth_logger.error(f"Login failed for {form_data.username}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Login failed", "code": "LOGIN_ERROR"}
        )

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=int(user.id),
            email=str(user.email),
            personal_info=dict(user.personal_info) if user.personal_info else None,
            created_at=datetime.fromtimestamp(
                user.created_at.timestamp()
            ),  # created_at should never be None for a valid user
        ),
    )


@app.post("/v1/auth/logout", status_code=status.HTTP_200_OK)
async def logout() -> dict[str, str]:
    """Logout user."""
    # Since we're using JWT, we don't need to do anything server-side
    # The client should clear the tokens from local storage
    return {"status": "success"}


@app.post("/v1/auth/refresh", response_model=AuthResponse)
async def refresh_token(
    token: str = Body(..., embed=True), db: Session = Depends(get_db)
) -> AuthResponse:
    """Refresh access token using refresh token."""
    payload = verify_token(token, expected_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Invalid refresh token",
                "code": "INVALID_REFRESH_TOKEN",
                "field": "token"
            }
        )

    user_service = UserService(db)
    user = user_service.get(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "User not found",
                "code": "USER_NOT_FOUND",
                "field": "token"
            }
        )

    # Create new tokens
    access_token = create_access_token(int(user.id))
    refresh_token = create_refresh_token(int(user.id))

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=int(user.id),
            email=str(user.email),
            personal_info=dict(user.personal_info) if user.personal_info else None,
            created_at=datetime.fromtimestamp(
                user.created_at.timestamp()
            ),  # created_at should never be None for a valid user
        ),
    )


# User profile routes
@app.get("/user/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get current user's profile."""
    return UserResponse(
        id=int(current_user.id),
        email=str(current_user.email),
        personal_info=dict(current_user.personal_info)
        if current_user.personal_info
        else None,
        created_at=datetime.fromtimestamp(current_user.created_at.timestamp()),
    )


@app.put("/user/profile", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserResponse:
    """Update current user's profile."""
    user_service = UserService(db)
    updated_user = user_service.update_personal_info(current_user, user_data)
    return UserResponse(
        id=int(updated_user.id),
        email=str(updated_user.email),
        personal_info=dict(updated_user.personal_info)
        if updated_user.personal_info
        else None,
        created_at=datetime.fromtimestamp(updated_user.created_at.timestamp()),
    )


# Detailed CV routes
@app.get("/user/detailed-cvs", response_model=list[DetailedCVResponse])
async def get_user_detailed_cvs(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[DetailedCVResponse]:
    """Get all user's detailed CVs."""
    cv_service = DetailedCVService(db)
    cvs = cv_service.get_user_cvs(int(current_user.id))
    return [DetailedCVResponse.model_validate(cv) for cv in cvs]


@app.get("/user/detailed-cvs/{language_code}", response_model=DetailedCVResponse)
async def get_user_detailed_cv(
    language_code: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> DetailedCVResponse:
    """Get user's detailed CV by language."""
    cv_service = DetailedCVService(db)
    cv = cv_service.get_by_user_and_language(int(current_user.id), language_code)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No CV found for language: {language_code}",
        )
    return DetailedCVResponse.model_validate(cv)


@app.put("/user/detailed-cvs/{language_code}", response_model=DetailedCVResponse)
async def upsert_user_detailed_cv(
    language_code: str,
    cv_data: DetailedCVCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> DetailedCVResponse:
    """Create or update user's detailed CV for a language."""
    if cv_data.language_code != language_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Language code in URL must match CV language",
        )

    cv_service = DetailedCVService(db)
    existing_cv = cv_service.get_by_user_and_language(
        int(current_user.id), language_code
    )

    if existing_cv:
        # Update existing CV
        update_data = DetailedCVUpdate(
            content=cv_data.content, is_primary=cv_data.is_primary
        )
        cv = cv_service.update_cv(existing_cv, update_data)
        return DetailedCVResponse.model_validate(cv)

    # Create new CV
    cv = cv_service.create_cv(int(current_user.id), cv_data)
    return DetailedCVResponse.model_validate(cv)


@app.delete(
    "/user/detailed-cvs/{language_code}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_user_detailed_cv(
    language_code: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> None:
    """Delete user's detailed CV by language."""
    cv_service = DetailedCVService(db)
    cv = cv_service.get_by_user_and_language(int(current_user.id), language_code)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No CV found for language: {language_code}",
        )
    cv_service.delete(int(cv.id))


@app.put(
    "/user/detailed-cvs/{language_code}/primary", response_model=DetailedCVResponse
)
async def set_primary_cv(
    language_code: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> DetailedCVResponse:
    """Set a CV as primary."""
    cv_service = DetailedCVService(db)
    cv = cv_service.get_by_user_and_language(int(current_user.id), language_code)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No CV found for language: {language_code}",
        )

    update_data = DetailedCVUpdate(is_primary=True)
    cv = cv_service.update_cv(cv, update_data)
    return DetailedCVResponse.model_validate(cv)


# Job description routes
@app.get("/jobs", response_model=list[JobDescriptionResponse])
async def get_jobs(
    language: Language = Depends(get_language),
    db: Session = Depends(get_db),
) -> list[JobDescriptionResponse]:
    """Get all job descriptions for a language."""
    job_service = JobDescriptionService(db)
    jobs = job_service.get_by_language(language.code)
    return [JobDescriptionResponse.model_validate(job) for job in jobs]


@app.get("/jobs/{job_id}", response_model=JobDescriptionResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db),
) -> JobDescriptionResponse:
    """Get job description by ID."""
    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    return JobDescriptionResponse.model_validate(job)


@app.post("/jobs", response_model=JobDescriptionResponse)
async def create_job(
    job_data: JobDescriptionCreate,
    db: Session = Depends(get_db),
) -> JobDescriptionResponse:
    """Create new job description."""
    job_service = JobDescriptionService(db)
    job = job_service.create_job_description(job_data)
    return JobDescriptionResponse.model_validate(job)


@app.put("/jobs/{job_id}", response_model=JobDescriptionResponse)
async def update_job(
    job_id: int,
    job_data: JobDescriptionUpdate,
    db: Session = Depends(get_db),
) -> JobDescriptionResponse:
    """Update job description."""
    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    job = job_service.update_job_description(job, job_data)
    return JobDescriptionResponse.model_validate(job)


@app.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete job description."""
    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    job_service.delete(int(job.id))


# Generated CV routes
@app.post("/generate", response_model=GeneratedCVResponse)
async def generate_and_save_cv(
    cv_data: GeneratedCVCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> GeneratedCVResponse:
    """Generate and save a new CV for job application."""
    generated_cv_service = GeneratedCVService(db)
    cv = generated_cv_service.create_generated_cv(int(current_user.id), cv_data)
    return GeneratedCVResponse.model_validate(cv)


@app.get("/generations", response_model=list[GeneratedCVResponse])
async def get_user_generations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[GeneratedCVResponse]:
    """Get all generated CVs for current user."""
    generated_cv_service = GeneratedCVService(db)
    cvs = generated_cv_service.get_by_user(int(current_user.id))
    return [GeneratedCVResponse.model_validate(cv) for cv in cvs]


@app.get("/generations/{cv_id}", response_model=GeneratedCVResponse)
async def get_generated_cv(
    cv_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> GeneratedCVResponse:
    """Get a specific generated CV."""
    generated_cv_service = GeneratedCVService(db)
    cv = generated_cv_service.get(cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated CV not found",
        )
    # Check if CV belongs to current user
    if cv.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    return GeneratedCVResponse.model_validate(cv)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
