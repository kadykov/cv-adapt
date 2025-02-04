# Web Interface Tutorial

This guide covers how to use and develop the web interface for the CV Adapter.

## Architecture

The web interface consists of two parts:
- A FastAPI backend that exposes the CV generation functionality
- An Astro frontend with React components that provides a user interface for the CV generation

## Frontend Framework

We use [Astro](https://astro.build) as our frontend framework with React integration for interactive components. This provides several benefits:

1. Partial Hydration: Only interactive components are sent as JavaScript
2. Static Site Generation (SSG) capabilities
3. Built-in performance optimizations
4. Seamless React component integration

### Styling

We use [Tailwind CSS](https://tailwindcss.com) with [Daisy UI](https://daisyui.com) for styling:

1. Tailwind CSS provides:
   - Utility-first CSS framework
   - Built-in responsive design utilities
   - JIT (Just-In-Time) compilation for optimal CSS bundle size
   - Easy customization through tailwind.config.mjs

2. Daisy UI adds:
   - Pre-built components based on Tailwind
   - Consistent design system
   - Theme support
   - Semantic component classes

### React Components in Astro

React components are used for interactive parts of the application and are marked with client directives:

```astro
---
import App from '../components/App';
---

<App client:load />
```

The `client:load` directive ensures the component is hydrated immediately when the page loads.

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

The frontend uses Vitest with jsdom for testing:

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
import type { GeneratedType } from '../types/api';

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

   # Run frontend tests with coverage
   just test-frontend-cov
   ```

2. Frontend Development:
   ```bash
   cd web-interface/frontend

   # Install dependencies
   npm install

   # Start development server
   npm run dev

   # Run tests
   npm test

   # Build for production
   npm run build

   # Preview production build
   npm run preview

   # Run linter
   npm run lint
   ```

3. Development Servers:
   ```bash
   # Start both frontend and backend
   just serve-web

   # Or start them separately:
   just serve-frontend  # Starts Astro dev server
   just serve-backend   # Starts FastAPI server
   ```

### Frontend Structure

The frontend codebase is organized as follows:

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Astro pages
│   ├── styles/        # Global CSS
│   ├── api/           # API client functions
│   ├── types/         # TypeScript interfaces
│   └── validation/    # Zod schemas
├── tailwind.config.mjs # Tailwind & DaisyUI configuration
└── postcss.config.mjs  # PostCSS configuration for Tailwind
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
6. Use Astro's client directives appropriately for React components
7. Keep non-interactive content as static Astro components

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

### Astro-specific Issues

1. Component Hydration:
   - Ensure interactive components have proper client directives
   - Check browser console for hydration warnings
   - Verify client:load is used when needed

2. Static Content:
   - Use Astro components for static content where possible
   - Minimize unnecessary client-side JavaScript

## Future Improvements

Consider implementing:

1. Mock Service Worker (MSW) for API mocking in tests
2. Continuous Integration checks for type safety
3. API response type guards in React components
4. OpenAPI/Swagger documentation generation
5. Astro middleware for API request handling
6. Server-side rendering (SSR) mode for dynamic content
