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
just generate-types
```

This command generates TypeScript interfaces from our Pydantic models, ensuring type consistency between frontend and backend.

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

3. Component Tests:
   - Located in `web-interface/frontend/src/components/__tests__/`
   - Test proper rendering of data with varying completeness
   - Verify handling of optional fields
   - Test component functionality (modals, downloads, etc.)
   - Test accessibility and user interactions

### Preventing Runtime Issues

To avoid runtime errors and ensure robust component behavior:

1. Type Safety:
   - Use generated TypeScript types from backend models
   - Add type guards for optional fields
   - Use proper TypeScript interfaces for component props
   - Avoid using `any` type

2. Component Testing:
   - Test with both minimal and complete data sets
   - Verify rendering of optional fields
   - Test edge cases like duplicate content
   - Use proper DOM testing patterns with @testing-library/react
   - Test error boundaries and error handling

3. Testing Best Practices:
   - Use semantic queries (getByRole, getByLabelText)
   - Test user interactions with fireEvent
   - Verify accessibility patterns
   - Mock external dependencies (URLs, file downloads)
   - Use proper cleanup in tests

Example Component Test:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import YourComponent from './YourComponent';
import { GeneratedType } from '../types/api';

describe('YourComponent', () => {
  it('should handle optional fields correctly', () => {
    const minimalData: GeneratedType = {
      required_field: 'value',
      // ... minimal required fields
    };

    render(<YourComponent data={minimalData} />);

    // Test required fields
    expect(screen.getByText('value')).toBeInTheDocument();

    // Test optional fields aren't rendered
    expect(screen.queryByText('optional')).not.toBeInTheDocument();
  });

  it('should render all fields when provided', () => {
    const fullData: GeneratedType = {
      required_field: 'value',
      optional_field: 'optional',
      // ... all possible fields
    };

    render(<YourComponent data={fullData} />);

    // Test all fields are rendered
    expect(screen.getByText('value')).toBeInTheDocument();
    expect(screen.getByText('optional')).toBeInTheDocument();
  });
});
```

### Backend Tests

Integration tests for the API endpoints are located in `web-interface/backend/tests/integration/test_cv_generation.py`.

## Development

### Development Commands

We use `just` for common development tasks. Here are the key commands:

1. Type Generation and Testing:
   ```bash
   # Generate TypeScript types from Pydantic models
   just generate-types

   # Run backend tests
   just test-backend

   # Run frontend tests
   just test-frontend
   ```

2. Development Servers:
   ```bash
   # Start both frontend and backend
   just serve-web

   # Or start them separately:
   just serve-frontend  # Starts React dev server
   just serve-backend   # Starts FastAPI server
   ```

### Setting Up the Development Environment

1. Install all dependencies:
   ```bash
   just install
   ```

2. Start the development servers:
   ```bash
   just serve-web
   ```

### Making Changes

When making changes to the API:

1. Update the Pydantic models in the backend
2. Regenerate TypeScript types with `just generate-types`
3. Update validation schemas if needed
4. Update tests to cover new functionality
5. Run the test suites to ensure type safety:
   ```bash
   just test-backend  # Run backend tests
   just test-frontend # Run frontend tests
   ```

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
   just generate-types
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
