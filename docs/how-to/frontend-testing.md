# Frontend Testing

This guide explains the different types of tests in the frontend and how to run them.

## Types of Tests

### 1. Unit Tests

Unit tests verify individual components and functions in isolation. These tests use Vitest and React Testing Library.

```bash
just test-frontend
```

### 2. Integration Tests

Integration tests verify how multiple components work together. These tests use MSW (Mock Service Worker) to mock API calls.

```bash
just test-frontend-integration
```

### 3. Contract Tests

Contract tests ensure that our frontend's API expectations match the backend's OpenAPI specification. These tests:
- Validate that mock responses match the OpenAPI schema
- Catch breaking changes in API contracts early
- Ensure consistency between frontend and backend

```bash
just test-frontend-contract
```

## Test Files Organization

```
web-interface/frontend/src/tests/
├── unit/               # Unit tests for components
├── integration/        # Integration tests
├── contract.test.ts   # Contract tests
└── mocks/             # Mock handlers and server setup
    ├── server.ts
    ├── handlers.ts
    └── generate-handlers.ts
```

## Mock Service Worker (MSW)

We use MSW to intercept and mock API requests in tests. MSW handlers are generated from the OpenAPI specification to ensure consistency.

### Handler Generation

Handlers are automatically generated from the OpenAPI schema:

1. Export the latest OpenAPI schema:
   ```bash
   just export-openapi  # Exports schema from backend to frontend
   ```

2. `generate-handlers.ts` reads the OpenAPI schema
3. Creates type-safe mock responses
4. Ensures responses match API contract

Example handler generation using Zod schemas:
```typescript
import { authResponseSchema } from '../validation/openapi';

// Generate mock responses that match our Zod schemas
const generateAuthResponse = (): AuthResponse => ({
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'user@example.com',
    created_at: new Date().toISOString(),
    personal_info: null
  }
});

// Validate mock response matches schema
const mockResponse = generateAuthResponse();
authResponseSchema.parse(mockResponse); // Will throw if invalid
```

Example auth component test:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../features/auth/components/LoginForm';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('LoginForm', () => {
  it('handles successful login', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify redirect after successful login
    await waitFor(() => {
      expect(window.location.pathname).toBe('/jobs');
    });
  });

  it('displays validation errors', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('handles server errors', async () => {
    // Mock API to return error
    server.use(
      rest.post('/api/v1/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            detail: {
              message: "Invalid email or password"
            }
          })
        );
      })
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong_password' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });
});
```

## Running Tests

### All Frontend Tests

To run all frontend tests (unit, integration, and contract):

```bash
just test-frontend-all
```

### With Coverage

To run tests with coverage reporting:

```bash
just test-frontend-cov
```

### Watch Mode

During development, you can run tests in watch mode:

```bash
cd web-interface/frontend
npm run test:watch        # Unit tests
npm run test:integration  # Integration tests
npm run test:contract    # Contract tests
```

## Best Practices

1. **Contract Testing**
   - Always update contract tests when making API-related changes
   - Use generated handlers from OpenAPI spec
   - Keep mock responses in sync with schema

2. **Integration Testing**
   - Use MSW for API mocking
   - Test complete user workflows
   - Verify error handling

3. **Unit Testing**
   - Test component rendering
   - Verify user interactions
   - Mock dependencies appropriately

## Debugging Tests

- Use `console.error()` for debugging (automatically shown in test output)
- Run individual test files for focused debugging:
  ```bash
  cd web-interface/frontend
  npm run test src/tests/contract.test.ts
  ```
- Use watch mode for faster development cycles
- Enable verbose logging in vitest with the `--debug` flag:
  ```bash
  npm run test:contract -- --debug
  ```

## Adding New Tests

1. **Contract Tests**
   - Add test cases in `contract.test.ts`
   - Update mock handlers if needed
   - Verify against OpenAPI schema

2. **Integration Tests**
   - Create new test file in integration/
   - Use MSW for API mocking
   - Test complete features

3. **Unit Tests**
   - Create test file next to component
   - Focus on component behavior
   - Mock external dependencies
