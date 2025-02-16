# Frontend Testing Guide (Legacy Document)

> **⚠️ IMPORTANT: This document is partially deprecated**
>
> Please refer to the new, comprehensive Frontend Testing Guide located at:
> `web-interface/frontend/docs/frontend-testing-guide.md`
>
> The information below may not reflect the most current testing infrastructure.

## Current Testing Strategy Overview

This document provides historical context for our frontend testing approach. While some principles remain valid, please consult the new guide for the most up-to-date practices.

### Key Changes
- ✅ Moved to more flexible MSW handler generation
- ✅ Enhanced type generation workflow
- ✅ Updated testing tool configurations

## Testing Philosophy (Historical Context)

Our frontend testing strategy has evolved to balance thorough testing with improved type safety and API contract compliance.

### Current Principles (as of latest update)

1. **Flexible Mocking**
   - Custom MSW handlers allowed for unit tests
   - Generated handlers for integration tests
   - Enhanced type safety through Zod schemas

2. **Type-Driven Testing**
   - Generated types from OpenAPI schema
   - Service classes for consistent API interactions
   - Zod-based validation

## Retained Best Practices

The following sections contain valuable testing principles that remain largely unchanged:

### Test Organization
- Group tests by feature
- Use clear naming conventions
- Maintain comprehensive test coverage

### Error Handling
- Test error scenarios thoroughly
- Verify error messages and recovery flows
- Check boundary cases

### Performance Considerations
- Keep tests fast and focused
- Use efficient setup and teardown
- Leverage watch mode for development

## Migration Guidance

If you're working with existing tests:

1. **Review Generated Artifacts**
   - Check `src/types/` directory for new type definitions
   - Use generated service classes
   - Leverage Zod schemas for validation

2. **Update Test Approaches**
   - Prefer generated handlers for integration tests
   - Create custom handlers only when necessary for unit tests
   - Ensure type safety using generated schemas

## Maintenance Recommendations

1. **Keep Types Updated**
   ```bash
   npm run generate:types
   ```

2. **Sync with OpenAPI**
   - Regularly update OpenAPI schema
   - Regenerate types and handlers
   - Test affected components

## Legacy Test Examples (For Reference)

> ⚠️ These examples may need updates to align with current practices.

### Unit Test Example (Historical)

```typescript
describe('LoginForm Component', () => {
  // Example remains similar, but consider using new service classes and Zod schemas
  it('handles loading state', async () => {
    // Potential updates needed
    server.use(
      rest.post('/api/login', (req, res, ctx) =>
        res(ctx.delay(100))
      )
    );

    render(<LoginForm />);
    // Test logic remains similar
  });
});
```

### Integration Test Example (Historical)

```typescript
describe('Login Flow', () => {
  // Example remains conceptually similar
  it('completes successful login flow', async () => {
    // Consider using new generated handlers and service classes
    render(<LoginForm />);
    // Test logic remains similar
  });
});
```

## Final Recommendation

🔍 **Always Refer to the New Guide**
For the most current testing practices, workflow, and infrastructure details, please consult:
`web-interface/frontend/docs/frontend-testing-guide.md`
