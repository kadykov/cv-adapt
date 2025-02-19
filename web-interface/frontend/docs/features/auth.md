# Authentication System

## Overview

The authentication system provides secure route protection and token management for the web interface. It uses React Query for state management and React Router for protected route handling.

## Directory Structure

```
features/auth/
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
```

## Components

### Authentication Forms

#### `LoginForm` Component

A form component that handles user login with email and password.

```typescript
<LoginForm onSuccess={() => navigate('/dashboard')} />
```

Features:

- Email format validation
- Required field validation
- Loading state handling
- Error message display
- Type-safe form handling with Zod
- Focus and hover state management
- Accessibility support with HeadlessUI

#### `RegisterForm` Component

A form component that handles new user registration.

```typescript
<RegisterForm onSuccess={() => navigate('/dashboard')} />
```

Features:

- Email format validation
- Password complexity requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
- Password confirmation matching
- Real-time validation feedback
- Loading state handling ("Creating Account...")
- Error state management with API errors
- HeadlessUI integration for accessibility

#### `AuthDialog` Component

A modal dialog that switches between login and registration forms.

```typescript
<AuthDialog isOpen={showAuth} onClose={() => setShowAuth(false)} />
```

Features:

- Smooth transitions between forms
- Modal dialog with backdrop
- Keyboard navigation support
- Accessible design
- Proper focus management

## Hooks

### `useAuth` Hook

The main authentication hook that manages token state and provides authentication utilities.

```typescript
const { isAuthenticated, isLoading, token, clearAuth, loginWithCredentials } =
  useAuth();
```

#### Features

- Token persistence with localStorage
- Reactive state updates with React Query
- Type-safe authentication state
- Async logout functionality
- Credentials-based login

### `useRegisterMutation` Hook

Handles user registration with proper error handling.

```typescript
const { mutateAsync, isPending, error } = useRegisterMutation();
```

Features:

- API error handling
- Loading state management
- Automatic auth context updates
- Type-safe mutations

### `useProfile` Hook

Fetches and manages the authenticated user's profile.

```typescript
const { data: profile, isLoading, error } = useProfile();
```

Features:

- Automatic retries disabled
- Error handling for unauthorized states
- Type-safe profile data

### `useRefreshToken` Hook

Manages token refresh operations.

```typescript
const { mutateAsync, isPending } = useRefreshToken();
```

Features:

- Token refresh handling
- Type-safe response handling
- Error management

## Testing

### Test Structure

```
__tests__/
  hooks.test.tsx      # Hook unit tests
  components/
    LoginForm.test.tsx
    RegisterForm.test.tsx
testing/
  fixtures.ts         # Shared test data
  mocks.tsx          # Mock components
  setup.ts           # Test utilities
```

### Component Testing

Tests cover:

- Form validation
- Loading states
- Error handling
- Success scenarios
- Focus management
- Accessibility features
- API integration

### Hook Testing

Tests verify:

- State management
- API interactions
- Error handling
- Loading states
- Token management

### Mock Setup

- Centralized mock data
- Shared test utilities
- MSW handlers for API
- QueryClient setup
- Auth context mocking

## Implementation Details

### Authentication State

The authentication state is managed using React Query, which provides:

- Consistent state across components
- Automatic background updates
- Token persistence
- Type-safe state management

### Form Validation

Form validation is implemented using:

- Zod schema validation
- React Hook Form
- Real-time error feedback
- Customizable validation rules

### Testing Best Practices

- Use role-based queries
- Test loading states
- Verify error handling
- Check accessibility
- Mock API responses
- Test focus management
- Verify form submissions

## Next Steps

- Implement password reset functionality
  - Request reset form
  - Reset token handling
  - New password form
- Add refresh token rotation
- Add social authentication providers
- Enhance security with 2FA
