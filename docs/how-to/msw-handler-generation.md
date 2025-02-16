# MSW Handler Generation (Legacy Document)

> **⚠️ IMPORTANT: This document is deprecated**
>
> Please refer to the new Frontend Testing Guide located at:
> `web-interface/frontend/docs/frontend-testing-guide.md`
>
> The information below is no longer current.

## Current MSW Handler Generation Strategy

Our approach to generating Mock Service Worker (MSW) handlers has been updated. The new strategy provides more flexibility and type safety.

### Key Changes
- Automated handler generation from OpenAPI schema
- Support for custom handlers in unit tests
- Enhanced type validation

## Recommended Workflow

1. **Integration Tests**
   - Use auto-generated handlers from OpenAPI
   - Located in `src/mocks/generated/`
   - Provides consistent, schema-validated mock responses

2. **Unit Tests**
   - Custom MSW handlers allowed
   - Create scenario-specific mocks
   - Use generated service classes and schemas

## Generation Scripts

```bash
# Generate MSW handlers
npm run generate:handlers

# Generate all (types + handlers)
npm run generate:all
```

## Best Practices

- Always use generated types and schemas
- Create custom handlers only when necessary
- Validate API responses using Zod schemas
- Cover different scenarios (success, error, loading)

## Final Recommendation

🔍 **Consult the New Guide**
For comprehensive details on MSW handler generation and testing strategies, refer to:
`web-interface/frontend/docs/frontend-testing-guide.md`
