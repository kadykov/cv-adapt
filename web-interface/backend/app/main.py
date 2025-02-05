import sys
from datetime import datetime
from typing import List, Optional

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

from . import logger
from .core.database import get_db
from .core.security import create_access_token, create_refresh_token, verify_token
from .schemas.auth import AuthResponse
from .schemas.user import UserCreate, UserResponse
from .services.user import UserService

app = FastAPI(title="CV Adapter Web Interface")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Dev server
    allow_credentials=True,
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
@app.post("/auth/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate, db: Session = Depends(get_db)
) -> AuthResponse:
    """Register a new user."""
    user_service = UserService(db)
    if user_service.get_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    user = user_service.create_user(user_data)

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


@app.post("/auth/login", response_model=AuthResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> AuthResponse:
    """Login user."""
    user_service = UserService(db)
    user = user_service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
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


@app.post("/auth/refresh", response_model=AuthResponse)
async def refresh_token(
    token: str = Body(..., embed=True), db: Session = Depends(get_db)
) -> AuthResponse:
    """Refresh access token using refresh token."""
    payload = verify_token(token, expected_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    user_service = UserService(db)
    user = user_service.get(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
