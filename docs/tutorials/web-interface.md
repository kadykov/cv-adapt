# Web Interface Tutorial

This guide covers how to use and develop the web interface for the CV Adapter.

## Architecture

The web interface consists of two parts:
- A FastAPI backend that exposes the CV generation functionality
- A React frontend that provides a user interface for the CV generation

## Type Safety and API Integration

### Type Generation

We use TypeScript in the frontend and maintain type safety between frontend and backend through generated types:

```bash
# Generate TypeScript types from backend models
python web-interface/backend/scripts/generate_typescript_types.py
```

This script generates TypeScript interfaces from our Pydantic models, ensuring type consistency between frontend and backend.

### Runtime Validation

We use Zod for runtime validation of API requests and responses:

```typescript
// Example of validating API response
const response = await fetch('/api/generate-cv');
const data = await response.json();
const validatedData = validateCV(data); // Throws if data is invalid
```

The validation schemas are defined in `web-interface/frontend/src/validation/api.validation.ts`.

### API Client

Type-safe API functions are provided in `web-interface/frontend/src/api/cv.ts`:

```typescript
// Example usage
const competences = await generateCompetences({
  cv_text: "My CV content",
  job_description: "Job requirements"
});
```

## Testing

### Frontend Tests

1. Type Validation Tests:
   - Located in `web-interface/frontend/src/validation/api.validation.test.ts`
   - Test both valid and invalid data scenarios
   - Ensure runtime type safety

2. API Integration Tests:
   - Located in `web-interface/frontend/src/tests/api.test.ts`
   - Test TypeScript interface compliance
   - Verify type definitions match actual use

### Backend Tests

Integration tests for the API endpoints are located in `web-interface/backend/tests/integration/test_cv_generation.py`.

## Development

### Setting Up the Development Environment

1. Install frontend dependencies:
   ```bash
   cd web-interface/frontend
   npm install
   ```

2. Start the frontend development server:
   ```bash
   npm start
   ```

3. Start the backend server:
   ```bash
   cd web-interface/backend
   uvicorn app.main:app --reload
   ```

### Making Changes

When making changes to the API:

1. Update the Pydantic models in the backend
2. Regenerate TypeScript types
3. Update validation schemas if needed
4. Update tests to cover new functionality
5. Run the test suite to ensure type safety

### Best Practices

1. Always use the generated TypeScript types for API interactions
2. Add runtime validation for all API calls
3. Write tests for new API endpoints and data structures
4. Keep backend models and frontend types in sync
5. Use the provided API client functions instead of direct fetch calls

## Common Issues

### Type Mismatch Errors

If you encounter type mismatch errors:

1. Check that TypeScript types are up to date:
   ```bash
   python web-interface/backend/scripts/generate_typescript_types.py
   ```

2. Verify runtime validation with Zod schemas
3. Run the validation tests to catch potential issues

### API Integration Issues

When facing API integration issues:

1. Verify that the response matches the expected TypeScript interface
2. Check runtime validation errors
3. Review the API client functions for correct typing
4. Run the test suite to catch type mismatches

## Future Improvements

Consider implementing:

1. Mock Service Worker (MSW) for API mocking in tests
2. Continuous Integration checks for type safety
3. API response type guards in React components
4. OpenAPI/Swagger documentation generation
