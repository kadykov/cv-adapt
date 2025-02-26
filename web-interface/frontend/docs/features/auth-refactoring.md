# Authentication System Refactoring

## Overview

The authentication system has been refactored to use React Query as a centralized state management solution. This change addresses several issues with the previous implementation:

- Inconsistent auth state between components
- Complex manual state synchronization
- Need for custom event system
- Circular dependencies in auth code

## Implementation Details

### Core Authentication Query System

```typescript
// src/features/auth/hooks/useAuthQuery.ts
export const AUTH_QUERY_KEY = ['auth'] as const;

export function useAuthQuery() {
  return useQuery<AuthResponse | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authMutations.validateToken,
    staleTime: 60000, // 60 seconds
    refetchOnWindowFocus: true,
  });
}

export function useAuthState() {
  const { data, isLoading } = useAuthQuery();
  return {
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isLoading,
  };
}
```

### Authentication Mutations

```typescript
// Login Mutation
export function useLoginMutation(onSuccess?: (response: AuthResponse) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authMutations.login,
    onSuccess: (data) => {
      tokenService.storeTokens(data);
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
      queryClient.invalidateQueries();
      onSuccess?.(data);
    },
  });
}

// Register Mutation
export function useRegisterMutation(
  onSuccess?: (response: AuthResponse) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authMutations.register,
    onSuccess: (data) => {
      tokenService.storeTokens(data);
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
      queryClient.invalidateQueries();
      onSuccess?.(data);
    },
  });
}

// Logout Mutation
export function useLogoutMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      tokenService.clearTokens();
      return authMutations.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.removeQueries();
      onSuccess?.();
    },
  });
}
```

### Component Updates

#### AuthProvider

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthQuery(); // Initialize auth state
  return <>{children}</>;
}
```

#### ProtectedRoute

```typescript
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthState();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

## Key Benefits

1. **Single Source of Truth**

   - All auth state managed by React Query
   - Automatic caching and invalidation
   - Consistent state across components

2. **Simplified State Management**

   - No manual event dispatching
   - Automatic updates on login/logout
   - Type-safe auth operations

3. **Improved Performance**

   - Optimized re-renders
   - Smart caching
   - Automatic background refetching

4. **Better Developer Experience**
   - Cleaner component code
   - Predictable state updates
   - Type-safe API

## Testing Strategy

1. **Unit Tests**

   - Individual hook testing
   - Component integration
   - Error handling verification

2. **Integration Tests**

   - Complete auth flows
   - State synchronization
   - Token management

3. **Contract Tests**
   - API schema validation
   - Response type checking
   - Error handling

## Migration Guide

### 1. Update Imports

```typescript
// Old
import { useAuth } from '../hooks/useAuth';

// New
import { useAuthState, useLoginMutation } from '../hooks';
```

### 2. Replace useAuth Hook

```typescript
// Old
const { isAuthenticated, login } = useAuth();

// New
const { isAuthenticated } = useAuthState();
const { mutate: login } = useLoginMutation();
```

### 3. Remove Event Dispatches

```typescript
// Old
window.dispatchEvent(new CustomEvent('auth-state-change', { ... }));

// New
// Not needed - React Query handles state updates automatically
```

### 4. Update Protected Routes

```typescript
// Old
const { isAuthenticated } = useAuth();

// New
const { isAuthenticated } = useAuthState();
```

## Future Considerations

1. **Session Management**

   - Token refresh flow
   - Inactivity timeouts
   - Cross-tab synchronization

2. **Error Handling**

   - Global error processing
   - Retry strategies
   - User feedback

3. **Feature Extensions**
   - Password reset flow
   - Social auth integration
   - Multi-factor authentication
