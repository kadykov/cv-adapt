# Frontend Testing Guide

## Overview

This guide provides a comprehensive overview of the frontend testing infrastructure for the CV Adapt application.

## Detailed Testing Patterns

For an in-depth exploration of our testing approach, refer to the [Testing Patterns documentation](testing-patterns.md). This document offers:

- Detailed examples of service mocking
- Type-safe testing strategies
- Advanced testing patterns
- Best practices for component and service testing

### Key Highlights from Testing Patterns

1. **Generated Service Mocking**
   - Leverage type-safe mock service factories
   - Use generated data builders
   - Ensure consistent test data

2. **Zod-Validated Mocking**
   - Validate mock data against schemas
   - Ensure type safety and compliance
   - Catch potential data inconsistencies early

3. **Advanced Testing Techniques**
   - Comprehensive async operation testing
   - Accessibility testing utilities
   - Error state and loading state verification

## Path Management in Testing

We use a centralized, type-safe approach to manage API paths, which is crucial for consistent and reliable testing. Refer to our [Path Management documentation](path-management.md) for detailed insights.

### Key Path Management Benefits in Testing

- **Type-Safe Path References**
  ```typescript
  import { getApiPath } from '../api/api-paths';

  describe('Auth Component', () => {
    it('handles login', async () => {
      const loginPath = getApiPath('auth', 'login');
      simulateSuccess(loginPath, 'post', mockData);
    });
  });
  ```

- **Consistent API Interaction**
  - Validate paths against OpenAPI schema
  - Ensure runtime and compile-time type safety
  - Simplify test setup and mocking

## Testing Infrastructure

### Key Technologies
- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **API Mocking**: Mock Service Worker (MSW)
- **Type Generation**: OpenAPI TypeScript, Zod (auto-generated before tests)
- **Service Classes**: Generated from OpenAPI schema
- **Path Management**: Centralized, type-safe path references
- **Pretest Automation**: Generated types and MSW handlers

### Test Setup Automation
Our testing infrastructure automatically generates necessary files before test execution:

```bash
# Runs automatically via pretest hook
npm test

# Manual generation if needed
npm run generate:all
```

The generation process ensures:
1. Up-to-date API types from OpenAPI schema
2. Type-safe MSW handlers for API mocking
3. Consistent test data structures

## Recommended Resources

- [Detailed Testing Patterns](testing-patterns.md)
- [Path Management Documentation](path-management.md)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/)
- [Zod Validation](https://zod.dev/)
