> **⚠️ IMPORTANT: Comprehensive Frontend Testing Guide Available**
>
> For the most current testing practices, workflow, and infrastructure details, please refer to:
> `web-interface/frontend/docs/frontend-testing-guide.md`

# Test Directory Structure

## Pretest Setup

Before running tests, our automated pretest configuration ensures all necessary files are generated:

```bash
npm test  # This triggers the pretest hook automatically

# Manual generation if needed:
npm run generate:all  # Runs both type and handler generation
```

The pretest hook (`npm run generate:all`) handles:
1. API type generation (`generate:types`)
   - Generates TypeScript types from OpenAPI schema
   - Ensures type safety in tests
2. MSW handler generation (`generate:handlers`)
   - Creates mock service workers from OpenAPI spec
   - Provides consistent API mocking

This automation ensures tests are running against the latest API types and mock handlers.

This directory contains test utilities, helpers, and setup files for frontend testing.

## Files Overview

### `setup.ts`
Global test setup and configuration:
- Test environment setup
- Global mocks
- Custom matchers
- Error handling configuration

### `test-utils.tsx`
Core test utilities:
- Custom render function with providers
- Test wrapper components
- Query client setup
- Test hooks utilities

### `helpers.ts`
General test helpers:
- Service interaction helpers
- Loading state management
- UI interaction utilities
- Error handling helpers

### `a11y-helpers.ts`
Accessibility testing utilities:
- Focus management testing
- ARIA attribute verification
- Screen reader announcement testing
- Keyboard interaction helpers

### `service-mocks.ts`
Service mocking utilities:
- Mock service creators
- Test data builders
- API response utilities
- Error service creators

### `index.ts`
Central export point:
- Consolidated exports
- Common test patterns
- Test IDs
- Keyboard shortcuts

## Usage Example

```typescript
import {
  render,
  screen,
  waitForLoadingToComplete,
  createMockJobService,
  expectServiceCall,
  verifyAccessibility
} from '../test';

describe('Component', () => {
  let mockService = createMockJobService([/* test data */]);

  beforeEach(() => {
    mockService = createMockJobService([/* test data */]);
  });

  it('passes accessibility checks', async () => {
    const view = render(<Component />);
    await waitForLoadingToComplete();

    await verifyAccessibility(view, {
      focusOrder: ['first', 'second'],
      ariaLabels: { container: 'My Component' },
      ariaLive: true
    });
  });
});
```

## Best Practices

1. Import from the index file (`../test`) instead of individual files
2. Use provided test utilities instead of raw testing library functions
3. Use test data builders for consistent test data
4. Follow the testing patterns in the [Frontend Testing Guide](../docs/frontend-testing-guide.md)
5. Include accessibility tests for all interactive components

## Debugging Tests

### Using Debug Mode

```typescript
it('can be debugged', async () => {
  render(<Component />);

  // Print current DOM state
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole('button'));

  // Set breakpoint
  debugger;

  // Continue test...
});
```

### Common Issues and Solutions

1. **Async Issues**
```typescript
// ❌ Wrong - might miss state updates
render(<Component />);
expect(screen.getByText('Loaded')).toBeInTheDocument();

// ✅ Right - wait for state changes
render(<Component />);
await waitForText('Loaded');
```

2. **Query Selection**
```typescript
// ❌ Wrong - too specific
screen.getByTestId('submit-button');

// ✅ Right - use accessible roles
screen.getByRole('button', { name: /submit/i });
```

3. **Service Mocking**
```typescript
// ❌ Wrong - mock might not be called
const mockFn = vi.fn();
expect(mockFn).toHaveBeenCalled();

// ✅ Right - verify with proper timing
await expectServiceCall(mockService, 'methodName');
```

4. **Focus Management**
```typescript
// ❌ Wrong - immediate focus check
fireEvent.click(button);
expect(input).toHaveFocus();

// ✅ Right - wait for focus
fireEvent.click(button);
await waitForFocus('input-id');
```

### Troubleshooting Tips

1. **Test Isolation Issues**
   - Check `beforeEach` cleanup
   - Verify mock resets
   - Clear query cache between tests

2. **Timing Problems**
   - Use `waitFor` for async operations
   - Check loading state completion
   - Verify service call timings

3. **State Updates**
   - Use `await` with state changes
   - Check React Query cache
   - Verify service responses

4. **Component Rendering**
   - Check provider setup
   - Verify prop types
   - Inspect rendered DOM

## Adding New Utilities

When adding new test utilities:

1. Add the utility to the appropriate file based on its purpose
2. Add TypeScript types and documentation
3. Export the utility from `index.ts`
4. Update testing documentation with usage examples
5. Follow existing patterns for naming and implementation

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/features/jobs/job-list.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Testing Resources

- [Frontend Testing Guide](../docs/frontend-testing-guide.md)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

If you encounter issues:

1. Check the test output for specific error messages
2. Use `screen.debug()` to inspect the DOM
3. Verify test setup and mock configurations
4. Check for async operation handling
5. Review the [Frontend Testing Guide](../docs/frontend-testing-guide.md)
6. Consult team members for complex issues
