# Persistence Layer Implementation

## Overview

The CV-Adapt project is evolving to support persistent storage and multi-user capabilities. This change addresses several key requirements:

1. Eliminate the need to re-enter unchanging information (detailed CV, personal information)
2. Support multiple detailed CVs in different languages
3. Enable a catalog of job descriptions with automatic ranking
4. Provide synchronization across devices

## Architecture Changes

The system is moving from a stateless architecture to a persistent multi-user system with:
- User authentication and authorization
- PostgreSQL database for persistent storage
- Hybrid local/server storage strategy
- Multi-language support for CVs

### Database Schema

```
users
  - id: integer (primary key)
  - email: string (unique)
  - hashed_password: string
  - personal_info: jsonb
  - created_at: timestamp

detailed_cvs
  - id: integer (primary key)
  - user_id: integer (foreign key)
  - language_code: string
  - content: jsonb
  - is_primary: boolean
  - created_at: timestamp
  - updated_at: timestamp
  - UNIQUE(user_id, language_code)

job_descriptions
  - id: integer (primary key)
  - title: string
  - description: text
  - language_code: string
  - created_at: timestamp
  - updated_at: timestamp

generated_cvs
  - id: integer (primary key)
  - user_id: integer (foreign key)
  - detailed_cv_id: integer (foreign key)
  - job_description_id: integer (foreign key)
  - language_code: string
  - content: jsonb
  - created_at: timestamp
```

### API Design

#### Authentication
```
POST /auth/register
  Request: { email: string, password: string }
  Response: { access_token: string }

POST /auth/login
  Request: { email: string, password: string }
  Response: { access_token: string }

POST /auth/logout
  Response: { status: "success" }
```

#### User Profile
```
GET /user/profile
  Response: { email: string, personal_info: object }

PUT /user/profile
  Request: { personal_info: object }
  Response: { status: "success" }
```

#### Detailed CV Management
```
GET /user/detailed-cvs
  Response: DetailedCV[]

GET /user/detailed-cvs/:language
  Response: DetailedCV

PUT /user/detailed-cvs/:language
  Request: { content: object, is_primary: boolean }
  Response: DetailedCV

DELETE /user/detailed-cvs/:language
  Response: { status: "success" }

PUT /user/detailed-cvs/:language/primary
  Response: { status: "success" }
```

#### Job Descriptions
```
GET /jobs
  Query: { language?: string }
  Response: {
    jobs: Array<{
      id: string,
      title: string,
      description: string,
      language_code: string,
      ranking_score: number
    }>
  }

GET /jobs/:language
  Response: JobDescription[]

POST /jobs/:language
  Request: { title: string, description: string }
  Response: JobDescription

PUT /jobs/:id
  Request: { title?: string, description?: string }
  Response: JobDescription

DELETE /jobs/:id
  Response: { status: "success" }
```

#### CV Generation
```
POST /generate
  Request: {
    detailed_cv_id: string,
    job_description_id: string,
    output_language: string
  }
  Response: GeneratedCV

GET /generations
  Response: GeneratedCV[]

GET /generations/:id
  Response: GeneratedCV
```

## Implementation Plan

### Phase 1: Database Setup and Core Models ✓
- [X] Set up PostgreSQL database
- [X] Add SQLAlchemy and dependencies
- [X] Implement User model
- [X] Implement DetailedCV model
- [X] Implement JobDescription model
- [X] Implement GeneratedCV model
- [X] Set up Alembic for migrations
- [X] Write initial migration

### Phase 2: Authentication System
- [ ] Add JWT authentication dependencies
- [ ] Implement password hashing utilities
- [ ] Create authentication service
- [ ] Add login endpoint
- [ ] Add registration endpoint
- [ ] Implement authentication middleware

### Phase 3: API Implementation
- [ ] Implement user profile endpoints
- [ ] Implement detailed CV endpoints
- [ ] Implement job description endpoints
- [ ] Implement CV generation endpoints
- [ ] Add language support to all endpoints

### Phase 4: Frontend Integration
- [ ] Add authentication UI
- [ ] Implement CV management interface
- [ ] Add job description catalog view
- [ ] Update CV generation flow
- [ ] Implement local storage caching

### Phase 5: Testing and Documentation
- [ ] Write unit tests for models
- [ ] Write integration tests for API
- [ ] Write end-to-end tests
- [ ] Update API documentation
- [ ] Add usage examples

## Technical Details

### Database Access Layer

The system uses SQLAlchemy as the ORM with Pydantic integration for data validation. Key components:

1. SQLAlchemy models for database schema representation
2. Pydantic models for request/response validation
3. Database service layer for encapsulated data access
4. Alembic for database migrations

#### Schema Models & Validation

The system uses Pydantic models for request/response validation:

##### Base Models
```python
class BaseResponseModel:
    id: int
    created_at: datetime

class TimestampedModel:
    created_at: datetime
    updated_at: datetime | None
```

##### User Models
```python
class UserBase:
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate:
    personal_info: Dict

class UserResponse(BaseResponseModel, UserBase):
    personal_info: Dict | None
```

##### CV Models
```python
class DetailedCVBase:
    language_code: str
    content: Dict
    is_primary: bool = False

class DetailedCVCreate(DetailedCVBase):
    pass

class DetailedCVUpdate:
    content: Dict | None
    is_primary: bool | None

class DetailedCVResponse(BaseResponseModel, DetailedCVBase, TimestampedModel):
    user_id: int
```

#### Database Service Layer

The system implements a generic base service that provides common CRUD operations:

```python
class BaseDBService(Generic[ModelType]):
    def __init__(self, db: Session, model: Type[ModelType]):
        self.db = db
        self.model = model

    def get(self, id: int) -> ModelType | None
    def get_multi(self, *, skip: int = 0, limit: int = 100) -> list[ModelType]
    def create(self, **data) -> ModelType
    def update(self, db_obj: ModelType, **data) -> ModelType
    def delete(self, id: int) -> bool
```

Specialized services extend this base:

##### User Service
```python
class UserService(BaseDBService[User]):
    def get_by_email(self, email: str) -> Optional[User]
    def create_user(self, user_data: UserCreate) -> User
    def update_personal_info(self, user: User, user_data: UserUpdate) -> User
    def verify_password(self, plain_password: str, hashed_password: str) -> bool
    def authenticate(self, email: str, password: str) -> Optional[User]
```

##### CV Services
```python
class DetailedCVService(BaseDBService[DetailedCV]):
    def get_by_user_and_language(self, user_id: int, language_code: str) -> Optional[DetailedCV]
    def get_user_cvs(self, user_id: int) -> List[DetailedCV]
    def create_cv(self, user_id: int, cv_data: DetailedCVCreate) -> DetailedCV
    def update_cv(self, cv: DetailedCV, cv_data: DetailedCVUpdate) -> DetailedCV

class JobDescriptionService(BaseDBService[JobDescription]):
    def get_by_language(self, language_code: str) -> List[JobDescription]
    def create_job_description(self, job_data: JobDescriptionCreate) -> JobDescription
    def update_job_description(self, job: JobDescription, job_data: JobDescriptionUpdate) -> JobDescription

class GeneratedCVService(BaseDBService[GeneratedCV]):
    def get_by_user(self, user_id: int) -> List[GeneratedCV]
    def create_generated_cv(self, user_id: int, cv_data: GeneratedCVCreate) -> GeneratedCV
```

### Authentication Flow

JWT-based authentication flow:

1. User registers/logs in with email/password
2. Server validates credentials and returns JWT token
3. Client includes token in Authorization header
4. Server validates token and identifies user
5. Token refresh mechanism for extended sessions

Security considerations:
- Password hashing with bcrypt
- JWT expiration and refresh tokens
- HTTPS for all API communication
- Rate limiting for authentication endpoints

### Multilingual Support

The system supports multiple languages at several levels:

1. Detailed CVs
   - One CV per language per user
   - Primary CV designation for ranking
   - Language code tracking

2. Job Descriptions
   - Language-specific descriptions
   - Language filtering in catalog
   - Ranking based on CV language match

3. Generated CVs
   - Source language tracking
   - Output language specification
   - Cross-language generation support

### Local Storage Strategy

Browser local storage will cache:

1. Authentication token
2. User profile and personal info
3. Current detailed CV (per language)
4. Recent job descriptions
5. Recent generated CVs

Synchronization strategy:
- Background sync when online
- Offline changes queue
- Conflict resolution with server version wins
- Cache invalidation on version mismatch

## Migration Strategy

1. Database Setup
   - Deploy new database without affecting existing system
   - Run initial migrations
   - Verify database connectivity and performance

2. API Migration
   - Deploy new endpoints alongside existing ones
   - Update documentation with new endpoints
   - Mark old endpoints as deprecated

3. Frontend Updates
   - Add authentication UI
   - Update CV management flow
   - Implement local storage
   - Add offline support

4. Testing and Validation
   - Verify data integrity
   - Test authentication flow
   - Validate multilingual support
   - Check offline functionality

5. Rollout
   - Gradual user migration
   - Monitor system performance
   - Collect user feedback
   - Address issues as they arise

Each phase will be implemented incrementally to minimize disruption to existing users while ensuring a smooth transition to the new architecture.
