# Authentication System

## Overview
The authentication system provides secure route protection and token management for the web interface. It uses React Query for state management and React Router for protected route handling.

## Components

### `useAuth` Hook
The main authentication hook that manages token state and provides authentication utilities.

```typescript
const { isAuthenticated, isLoading, token, clearAuth } = useAuth();
```

#### Features
- Token persistence with localStorage
- Reactive state updates with React Query
- Type-safe authentication state
- Async logout functionality

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

### Route Protection
Protected routes are implemented using React Router v6 and handle:
- Authentication checks
- Loading states
- Redirect management
- URL preservation

### Testing
The authentication system includes comprehensive tests:
- Unit tests for the useAuth hook
- Integration tests for ProtectedRoute
- Coverage for edge cases and async operations

## Next Steps
- Implement authentication forms (login, registration)
- Add password reset functionality
- Integrate with backend auth endpoints
- Add refresh token handling
