# Testing Strategy

## Overview

Our testing approach follows a comprehensive strategy that ensures code quality, reliability, and maintainability through multiple testing layers.

## Testing Pyramid

```mermaid
flowchart TD
    A[Integration Tests] --> B[Unit Tests]

    style A fill:#e8f5e9
    style B fill:#fff3e0
```

## Type Safety & API Contract

We ensure API contract compliance through:

- Generated TypeScript types from OpenAPI schema
- Automatic type generation in CI/CD pipeline
- Type checking during development and builds
- Integration tests using typed API responses
- MSW handlers conforming to API types

## Test Types

### Integration Tests

#### Navigation Testing Infrastructure

We use a dedicated navigation testing infrastructure to handle routing and navigation testing consistently.

#### Route Configuration Best Practices

1. Route Order

   - Place static routes before dynamic routes to prevent path conflicts
   - Example order:
     ```typescript
     const routes = [
       createRouteConfig('jobs', <JobListPage />),      // Static route first
       createRouteConfig('jobs/new', <CreateJobPage />), // Then specific static routes
       createRouteConfig('jobs/:id', <DetailPage />),    // Dynamic routes last
     ]
     ```

2. History Management
   - Keep initial entries minimal and focused on the tested route
   - Use the correct initial index to ensure proper back/forward navigation
   - Example:
     ```typescript
     const { user } = await setupFeatureTest({
       routes,
       initialPath: ROUTES.JOBS.CREATE,
       history: {
         entries: ['/jobs/new'], // Minimal entry list
         index: 0, // Correct initial position
       },
     });
     ```

#### Navigation Verification Strategies

1. Element-Based Verification

   - Prefer checking for distinctive UI elements over pathname checks
   - Use role-based queries when possible
   - Example:
     ```typescript
     // More reliable than checking pathname
     await waitFor(() => {
       const addButton = screen.getByRole('link', { name: /add job/i });
       expect(addButton).toBeInTheDocument();
       expect(addButton.getAttribute('href')).toBe('/jobs/new');
     });
     ```

2. Loading State Handling
   - Wait for loading states to complete before verifying navigation
   - Check for both presence and absence of loading indicators
   - Example:
     ```typescript
     await waitFor(() => {
       expect(screen.queryByRole('status')).not.toBeInTheDocument();
     });
     ```

#### Basic Navigation Example

```typescript
// Example: Navigation verification
await NavigationTestUtils.verifyNavigation({
  pathname: ROUTES.DETAILED_CVS.CREATE('en'),
  waitForElement: {
    role: 'form',
  },
  waitForLoading: true,
});

// Example: Route setup
const routes = [
  createRouteConfig('/', <Layout />, [
    createRouteConfig('feature', <ProtectedRoute />, [
      createRouteConfig('', <ListPage />),
      createRouteConfig(':id', <DetailPage />),
    ]),
  ]),
];
```

#### Navigation Test Organization

We organize navigation tests into three categories:

1. Route Tests

   - Focus on route protection and access control
   - Test authentication requirements
   - Verify redirects and fallbacks

2. List Navigation Tests

   - Test navigation from list views
   - Verify create/detail navigation flows
   - Test list-specific operations

3. Form Operation Tests
   - Test form submission navigation
   - Verify success/error redirects
   - Test edit/create flow differences

#### Infrastructure

- Schema-based handler generation
- Integration-specific test server
- OpenAPI contract validation
- Standard response patterns
- React Query integration
- Proper async operation handling
- Mutation state management

#### Focus Areas

- Complete user flows
- Feature interactions
- State management
- API contract compliance
- Real-world scenarios
- Loading states
- Error handling

#### Directory Structure

```
features/
  auth/
    __tests__/
      integration/
        protected-routes.integration.test.tsx    # Route protection
        auth-flow.integration.test.tsx          # Authentication flows
  detailed-cv/
    __tests__/
      integration/
        protected-route.integration.test.tsx    # Route protection
        detailed-cv-list.integration.test.tsx   # List navigation
        detailed-cv-form.integration.test.tsx   # Form operations
  routes/
    __tests__/
      integration/
        common-routes.integration.test.tsx      # Shared route behavior
```

### Unit Tests

#### Component Testing

- Loading state verification
- Error state handling
- Form validation
- User interaction flows
- Accessibility checks
- Component isolation
- Role-based queries

#### Hook Testing

- Mock providers (Auth, Query)
- Mock localStorage
- Mock API responses
- React Query integration
- Mutation state management
- Cache behavior

#### React Query Testing Patterns

```typescript
// 1. Create a mock module function
const mockUseMutation = vi.fn();

// 2. Mock the module
vi.mock('./hooks/useMutation', () => ({
  useMutation: () => mockUseMutation(),
}));

// 3. Create type-safe mock data
const createMockMutation = (mutateAsync = vi.fn().mockResolvedValue({})) => ({
  mutateAsync,
  mutate: vi.fn(),
  variables: undefined,
  data: undefined,
  error: null,
  isError: false as const,
  isPending: false as const,
  isSuccess: false as const,
  isIdle: true as const,
  status: 'idle' as const,
  reset: vi.fn(),
  context: undefined,
  isPaused: false,
  submittedAt: 0,
});

// 4. Use in tests
beforeEach(() => {
  mockUseMutation.mockReturnValue(createMockMutation());
});

// 5. Override for specific tests
const mockSpecificMutation = vi.fn().mockResolvedValue({ id: 1 });
mockUseMutation.mockReturnValue(createMockMutation(mockSpecificMutation));
```

Key benefits:

- Type-safe mutation mocks
- Consistent state flags
- Reusable mock creation
- Easy per-test overrides
- Complete type coverage
- Centralized mock patterns

#### Best Practices

- Provider isolation
- Mock consistency
- Type safety
- Error boundary testing
- Async operation handling

## Testing Infrastructure

### MSW (Mock Service Worker)

- Centralized handler setup
- Request/response mocking
- Error scenario simulation
- Network behavior simulation
- Contract validation

#### Error Handling Best Practices

1. Using Handler Error Options

   ```typescript
   // Prefer using built-in error options in handlers
   createPutHandler('/api/resource/:id', 'RequestType', 'ResponseType', data, {
     validateRequest: () => false, // Force validation failure
     errorResponse: {
       status: 500,
       message: 'Server error message',
     },
   });
   ```

2. Form Error Handling

   ```typescript
   try {
     await mutation.mutateAsync(data);
   } catch (error) {
     // Extract server error message if available
     const errorMessage =
       error instanceof Error ? error.message : 'Default error message';

     setError('root', {
       type: 'custom',
       message: errorMessage,
     });
   }
   ```

3. Error Verification
   ```typescript
   // Verify error messages in tests
   await waitFor(() => {
     const errorMessage = screen.getByRole('alert');
     expect(errorMessage).toHaveTextContent(/expected error/i);
   });
   ```

### Navigation Testing Utilities

```typescript
// Navigation verification
await NavigationTestUtils.verifyNavigation({
  pathname: expectedPath,
  waitForElement: {
    role: 'form',
    name: /title/i,
  },
  waitForLoading: true,
});

// Action-triggered navigation
await NavigationTestUtils.verifyActionNavigation(
  async () => {
    await user.click(submitButton);
  },
  {
    pathname: '/success',
    waitForElement: {
      role: 'alert',
      name: /success/i,
    },
  },
);

// Navigation result verification
await NavigationTestUtils.verifyNavigationResult({
  waitForElement: {
    role: 'button',
    name: /new item/i,
  },
  shouldMount: true,
});
```

### Feature Test Setup

```typescript
const { user } = await setupFeatureTest({
  routes,
  initialPath: ROUTES.FEATURE.LIST,
  authenticatedUser: true,
  handlers: [createGetHandler('/api/items', 'ItemResponse', mockData)],
});
```

### Integration Test Utils

We've refactored our integration tests to use a new set of test utilities that provide a more consistent and maintainable approach to testing. These utilities are located in `src/lib/test/integration/` and include:

#### Setup Navigation

The `setupFeatureTest` function provides a standardized way to set up integration tests with routing and navigation:

```typescript
const { user } = await setupFeatureTest({
  routes, // Route configuration using createRouteConfig
  initialPath: '/auth', // Initial path to navigate to
  authenticatedUser: false, // Whether to set up an authenticated user
  handlers: [
    // MSW handlers for API mocking
    createGetHandler('users/me', 'UserResponse', mockUser),
  ],
});
```

#### Route Configuration

The `createRouteConfig` function provides a type-safe way to define routes for testing:

```typescript
const routes = [
  createRouteConfig('/', <Layout />, [
    createRouteConfig('', <HomePage />),
    createRouteConfig('auth', <Auth />),
  ]),
];
```

#### Handler Generators

The handler generators provide a type-safe way to create MSW handlers for API mocking:

```typescript
// GET handler
createGetHandler('users/me', 'UserResponse', mockUser);

// POST handler with form data
createFormPostHandler(
  'auth/login',
  'Body_login_v1_api_auth_login_post',
  'AuthResponse',
  mockTokens,
  {
    validateRequest: (formData) => {
      const username = formData.get('username');
      const password = formData.get('password');
      return username === 'test@example.com' && password === 'password123';
    },
  },
);

// POST handler with JSON data
createPostHandler(
  'auth/refresh',
  'Body_refresh_token_v1_api_auth_refresh_post',
  'AuthResponse',
  refreshedTokens,
  {
    validateRequest: (body) => {
      return body.token === initialTokens.refresh_token;
    },
  },
);

// Empty response handler
createEmptyResponseHandler('post', 'auth/logout', { status: 204 });
```

#### Test Wrapper

The `IntegrationTestWrapper` component provides a standardized way to wrap components for testing:

```typescript
render(
  <IntegrationTestWrapper queryClient={queryClient}>
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  </IntegrationTestWrapper>
);
```

#### Benefits of the New Test Utils

- **Consistency**: All tests use the same setup and configuration
- **Type Safety**: All handlers and routes are type-safe
- **Maintainability**: Changes to the testing infrastructure only need to be made in one place
- **Readability**: Tests are more concise and easier to understand
- **Reusability**: Common patterns are extracted into reusable functions
- **Reliability**: Tests are more reliable and less prone to flakiness

### Development Guidelines

#### Testing Requirements

1. Integration Tests (Feature Level)

   - Route protection tests
   - List navigation tests
   - Form operation tests
   - Error handling scenarios
   - Loading state verification

2. Unit Tests (Component Level)

   - Component isolation
   - Prop validation
   - Event handling
   - State changes
   - Side effects

3. Contract Tests (API Level)
   - Type safety
   - Schema validation
   - Error responses
   - Success patterns

### Best Practices

1. Test Organization

   - Co-locate tests with implementation
   - Group by test category (route/list/form)
   - Maintain test independence
   - Use proper file naming

2. Testing Standards

   - Use navigation testing utilities
   - Follow route testing patterns
   - Use handler generators
   - Share route configs
   - Test loading states
   - Verify error scenarios
   - Follow naming conventions

3. Coverage Requirements

   - Minimum 80% code coverage
   - Critical paths: 100%
   - Error scenarios
   - Edge cases

4. Performance Testing
   - Loading performance
   - React Query caching
   - Component re-renders
   - Network request optimization

## Test Configuration

### Vitest Workspace

We use Vitest workspaces to organize our tests into separate projects with specific configurations:

```typescript
// vitest.workspace.ts
export default defineWorkspace([
  {
    // Unit tests configuration
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/lib/test/setup.ts'],
      include: ['src/**/__tests__/*.{test,spec}.{js,jsx,ts,tsx}'],
      exclude: ['src/**/__tests__/integration/**'],
    },
  },
  {
    // Integration tests configuration
    extends: './vitest.config.ts',
    test: {
      name: 'integration',
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/lib/test/integration/setup.ts'],
      include: ['src/**/__tests__/integration/*.integration.test.{ts,tsx}'],
      testTimeout: 15000,
      hookTimeout: 15000,
      maxConcurrency: 1,
      isolate: true,
      sequence: {
        shuffle: false,
      },
      deps: {
        optimizer: {
          web: {
            include: ['@testing-library/*'],
          },
        },
      },
    },
  },
]);
```

Key features of the workspace configuration:

- Separate configurations for unit and integration tests
- Extended timeout for integration tests to handle async operations
- Single test concurrency for integration tests to prevent race conditions
- Disabled test shuffling for more predictable test runs
- Proper environment and setup file configuration for each test type
- Shared coverage configuration through base vitest.config.ts

## Test Scripts

```json
{
  "test": "vitest",
  "test:unit": "vitest --project unit",
  "test:integration": "vitest --project integration",
  "test:coverage": "vitest run --coverage",
  "test:ci": "vitest run --coverage",
  "pretest": "npm run generate-api-types"
}
```

## Tools and Libraries

- Vitest - Test runner
- React Testing Library - Component testing
- MSW - API mocking
- @testing-library/user-event - User interaction simulation
- @testing-library/jest-dom - DOM assertions

## Continuous Integration

- Run all tests on PR
- Coverage reporting
- Contract validation
- Type checking
- Linting verification
