# Frontend Testing Migration Plan

> **⚠️ IMPORTANT: Comprehensive Frontend Testing Guide Available**
>
> For the most current testing practices, workflow, and infrastructure details, please refer to:
> `web-interface/frontend/docs/frontend-testing-guide.md`

## Overview of Testing Infrastructure Evolution

Our frontend testing approach has transformed to provide:
- Type-safe API interactions
- Automated handler generation
- Enhanced test reliability
- Comprehensive type validation

### Key Technologies
- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **API Mocking**: Mock Service Worker (MSW)
- **Type Generation**: OpenAPI TypeScript, Zod
- **Service Classes**: Generated from OpenAPI schema

## Files to Migrate

### Priority 1: API Layer Tests
1. `src/features/job-catalog/api/__tests__/jobsApi.integration.test.ts`
2. `src/features/job-catalog/api/__tests__/jobsApi.test.ts`
3. `src/tests/unit/api/services/JobsService.test.ts`
4. `src/tests/unit/api/services/AuthService.test.ts`

### Priority 2: Component Tests
1. `src/features/job-catalog/components/__tests__/JobList.test.tsx`
   - Migrate to generated handlers and test helpers
   ```typescript
   // Before
   server.use(
     http.get('/jobs', () => HttpResponse.json([mockJob]))
   );

   // After
   import { simulateSuccess } from '@/test/helpers';
   simulateSuccess('/api/v1/jobs', 'get', [mockJob]);
   ```

2. Additional components to migrate:
   - `src/features/job-catalog/components/__tests__/JobDetail.test.tsx`
   - `src/tests/unit/components/Layout.test.tsx`
   - `src/tests/unit/App.test.tsx`
   - `src/tests/unit/pages/jobs.test.tsx`

### Priority 3: Infrastructure Tests
1. `src/tests/contract.test.ts` (Can be removed - now handled by generated handlers)
2. `src/tests/generated-types.test.ts` (Review if still needed)
3. `src/tests/unit/api/core/ApiError.test.ts`

## Migration Steps

### 1. Preparation
- [x] Create new handler generation system
- [x] Set up test helpers
- [x] Update documentation
- [x] Migrate auth components as example

### 2. API Layer Migration
1. Update service tests with generated handlers
2. Remove manual MSW configurations
3. Add type-safe test helpers
4. Validate API contract compliance

### 3. Component Migration
1. Migrate complex components first
2. Use generated service classes
3. Leverage Zod schemas for validation
4. Verify all functionality

### 4. Infrastructure Updates
1. Remove redundant contract tests
2. Review and update type tests
3. Update error handling tests
4. Ensure OpenAPI schema coverage

### 5. Cleanup
1. Remove unused test utilities
2. Update test documentation
3. Remove old handler configurations
4. Verify test coverage

## Best Practices During Migration

1. **Incremental Migration**
   - Migrate one component at a time
   - Run tests after each change
   - Commit changes per component

2. **Type Safety**
   - Use generated service classes
   - Leverage Zod schemas
   - Validate API responses

3. **Test Coverage**
   - Maintain or improve coverage
   - Add missing test cases
   - Document complex scenarios

4. **Code Review**
   - Review migration PRs carefully
   - Focus on:
     * Handler usage
     * Error scenarios
     * Loading states
     * Type safety

## Recommended Resources

- [Frontend Testing Guide](frontend-testing-guide.md)
- [Testing Patterns](testing-patterns.md)
- [Path Management](path-management.md)

## Timeline

1. **Week 1**: API Layer and Job Catalog
2. **Week 2**: Remaining Components and Infrastructure
3. **Week 3**: Cleanup and Documentation

## Success Criteria

1. All tests passing with new system
2. No manual MSW configurations
3. Improved test readability
4. Maintained or improved coverage
5. Updated documentation
6. Team comfortable with new approach

## Rollback Plan

If issues are encountered:
1. Keep old and new systems in parallel
2. Roll back one component at a time
3. Document any issues for future reference

## Final Recommendation

Refer to the [Frontend Testing Guide](frontend-testing-guide.md) for comprehensive details on the new testing infrastructure and migration strategies.
