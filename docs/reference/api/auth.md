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

## Logging and Debugging

The authentication system includes detailed logging to help diagnose issues:

### Log Configuration

- Log level can be configured via the `LOG_LEVEL` environment variable (defaults to "INFO")
- Authentication-specific logger is set to DEBUG level for maximum visibility
- Log format includes timestamps, log levels, file locations, and detailed messages:
  ```
  2025-02-06 22:30:15 | DEBUG | auth/main.py:42 | Registration attempt for email: user@example.com
  ```

### Authentication Logs

The following events are logged during authentication:

#### Registration
- DEBUG: Initial registration attempts with email address
- WARNING: Failed registrations (e.g., email already exists)
- ERROR: Unexpected registration errors with stack traces
- INFO: Successful registrations

Example registration logs:
```
DEBUG | Registration attempt for email: user@example.com
WARNING | Registration failed - email already exists: user@example.com
INFO | User registered successfully: user@example.com
ERROR | Registration failed for user@example.com: [error details with stack trace]
```

#### Login
- DEBUG: Login attempts with username
- WARNING: Failed login attempts due to invalid credentials
- ERROR: Unexpected login errors with stack traces
- INFO: Successful logins
- DEBUG: Token creation events

Example login logs:
```
DEBUG | Login attempt for username: user@example.com
WARNING | Login failed - invalid credentials for: user@example.com
DEBUG | Creating tokens for user: user@example.com
INFO | User logged in successfully: user@example.com
```

### Troubleshooting

Common HTTP status codes and their corresponding log entries:

- 400 Bad Request
  - Check WARNING level logs for validation failures (e.g., email already exists)
  - Review DEBUG logs for the full request context
- 401 Unauthorized
  - Check WARNING logs for invalid credential attempts
  - Review DEBUG logs for token validation issues
- 500 Internal Server Error
  - Check ERROR logs for detailed stack traces and error messages

To enable detailed debugging, set `LOG_LEVEL=DEBUG` in your environment.
