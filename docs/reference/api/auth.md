# Authentication API

The CV-Adapt project uses JWT-based authentication to secure API endpoints. This document outlines the authentication endpoints and their usage.

## Endpoints

### Register

```http
POST /auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "userpassword" // pragma: allowlist secret
}

Response 200 OK:
{
    "access_token": "eyJ0...",
    "refresh_token": "eyJ1...",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "personal_info": null,
        "created_at": "2025-02-05T13:00:00"
    }
}

Response 400 Bad Request:
{
    "detail": "Email already registered"
}
```

### Login

```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=userpassword

Response 200 OK:
{
    "access_token": "eyJ0...",
    "refresh_token": "eyJ1...",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "personal_info": null,
        "created_at": "2025-02-05T13:00:00"
    }
}

Response 401 Unauthorized:
{
    "detail": "Incorrect email or password"
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
    "token": "eyJ1..." // refresh token
}

Response 200 OK:
{
    "access_token": "eyJ0...",
    "refresh_token": "eyJ1...",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "personal_info": null,
        "created_at": "2025-02-05T13:00:00"
    }
}

Response 401 Unauthorized:
{
    "detail": "Invalid refresh token"
}
```

## Authentication Flow

1. User registers or logs in, receiving an access token and refresh token
2. Access token is included in Authorization header for protected endpoints:
   ```http
   GET /api/protected-endpoint
   Authorization: Bearer eyJ0...
   ```
3. When access token expires, use refresh token to get new tokens
4. If refresh token expires, user must log in again

## Token Details

- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Tokens use HS256 algorithm for signing
- Token payload includes:
  - `sub`: User ID
  - `exp`: Expiration timestamp
  - `type`: Token type ("access" or "refresh")

## Protected Routes

Protected routes require a valid access token in the Authorization header. If the token is missing or invalid, the API returns a 401 Unauthorized response.

Example protected route:
```http
GET /api/generate-cv
Authorization: Bearer eyJ0...

Response 401 Unauthorized:
{
    "detail": "Could not validate credentials"
}
```

## Implementation Details

- Authentication uses FastAPI's security utilities and OAuth2 password flow
- Passwords are hashed using bcrypt
- Environment variables control token secrets and expiration times
- CORS is configured to handle credentials properly
- Token verification checks both token validity and type
