# Frontend Implementation Plan

## Phase 1: Project Setup and Infrastructure

### Clean Slate Setup

- [x] Clear existing frontend implementation
- [x] Initialize new Vite + React + TypeScript project
- [x] Configure ESLint with TypeScript
- [x] Set up Prettier
- [x] Configure Tailwind CSS and DaisyUI
- [x] Set up path aliases

### Core Dependencies

- [x] Install and configure key packages:

  ```bash
  # Core
  @tanstack/react-query
  @headlessui/react

  # Forms and Validation
  zod
  zod-form-data
  react-hook-form
  @hookform/resolvers

  # Routing
  react-router-dom

  # Utilities
  date-fns
  clsx

  # Error Handling
  @sentry/react

  # Testing
  vitest
  @testing-library/react
  @testing-library/user-event
  msw
  ```

### OpenAPI Integration

- [x] Set up OpenAPI schema generation script
- [x] Configure type generation with openapi-typescript
- [x] Create base API client configuration
- [x] Implement API error handling utilities
- [x] Set up React Query defaults
- [x] Type System Cleanup
  - [x] Remove manual type definitions
  - [x] Update imports to use generated types
  - [x] Add type generation to pretest script
  - [x] Update documentation for type generation workflow

### Testing Infrastructure

- [x] Configure Vitest with React Testing Library
- [x] Set up MSW for API mocking
- [x] Create test utilities and fixtures
- [x] Configure contract testing
- [x] Centralize test server and handlers
  - [x] Create unified MSW server setup
  - [x] Standardize API paths (/v1/api)
  - [x] Centralize mock data
  - [x] Implement request debugging

### Testing Strategy

#### Unit Tests

- Hook tests with test-utils
  - Mock providers (Auth, Query)
  - Mock localStorage
  - Mock API responses
  - Mock data consistency
- Component tests
  - Role-based queries
  - Accessibility checks
  - Loading states verification
  - Error state handling
- Utility function tests

#### Integration Tests

- Feature-level tests with MSW
  - Standardized API paths (/v1/api)
  - Centralized handlers
  - Language-aware testing
  - Mock data consistency
- User flow tests
  - Language switching
  - Error handling
  - Loading states
- API interaction tests
  - Success cases
  - Error handling
  - Token management

#### Contract Tests

- OpenAPI schema validation
- Response type checking
- Error handling tests
- API path consistency

### Best Practices

- [x] Use centralized MSW handlers
- [x] Maintain consistent API paths
- [x] Share mock data between tests
- [x] Test component accessibility
- [x] Verify loading states
- [x] Test error scenarios
- [x] Implement request debugging

## Phase 2: Authentication Implementation

### Authentication System Improvements

#### Current Issues

- Inconsistency between login and register components
- Token management and refresh flow issues
- Proxy configuration concerns
- Need for better integration testing

#### Implementation Plan

1. **Standardize Auth Components** (Phase 1)

```typescript
// Create useLoginMutation hook
features/auth/hooks/useLoginMutation.ts
- Mirror useRegisterMutation pattern
- Handle loading/error states
- Use React Query mutation
- Proper error typing

// Update LoginForm component
features/auth/components/LoginForm.tsx
- Replace direct context usage with mutation
- Add proper loading states
- Implement error display
- Match RegisterForm patterns
```

2. **Token Management System** (Phase 2)

```typescript
// Create token management service
features/auth/services/token-service.ts
- Token storage/retrieval
- Token validation
- Token refresh logic
- Expiration handling

// Add axios interceptors
lib/api/axios-config.ts
- Request interceptor for token injection
- Response interceptor for 401 handling
- Automatic token refresh
- Request queue during refresh

// Update AuthProvider
features/auth/components/AuthProvider.tsx
- Integrate token service
- Add refresh token logic
- Proper initial auth check
- Clear error handling
```

3. **Auth API Layer** (Phase 3)

```typescript
// Create auth API service
lib/api/auth-service.ts
- Login endpoints
- Register endpoints
- Token refresh endpoint
- Profile fetch endpoint

// Add request/response logging
lib/api/logging.ts
- Development mode logging
- Request/response interceptors
- Error tracking
```

4. **Integration Tests** (Phase 4)

```typescript
// Auth flow tests
features/auth/tests/auth-flow.test.tsx
- Registration → Login flow
- Token storage/retrieval
- Protected route access
- 401 handling and recovery

// MSW handlers
features/auth/testing/handlers.ts
- Auth endpoint mocks
- Error scenarios
- Token validation

// Contract tests
tests/contract/auth-api.test.ts
- OpenAPI schema validation
- Response type checking
```

5. **Protected Route Enhancement** (Phase 5)

```typescript
// Create authenticated fetch hook
features/auth/hooks/useAuthenticatedFetch.ts
- Automatic token handling
- Error state management
- Loading state handling

// Update ProtectedRoute
routes/ProtectedRoute.tsx
- Better loading states
- Error handling
- Redirect logic
```

6. **Development Tools** (Phase 6)

```typescript
// Add debug utilities
features/auth/utils/debug.ts
- Token state logging
- Request tracking
- Error logging

// Add development components
features/auth/components/debug/
- AuthStateViewer
- TokenInspector
- RequestLogger
```

### Directory Structure

```
src/
  features/
    auth/
      components/     # Auth-related components
        LoginForm.tsx
        RegisterForm.tsx
        __tests__/   # Component tests
      hooks/         # Auth-specific hooks
        useAuth.ts
        useRegisterMutation.ts
        useProfile.ts
        useRefreshToken.ts
        __tests__/   # Hook tests
      testing/       # Test utilities and mocks
        fixtures.ts  # Mock data
        mocks.tsx    # Mock components
        setup.ts     # Test setup utilities
      auth-context.tsx
      auth-types.ts
  lib/           # Shared utilities
    api/         # API client and types
    hooks/       # Shared hooks
    utils/       # Helper functions
    test/        # Test utilities
  config/        # App configuration
```

### Authentication Features

- [x] Implement auth context with token management
- [x] Create auth hooks
  - [x] useRegisterMutation - handles user registration with error handling
  - [x] useProfile - fetches authenticated user profile
  - [x] useRefreshToken - manages token refresh
  - [x] useTokenRefresh - automatic token refresh on interval
- [x] Set up comprehensive testing
  - [x] MSW handlers for auth endpoints
  - [x] Mock localStorage for token management
  - [x] Test success and error cases
  - [x] Test authenticated requests
- [x] Set up protected routes
  - [x] Route protection component
  - [x] Authentication state management with React Query
  - [x] Loading states and error handling
  - [x] Redirect handling with path preservation
  - [x] Comprehensive test coverage
- [x] Implement auth forms
  - [x] Login form
    - [x] Form validation with Zod
    - [x] Error handling and display
    - [x] Loading states
    - [x] Success redirection
    - [x] Test coverage
  - [x] Registration form
    - [x] Password complexity validation
    - [x] API integration with mutations
    - [x] Loading and error states
    - [x] Test coverage
  - [x] Auth dialog
    - [x] Form switching
    - [x] Modal handling
    - [x] Accessibility features
    - [x] Test coverage
  - [ ] Password reset flow
    - [ ] Request reset form
    - [ ] Reset token handling
    - [ ] New password form

## Phase 3: Feature Implementation

### Language System Improvements

- [x] Centralize frontend language handling
  - [x] Create language types and configs
  - [x] Implement language utilities
  - [x] Update form validations to use centralized system
- [x] Improve type safety
  - [x] Add proper enum-based validation
  - [x] Align with backend language codes
  - [x] Update affected components

### Job Catalog Feature

#### Completed Data Layer

- [x] API Types and Functions

  ```typescript
  // types.ts
  JobDescriptionCreate;
  JobDescriptionUpdate;
  JobDescriptionResponse;
  ```

- [x] API Implementation

  ```typescript
  // jobsApi.ts
  getJobs(languageCode?: string)
  getJob(id: number)
  createJob(data: JobDescriptionCreate)
  updateJob(id: number, data: JobDescriptionUpdate)
  deleteJob(id: number)
  ```

- [x] React Query Hooks

  ```typescript
  // hooks/
  useJobs.ts         - List jobs with language filtering
  useJob.ts          - Single job fetching
  useJobMutations.ts - CRUD operations with cache management
  ```

- [x] Comprehensive Tests
  ```typescript
  // __tests__/
  jobsApi.test.ts    - API function tests with MSW
  jobHooks.test.tsx  - Hook tests with React Query
  ```

#### UI Components

```
features/job-catalog/
  components/
    JobList.tsx      # ✓ Grid layout with job cards and language filtering
    JobCard.tsx      # ✓ Individual job display component
    JobDetail.tsx    # ✓ Full job information display
    JobForm.tsx      # Create/Edit form with validation
  __tests__/
    JobCard.test.tsx    # ✓ Component unit tests
    JobList.test.tsx    # ✓ Integration tests with MSW
    JobDetail.test.tsx  # ✓ Full test coverage for detail view
```

Components Implemented:

- [x] JobCard

  - [x] Responsive card design with DaisyUI
  - [x] Accessibility features (keyboard navigation, ARIA roles)
  - [x] Language badge display
  - [x] Timestamp formatting
  - [x] Unit tests

- [x] JobList

  - [x] Grid layout with responsiveness
  - [x] Language filtering with Headless UI
  - [x] Loading states
  - [x] Error handling
  - [x] Empty state
  - [x] Integration tests with MSW
  - [x] React Query integration

- [x] JobDetail

  - [x] Full information display
  - [x] Edit/Delete actions
  - [x] Loading states and skeleton UI
  - [x] Error handling with alerts
  - [x] Navigation integration
  - [x] Comprehensive test coverage
    - [x] Loading states
    - [x] Error states
    - [x] Success states
    - [x] Delete functionality
    - [x] Edit button conditional rendering
    - [x] Accessibility testing

- [x] JobForm Implementation
  - [x] Component Structure
    - [x] Create JobForm/JobForm.tsx
    - [x] Create JobForm/jobFormSchema.ts
    - [x] Setup **tests**/JobForm.test.tsx
  - [x] Core Implementation
    - [x] Form schema with Zod validation
    - [x] Headless UI components integration
    - [x] Create/Edit mode handling
    - [x] Form validation using react-hook-form
  - [x] API Integration
    - [x] Connect useJobMutations hook
    - [x] Implement submission logic
    - [x] Loading states
    - [x] Error handling
  - [x] Testing
    - [x] Form validation tests
    - [x] API interaction tests
    - [x] UI state tests
    - [x] Accessibility testing
  - [x] Refinement
    - [x] Loading state polish
    - [x] Error handling enhancement
    - [x] Documentation organization

Supporting Infrastructure Added:

- [x] Base UI components
  - [x] Badge component for labels
- [x] Test utilities
  - [x] Custom render with providers
  - [x] MSW server setup
  - [x] API handlers

### Routing Implementation

```typescript
// Routes Structure
routes/
  Layout.tsx         # Main layout with navigation
  ProtectedRoute.tsx # Auth protection wrapper
  paths.ts          # Route path constants
  __tests__/        # Route tests
```

#### Required Components:

- [x] Layout Component

  - [x] Navigation bar
  - [x] Auth state integration
  - [x] Responsive design
  - [x] Route-based content rendering

- [x] Route Configuration
  - [x] Define route constants
  - [x] Set up protected routes
  - [x] Implement route guards
  - [x] Add loading states
  - [x] Handle auth redirects
  - [x] API proxy configuration

```typescript
// Example Route Structure
/               // Landing page
/auth          // Authentication (login/register)
/jobs          // Protected, Job Catalog
/jobs/:id      // Protected, Job Detail
/jobs/new      // Protected, Create Job
/jobs/:id/edit // Protected, Edit Job
```

#### Testing Requirements:

- [x] Route protection tests
- [x] Navigation tests
- [x] Auth state integration tests
- [x] Loading state tests
- [x] Redirect handling tests

### CV Management Feature

```
features/cv-management/
  components/
    CVList.tsx
    CVEditor.tsx
    CVPreview.tsx
  hooks/
    useCVs.ts
    useCVGeneration.ts
  types.ts
  utils.ts
  __tests__/
```

## Testing Strategy

### Unit Tests

- Hook tests with test-utils
  - Mock providers (Auth, Query)
  - Mock localStorage
  - Mock API responses
- Utility function tests

### Integration Tests

- Feature-level tests
- User flow tests
- API interaction tests with MSW
  - Success cases
  - Error handling
  - Token management

### Contract Tests

- OpenAPI schema validation
- Response type checking
- Error handling tests

## Documentation Requirements

- [ ] API integration guides
- [x] Testing guidelines
  - [x] MSW setup and handlers
  - [x] Mock providers
  - [x] Token management in tests
- [ ] Setup instructions
- [ ] Contribution guidelines

## Development Guidelines

### UI Component Strategy

- Use Headless UI components as primary building blocks
  - Provides built-in accessibility
  - Handles keyboard navigation
  - Manages ARIA attributes
  - Reduces maintenance burden
- Apply DaisyUI classes for styling
  - Consistent theming
  - Predefined style variants
  - Responsive design patterns
- Create custom components only when:
  - Implementing complex business logic
  - Building feature-specific interfaces
  - Composing multiple Headless UI components
- Follow composition over inheritance
  - Compose Headless UI components
  - Add feature-specific behavior
  - Maintain clean separation of concerns

### Type Safety

- Strict TypeScript configuration
- No any types
- Proper type imports from OpenAPI schema

### Testing Requirements

- Integration tests for features
- Contract tests for API integrations
- Minimum 80% coverage

### Performance Standards

- Bundle size monitoring
- Code splitting implementation
- React Query caching strategies
- Lazy loading for routes

### Accessibility

- Leverage Headless UI's built-in accessibility
- Ensure proper heading hierarchy
- Maintain keyboard navigation
- Verify screen reader support
- Meet color contrast requirements
