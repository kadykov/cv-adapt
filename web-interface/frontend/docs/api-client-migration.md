> **⚠️ IMPORTANT: Comprehensive Frontend Testing Guide Available**
>
> For the most current API client and testing practices, please refer to:
> `web-interface/frontend/docs/frontend-testing-guide.md`

# API Client Migration Plan

## Overview
Migration from manual API client to generated type-safe client using openapi-zod-client with Zod validation, while maintaining MSW for integration testing. This approach builds upon our existing tooling to provide a more robust and type-safe API layer.

## Goals
1. Generate type-safe API client from OpenAPI schema
2. Maintain test coverage during migration
3. Keep MSW for integration testing
4. Improve developer experience with better typing

## Phase 1: Enhance Current Generation Setup
- [x] Extend openapi-zod-client configuration:
  ```typescript
  {
    withAlias: true,
    apiClientName: 'ApiClient',
    baseUrl: '/api/v1',
    includeServices: true // Enable service class generation
  }
  ```
- [x] Create service wrapper template:
  ```typescript
  import { ApiClient } from './api-client';
  import { schemas } from './zod-schemas';
  import type { ApiResponse, ApiError } from './api-utils';

  export class BaseService {
    constructor(protected client = new ApiClient()) {}

    protected handleError(error: unknown): never {
      // Convert errors to our ApiError format
      throw error;
    }
  }

  export class UsersService extends BaseService {
    async getCurrentUser(): Promise<ApiResponse<typeof schemas['User']>> {
      try {
        return await this.client['/users/me'].get();
      } catch (error) {
        return this.handleError(error);
      }
    }
  }
  ```
- [x] Update type generation script to include services
- [x] Add response type validation using Zod schemas
- [x] Verify generated types and services match our API

## Phase 2: Service Layer Migration
- [x] Generate initial service classes
- [x] Create wrapper/facade for generated services:
  ```typescript
  // Example wrapper
  export class UserServiceWrapper {
    constructor(private service = UsersService) {}

    async getCurrentUser() {
      return this.service.readUserMe()
        .catch(handleApiError);
    }
  }
  ```
- [x] Update API utility functions to use new services
- [x] Add error handling and response mapping
- [x] Create test helpers for new service layer

## Phase 3: Component Updates
- [ ] Identify components using direct API calls
- [ ] Create migration priority list based on dependencies
- [ ] Update components to use new services:
  ```typescript
  function UserProfile({ userService }: { userService: UserServiceWrapper }) {
    const { data } = useQuery(['user'], () => userService.getCurrentUser());
    return <div>{data.name}</div>;
  }
  ```
- [ ] Update unit tests to mock new services:
  ```typescript
  test('renders user profile', () => {
    const mockUserService = {
      getCurrentUser: vi.fn().mockResolvedValue(mockUser)
    };
    render(<UserProfile userService={mockUserService} />);
  });
  ```
- [ ] Verify functionality matches previous implementation

## Phase 4: MSW Integration
- [ ] Update MSW handler generation to use generated types:
  ```typescript
  rest.get('/api/v1/users/me', (_, res, ctx) => {
    return res(ctx.json<UserPublic>(mockUser));
  });
  ```
- [ ] Create MSW test helpers aligned with new services
- [ ] Update integration tests to use new format
- [ ] Ensure consistent mocking patterns
- [ ] Add type checking for mock data

## Phase 5: Cleanup and Documentation
- [ ] Remove old API client code
- [ ] Update developer documentation
- [ ] Document new testing patterns with examples
- [ ] Create examples for common use cases
- [ ] Update contribution guidelines

## Recommended Resources
- [Frontend Testing Guide](frontend-testing-guide.md)
- [Testing Patterns](testing-patterns.md)
- [Path Management](path-management.md)

## Success Criteria
1. All API calls use generated client
2. 100% type safety for API interactions
3. No regression in test coverage
4. Simplified MSW handlers
5. Improved developer experience

## Rollback Plan
- Keep old implementation until migration complete
- Test each component in isolation
- Ability to switch back to old client if needed
- Maintain parallel implementations during migration

## Current Status
Phase 1 and 2 Complete:
- [x] Extended type generation system with Zod validation
- [x] Created base service class with error handling
- [x] Generated service classes (DetailedCVService, JobService)
- [x] Implemented TypeScript interface components using services
- [x] Added CSS styling using Tailwind & CSS modules

Next Steps (Phase 3):
1. Create additional service classes for:
   - Authentication
   - User Management
   - CV Generation process
2. Migrate existing components to use new services
3. Update unit tests for components using service mocks

Phase 4 (Upcoming):
1. Update MSW handlers to use generated types
2. Create integration test examples with new service layer

## Final Recommendation
Refer to the [Frontend Testing Guide](frontend-testing-guide.md) for comprehensive details on API client migration and testing strategies.
