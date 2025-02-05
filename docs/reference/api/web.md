# Web API Reference

This section documents the web interface API endpoints for CV Adapt.

## Authentication

### POST /auth/register
Register a new user.

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response** (200):
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "personal_info": "object | null",
    "created_at": "datetime"
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body**:
```json
{
  "username": "string", // email
  "password": "string"
}
```

**Response** (200):
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "personal_info": "object | null",
    "created_at": "datetime"
  }
}
```

### POST /auth/logout
Logout user (clears client-side tokens).

**Response** (200):
```json
{
  "status": "success"
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body**:
```json
{
  "token": "string" // refresh token
}
```

**Response** (200):
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "personal_info": "object | null",
    "created_at": "datetime"
  }
}
```

## User Profile

### GET /user/profile
Get current user's profile.

**Response** (200):
```json
{
  "id": "integer",
  "email": "string",
  "personal_info": "object | null",
  "created_at": "datetime"
}
```

### PUT /user/profile
Update current user's profile.

**Request Body**:
```json
{
  "personal_info": "object"
}
```

**Response** (200):
```json
{
  "id": "integer",
  "email": "string",
  "personal_info": "object",
  "created_at": "datetime"
}
```

## Detailed CV Management

### GET /user/detailed-cvs
Get all detailed CVs for current user.

**Response** (200):
```json
[
  {
    "id": "integer",
    "user_id": "integer",
    "language_code": "string",
    "content": "object",
    "is_primary": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

### GET /user/detailed-cvs/:language_code
Get detailed CV for specific language.

**Response** (200):
```json
{
  "id": "integer",
  "user_id": "integer",
  "language_code": "string",
  "content": "object",
  "is_primary": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### PUT /user/detailed-cvs/:language_code
Create or update CV for specific language.

**Request Body**:
```json
{
  "language_code": "string",
  "content": "object",
  "is_primary": "boolean"
}
```

**Response** (200):
```json
{
  "id": "integer",
  "user_id": "integer",
  "language_code": "string",
  "content": "object",
  "is_primary": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### DELETE /user/detailed-cvs/:language_code
Delete CV for specific language.

**Response** (204): No content

### PUT /user/detailed-cvs/:language_code/primary
Set CV as primary for given language.

**Response** (200):
```json
{
  "id": "integer",
  "user_id": "integer",
  "language_code": "string",
  "content": "object",
  "is_primary": true,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Job Descriptions

### GET /jobs
Get job descriptions filtered by language.

**Query Parameters**:
- `language_code`: string (optional, defaults to "en")

**Response** (200):
```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "language_code": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

### GET /jobs/:job_id
Get specific job description.

**Response** (200):
```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "language_code": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### POST /jobs
Create new job description.

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "language_code": "string"
}
```

**Response** (200):
```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "language_code": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### PUT /jobs/:job_id
Update job description.

**Request Body**:
```json
{
  "title": "string",
  "description": "string"
}
```

**Response** (200):
```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "language_code": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### DELETE /jobs/:job_id
Delete job description.

**Response** (204): No content

## CV Generation

### POST /generate
Generate and save a new CV from detailed CV and job description.

**Request Body**:
```json
{
  "detailed_cv_id": "integer",
  "job_description_id": "integer",
  "language_code": "string"
}
```

**Response** (200):
```json
{
  "id": "integer",
  "user_id": "integer",
  "detailed_cv_id": "integer",
  "job_description_id": "integer",
  "language_code": "string",
  "content": "object",
  "created_at": "datetime"
}
```

### GET /generations
Get all generated CVs for current user.

**Response** (200):
```json
[
  {
    "id": "integer",
    "user_id": "integer",
    "detailed_cv_id": "integer",
    "job_description_id": "integer",
    "language_code": "string",
    "content": "object",
    "created_at": "datetime"
  }
]
```

### GET /generations/:cv_id
Get specific generated CV.

**Response** (200):
```json
{
  "id": "integer",
  "user_id": "integer",
  "detailed_cv_id": "integer",
  "job_description_id": "integer",
  "language_code": "string",
  "content": "object",
  "created_at": "datetime"
}
```

## Common Responses

### Error Response
**Response** (4xx/5xx):
```json
{
  "detail": "string"
}
```

### Validation Error Response
**Response** (422):
```json
{
  "detail": [
    {
      "loc": ["string"],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

## AI-Based CV Generation

### POST /api/generate-competences
Generate core competences based on CV and job description.

**Request Body**:
```json
{
  "cv_text": "string",
  "job_description": "string",
  "notes": "string | null"
}
```

**Response** (200):
```json
{
  "competences": ["string"]
}
```

### POST /api/generate-cv
Generate a complete CV using AI based on CV text, job description, and approved competences.

**Request Body**:
```json
{
  "cv_text": "string",
  "job_description": "string",
  "personal_info": {
    "full_name": "string",
    "email": {
      "value": "string",
      "type": "string",
      "icon": "string | null",
      "url": "string | null"
    },
    "phone": {
      "value": "string",
      "type": "string",
      "icon": "string | null",
      "url": "string | null"
    } | null,
    "location": {
      "value": "string",
      "type": "string",
      "icon": "string | null",
      "url": "string | null"
    } | null
  },
  "approved_competences": ["string"],
  "notes": "string | null"
}
```

**Response** (200):
```json
{
  "title": {
    "text": "string"
  },
  "summary": {
    "text": "string"
  },
  "experiences": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string | null",
      "description": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string | null",
      "details": "string | null"
    }
  ],
  "skills": [
    {
      "category": "string",
      "skills": ["string"]
    }
  ]
}
```
