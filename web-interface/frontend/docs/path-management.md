# API Path Management

## Overview

We use a centralized, type-safe approach to manage API paths using our OpenAPI schema as the single source of truth. This ensures consistency between our API contract and frontend implementation.

## Usage

### Basic Path Access

```typescript
import { API_PATHS, getApiPath } from '../api/api-paths';

// Get path with type safety
const loginPath = getApiPath('auth', 'login');

// Use in API calls
await client.post(loginPath, data);
```

### Type-Safe Path Constants

```typescript
import { paths } from '../types/api-schema';
import { API_PATHS, getApiPath } from '../api/api-paths';

// Define path constants
const LOGIN_PATH = getApiPath('auth', 'login');
const LOGOUT_PATH = getApiPath('auth', 'logout');

// Type-safe request/response types
type LoginRequest = paths[typeof LOGIN_PATH]['post']['requestBody']['content']['application/x-www-form-urlencoded'];
type LoginResponse = paths[typeof LOGIN_PATH]['post']['responses']['200']['content']['application/json'];
```

### In Test Files

```typescript
import { API_PATHS, getApiPath } from '../api/api-paths';

describe('Auth Component', () => {
  const { simulateSuccess } = createTestHelpers();

  it('handles login', async () => {
    simulateSuccess(getApiPath('auth', 'login'), 'post', mockData);
    // Rest of test
  });
});
```

## Adding New Paths

When adding new API endpoints:

1. Add the path to `API_PATHS` in `api-paths.ts`:
```typescript
export const API_PATHS = {
  auth: {
    login: '/v1/api/auth/login' as const,
    logout: '/v1/api/auth/logout' as const,
  },
  jobs: {
    list: '/v1/api/jobs' as const,
    details: '/v1/api/jobs/{id}' as const,
  },
} as const;
```

2. The type system will validate that the path exists in the OpenAPI schema

## Benefits

- **Type Safety**: Paths are validated against OpenAPI schema at compile time
- **Single Source of Truth**: OpenAPI schema drives both types and runtime behavior
- **Better Refactoring**: Changing a path in one place updates all usages
- **IDE Support**: Full autocomplete for paths and their associated types
- **Runtime Validation**: Paths are validated against schema at runtime

## Best Practices

1. Always use `getApiPath` to access paths
2. Group related paths under meaningful sections in `API_PATHS`
3. Use path constants when referenced multiple times in a file
4. Leverage type inference with `typeof PATH` for request/response types
5. Keep paths aligned with OpenAPI schema

## Migration

When migrating existing code:

1. Replace hardcoded paths with `getApiPath`:
```typescript
// Before
client.post('/v1/api/auth/login', data);

// After
const loginPath = getApiPath('auth', 'login');
client.post(loginPath, data);
```

2. Update type references:
```typescript
// Before
type LoginResponse = paths['/v1/api/auth/login']['post']['responses']['200']['content']['application/json'];

// After
const LOGIN_PATH = getApiPath('auth', 'login');
type LoginResponse = paths[typeof LOGIN_PATH]['post']['responses']['200']['content']['application/json'];
