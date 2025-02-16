# Frontend Testing Patterns

## Overview of Testing Infrastructure

Our frontend testing approach combines comprehensive test coverage with type-safe, generated infrastructure:

### Key Technologies
- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **API Mocking**: Mock Service Worker (MSW)
- **Type Generation**: OpenAPI TypeScript, Zod
- **Service Classes**: Generated from OpenAPI schema

## Test Setup and Configuration

### Automated Preparation
Before running tests, our infrastructure automatically:
- Generates TypeScript types from OpenAPI schema
- Creates Zod validation schemas
- Generates service classes
- Prepares MSW handlers

```bash
# Automated pre-test generation
npm run pretest  # Runs type and handler generation
```

### Test Utilities
Custom render function provides:
- React Query test configuration
- MemoryRouter setup
- Accessibility testing utilities
- Type-safe test data helpers

```typescript
import { render, screen } from '../test';

describe('Component', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

## Service Mocking and Interaction

### Generated Service Mocking
Leverage generated service classes for consistent, type-safe mocking:

```typescript
import {
  DetailedCVService,
  createMockServiceFactory,
  mockDataFactory
} from '@/types/services';

describe('CV Component', () => {
  // Use generated mock data factory
  const mockCV = mockDataFactory.detailedCV({
    language_code: 'en',
    is_primary: true
  });

  // Create mock service with type safety
  const mockCVService = createMockServiceFactory(DetailedCVService)
    .withMethod('getAllDetailedCVs', [mockCV])
    .build();

  it('renders CV details', async () => {
    render(<CVComponent service={mockCVService} />);

    // Type-safe service interaction
    await expectServiceCall(mockCVService, 'getAllDetailedCVs');
    expect(screen.getByText(mockCV.title)).toBeInTheDocument();
  });
});
```

### Zod-Validated Mocking
Ensure type safety and validation with Zod schemas:

```typescript
import { schemas } from '@/types/zod-schemas';

describe('Service Validation', () => {
  it('validates mock data', () => {
    const mockJob = schemas.JobDescriptionResponse.parse({
      id: 1,
      title: 'Software Engineer',
      language_code: 'en'
    });

    // Ensures type safety and schema compliance
    expect(mockJob).toBeDefined();
  });
});
```

## Advanced Testing Patterns

### Handling Async Operations
Improved async testing with generated service classes:

```typescript
describe('Async Interactions', () => {
  it('handles loading and error states', async () => {
    // Create error-simulating service
    const errorService = createErrorServiceFactory(JobService)
      .withMethod('getJobs', new Error('Network error'))
      .build();

    render(<JobList service={errorService} />);

    // Verify loading and error states
    await expectLoadingState();
    await expectErrorMessage(/Network error/);

    // Retry mechanism
    const successService = createMockServiceFactory(JobService)
      .withMethod('getJobs', mockJobs)
      .build();

    fireEvent.click(screen.getByText(/retry/i));
    await expectSuccessState(successService);
  });
});
```

### Accessibility Testing
Enhanced accessibility testing with generated utilities:

```typescript
describe('Accessibility', () => {
  it('manages focus and ARIA attributes', async () => {
    render(<JobForm />);

    // Verify focus management
    await expectFocusOrder([
      'job-select',
      'language-select',
      'submit-button'
    ]);

    // Check ARIA attributes
    const jobSelect = screen.getByRole('combobox', { name: /job/i });
    expect(jobSelect).toHaveAttribute('aria-required', 'true');
  });
});
```

## Test Data Management

### Type-Safe Test Data Builders
Leverage generated schemas for consistent test data:

```typescript
import { builders } from '@/types/test-data';

const mockJobs = [
  builders.job({
    id: 1,
    title: 'Software Engineer',
    language_code: 'en'
  }),
  builders.job({
    id: 2,
    title: 'Frontend Developer',
    language_code: 'fr'
  })
];

const mockCVs = [
  builders.cv('en', {
    is_primary: true,
    content: {
      personal_info: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    }
  })
];
```

## Best Practices

1. **Automated Generation**
   - Keep OpenAPI schema updated
   - Regenerate types frequently
   - Use `npm run generate:all`

2. **Type Safety**
   - Always use generated types
   - Leverage Zod schemas
   - Minimize manual type definitions

3. **Service Interaction**
   - Use generated service classes
   - Create type-safe mocks
   - Validate API responses

4. **Test Coverage**
   - Test loading states
   - Verify error handling
   - Include accessibility tests
   - Cover different scenarios

## Troubleshooting

### Common Issues
- Regenerate types if OpenAPI schema changes
- Check Zod validation errors
- Verify service method signatures
- Ensure mock data matches schema

### Debugging Tips
```typescript
// Print detailed type information
type JobType = z.infer<typeof schemas.JobDescriptionResponse>;

// Validate and inspect mock data
const validatedJob = schemas.JobDescriptionResponse.parse(mockJob);
console.log(validatedJob);  // Fully typed and validated
```

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## Recommended Resources
- [Frontend Testing Guide](frontend-testing-guide.md)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/)
- [Zod Validation](https://zod.dev/)
