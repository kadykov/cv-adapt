# Authentication System

## Overview

The authentication system provides secure route protection and token management for the web interface. It uses React Query for state management and React Router for protected route handling.

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
- Loading state handling

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

#### Usage Example

```typescript
function Header() {
  const { isAuthenticated, clearAuth } = useAuth();

  const handleLogout = async () => {
    await clearAuth();
    // User is now logged out
  };

  return (
    <header>
      {isAuthenticated ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  );
}
```

### `ProtectedRoute` Component

A higher-order component that handles route protection based on authentication state.

```typescript
<ProtectedRoute redirectTo="/login">
  <SecureContent />
</ProtectedRoute>
```

#### Features

- Automatic redirect for unauthenticated users
- Loading state handling
- Preserves attempted URL for post-login redirect
- Configurable redirect path

#### Usage Example

```typescript
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/lib/auth';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

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

### Testing

The authentication system includes comprehensive tests:

- Unit tests for all components
- Integration tests for forms and dialogs
- Mocked API responses
- Loading and error state coverage
- Validation behavior tests
- Accessibility testing

## Next Steps

- Add refresh token handling
- Implement password reset functionality
- Add social authentication providers
- Enhance security with 2FA
