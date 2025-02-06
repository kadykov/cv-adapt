# Authentication Feature

## Overview

The authentication feature provides user authentication and authorization functionality for CV Adapt. It includes login, registration, session management, and protected route capabilities.

## Components

### `LoginForm`
- User login interface with email/password inputs
- Form validation using Zod schemas
- Error handling and loading states
- "Remember me" functionality
- Redirects on successful authentication

### `RegisterForm`
- New user registration with email/password
- Password requirements validation
- Terms and conditions acceptance
- Error handling and loading states
- Automatic login on successful registration

### `ProtectedRoute`
- Route protection based on authentication state
- Loading states during auth checks
- Configurable redirect location
- Automatic redirection for unauthenticated users

### `AuthProvider`
- Global authentication state management
- JWT token handling and storage
- Session persistence
- Automatic token refresh
- Logout functionality

## Usage

### Basic Setup

Wrap your app with `AuthProvider`:

```tsx
import { AuthProvider } from "./features/auth";

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  );
}
```

### Protected Routes

Protect routes that require authentication:

```tsx
import { ProtectedRoute } from "./features/auth";

function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### Using Authentication State

Access auth state and functions using the `useAuth` hook:

```tsx
import { useAuth } from "./features/auth";

function UserProfile() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

## Authentication Flow

1. **Login/Registration**
   - User submits credentials
   - Server validates and returns JWT token
   - Token stored in localStorage (if "Remember me" enabled)
   - User redirected to protected area

2. **Session Management**
   - Auth state persisted in localStorage
   - Token automatically refreshed every 15 minutes
   - Session cleared on logout

3. **Protected Routes**
   - Auth state checked on route access
   - Unauthenticated users redirected to login
   - Loading states shown during auth checks

## API Integration

Authentication endpoints under `/api/v1/auth/`:

- `POST /login` - User login
- `POST /register` - New user registration
- `POST /logout` - User logout
- `POST /refresh` - Refresh authentication token

## Configuration

Environment settings in `src/config/env.ts`:

```typescript
{
  apiBaseUrl: string;    // API base URL
  apiVersion: string;    // API version (v1)
  authTokenKey: string;  // localStorage key for auth token
}
```

## Error Handling

Authentication errors handled through `AuthenticationError` class:
- Invalid credentials
- Registration failures
- Network errors
- Token refresh failures

## Styling

Components styled using Tailwind CSS with DaisyUI:
- Consistent form layouts
- Responsive design
- Loading states
- Error messages
- Interactive feedback

## Testing

Test files for each component ensure:
- Form validation works correctly
- Authentication flow functions properly
- Protected routes behave as expected
- Error states are handled appropriately
