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

Example handler generation:
```typescript
const generateAuthResponse = (): JsonObject => ({
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'user@example.com',
    created_at: new Date().toISOString(),
    personal_info: null
  }
})
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
