from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.dto.cv import CVDTO, ContactDTO, PersonalInfoDTO
from cv_adapter.services.generators import CoreCompetenceGenerationContext

app = FastAPI(title="CV Adapter Web Interface")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request models
class GenerateCompetencesRequest(BaseModel):
    cv_text: str
    job_description: str
    notes: Optional[str] = None


class PersonalInfo(BaseModel):
    full_name: str
    email: ContactDTO
    phone: Optional[ContactDTO] = None
    location: Optional[ContactDTO] = None


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
) -> dict[str, list[str]]:
    try:
        # Generate core competences
        context = CoreCompetenceGenerationContext(
            cv=request.cv_text,
            job_description=request.job_description,
            notes=request.notes,
        )
        competences = cv_adapter.competence_generator(context)
        # Convert competences to a list if it's not already
        competences_list = (
            competences.competences if hasattr(competences, "competences") else []
        )
        return {"competences": competences_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-cv")
async def generate_cv(request: GenerateCVRequest) -> CVDTO:
    try:
        # Convert personal info to DTO
        personal_info = PersonalInfoDTO(
            full_name=request.personal_info.full_name,
            email=request.personal_info.email,
            phone=request.personal_info.phone,
            location=request.personal_info.location,
        )

        # # Create context with approved competences
        # context = CoreCompetenceGenerationContext(
        #     cv=request.cv_text,
        #     job_description=request.job_description,
        #     notes=request.notes,
        # )

        # Generate complete CV
        cv = cv_adapter.generate_cv(
            cv_text=request.cv_text,
            job_description=request.job_description,
            personal_info=personal_info,
            notes=request.notes,
        )

        return cv
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
