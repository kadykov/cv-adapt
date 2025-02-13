# API Conventions

This document outlines the conventions and standards for the CV Adapt API.

## URL Structure

All API endpoints follow this structure:
```
/v1/api/{resource}/{action}
```

### Components

- **Version Prefix** (`/v1`): All endpoints must include a version prefix for future API versioning support
- **API Prefix** (`/api`): Identifies the route as an API endpoint
- **Resource** (`{resource}`): Plural noun representing the resource type (e.g., `users`, `jobs`, `generations`)
- **Action** (optional): Additional actions specific to the resource (e.g., `competences`, `cv`)

## Resource Groups

### Authentication
```
/v1/api/auth
  POST /register        # Register new user
  POST /login          # Login user
  POST /logout         # Logout user
  POST /refresh        # Refresh access token
```

### Users
```
/v1/api/users
  GET /                # List users
  GET /{id}           # Get user details
  PUT /{id}           # Update user
  DELETE /{id}        # Delete user
```

### Jobs
```
/v1/api/jobs
  GET /               # List jobs
  GET /{id}          # Get job details
  POST /             # Create job
  PUT /{id}          # Update job
  DELETE /{id}       # Delete job
```

### CV Generation
```
/v1/api/generations
  GET /              # List generated CVs
  GET /{id}          # Get specific CV
  POST /             # Generate new CV
  POST /competences  # Generate competences
  POST /cv           # Generate complete CV
```

## Response Format

### Success Response
```json
{
  "data": {
    // Resource data
  },
  "meta": {
    // Metadata (pagination, etc.)
  }
}
```

### Error Response
```json
{
  "detail": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "field": "field_name" // Optional, for validation errors
  }
}
```

## Versioning

The API uses URL versioning (e.g., `/v1`) to ensure backward compatibility when making breaking changes. The version number should be incremented for breaking changes following semantic versioning principles.

## Resource Naming

- Use plural nouns for resource names (e.g., `users`, not `user`)
- Use lowercase letters and hyphens for multi-word resources
- Keep resource names concise and descriptive

## Future Extensions

When adding new resources or endpoints:

1. Follow the established URL structure
2. Use consistent versioning
3. Include the `/api` prefix
4. Document the endpoints in the appropriate reference section
5. Follow the standard response format
