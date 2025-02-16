# System Patterns

## Testing Patterns

### Frontend Testing

The frontend testing system follows a contract-first approach, leveraging automatic MSW handler generation from the OpenAPI specification.

1.  **Handler Generation**
    *   OpenAPI schema as the single source of truth.
    *   Automatic generation of type-safe MSW handlers using `scripts/generate-handlers.ts`.
    *   Runtime response validation.
    *   Simplified error handling (401, 404, 422, etc.).
    *   Loading state simulation.

2.  **Handler Usage**

    *   Import generated handlers: `import { handlers } from '@/mocks/handlers';`
    *   Simulate success responses: `handlers.[feature].[operation].success(mockData);`
    *   Simulate error responses: `handlers.[feature].[operation].error({ status: [code], message: '...' });`
    *   Simulate loading states: `handlers.[feature].[operation].loading({ delay: [ms] });`

3.  **Mock Data Factories**

    *   Create type-safe mock data using factories:

    ```typescript
    // factories/auth.ts
    import { type LoginResponse } from '@/types/api';

    export const createMockAuthData = (): LoginResponse => ({ ... });
    ```

4.  **Test Structure**

    ```typescript
    import { handlers } from '@/mocks/handlers';
    import { createMockAuthData } from '@/factories/auth';

    describe('Component', () => {
      it('handles successful operation', async () => {
        const mockData = createMockAuthData();
        handlers.[feature].[operation].success(mockData);
        // Test implementation
      });

      it('handles error', async () => {
        handlers.[feature].[operation].error({ status: [code], message: '...' });
        // Test implementation
      });

      it('shows loading state', async () => {
        handlers.[feature].[operation].loading({ delay: [ms] });
        // Test implementation
      });
    });
    ```

5.  **Best Practices**

    *   Use generated types for mock data.
    *   Create factories for complex data.
    *   Test common error scenarios and loading states.
    *   Keep OpenAPI schema up to date.

6.  **Setup and Maintenance**

    *   Install dependencies: `npm install -D msw openapi-typescript tsx`
    *   Generate types and handlers: `npm run generate:all`
    *   Update types and handlers after OpenAPI schema changes.
    *   Use `npm run dev` for development with watch mode.

## Core Architectural Patterns

1. **Protocol-Based Design**
   - Extensive use of Python protocols for interfaces
   - Loose coupling between components
   - Type-safe contract definitions
   - Easy extension points

2. **Context Management**
   - Thread-safe language context
   - Context manager pattern for language switching
   - State management through context objects

3. **Template Strategy**
   - Template-based generation system
   - Customizable templates per component
   - Language-specific template variants

## Data Flow Patterns

1. **CV Generation Pipeline**
   ```
   Input CV → Component Generation → Summary → Title → Assembly → Rendering → Output
   ```

2. **Component Generation**
   ```
   Input → Validation → Template Selection → Context Prep → Generation → Post-processing
   ```

## Extension Points

1. **Custom Generators**
   - Protocol-based implementation
   - Component-specific generation
   - Language-aware generation

2. **Custom Renderers**
   - Format-specific rendering
   - Custom output formats
   - Template overrides

3. **Template Customization**
   - Override default templates
   - Language-specific variations
   - Custom component templates

## Performance Patterns

1. **Caching Strategies**
   - Template caching
   - Language context caching
   - Resource pooling

2. **Lazy Loading**
   - Deferred template loading
   - On-demand resource initialization
   - Memory optimization

## Testing Patterns

1. **Contract Testing & Type Safety**
   - OpenAPI schema as single source of truth
   - Automated TypeScript type generation
   - Generated MSW handlers from schema
   - Runtime contract validation
   - Type-safe request/response handling
   - Centralized API path management:
     ```typescript
     // api-paths.ts
     import { paths } from '../types/api-schema';

     export const API_PATHS = {
       auth: {
         login: '/v1/api/auth/login' as keyof paths
       }
     } as const;

     // Usage in tests
     import { API_PATHS } from './api-paths';

     simulateSuccess(API_PATHS.auth.login, 'post', mockData);
     ```
   - Schema-driven path validation
   - Automated path consistency checks

2. **Test Helpers & Utilities**
   - Centralized createTestHelpers factory
   - Standardized simulation methods:
     ```typescript
     const { simulateSuccess, simulateError, simulateLoading } = createTestHelpers();

     // Success case
     simulateSuccess('/api/endpoint', 'method', mockData);

     // Error case
     simulateError('/api/endpoint', 'method', statusCode, message);

     // Loading state
     simulateLoading('/api/endpoint', 'method', delayMs);
     ```
   - Consistent test setup patterns
   - Type-safe mock data generation

3. **Component Testing Strategy**
   - Standardized test structure:
     ```typescript
     describe('Component', () => {
       // Basic rendering
       it('renders component', () => {
         render(<Component />);
         expect(screen.getByRole(...)).toBeInTheDocument();
       });

       // Success states
       it('handles successful operation', async () => {
         simulateSuccess(...);
         await userEvent.click(...);
         await waitFor(() => {
           expect(screen.getByText(...)).toBeInTheDocument();
         });
       });

       // Error states
       it('handles error states', async () => {
         simulateError(...);
         await userEvent.click(...);
         await waitFor(() => {
           expect(screen.getByText(/error/i)).toBeInTheDocument();
         });
       });

       // Loading states
       it('shows loading state', async () => {
         simulateLoading(...);
         await userEvent.click(...);
         expect(screen.getByRole('progressbar')).toBeInTheDocument();
       });
     });
     ```

4. **Integration Testing**
   - API endpoint validation
   - End-to-end flow testing
   - Complex state management
   - Cross-component interactions
   - Example pattern:
     ```typescript
     it('completes full workflow', async () => {
       // Setup initial state
       simulateSuccess('/api/auth', 'post', mockAuthResponse);

       // Trigger user actions
       await userEvent.type(...);
       await userEvent.click(...);

       // Verify state changes
       await waitFor(() => {
         expect(localStorage.getItem('token')).toBe(...);
         expect(window.location.pathname).toBe(...);
       });

       // Verify UI updates
       expect(screen.getByText(...)).toBeInTheDocument();
     });
     ```

5. **Test Organization**
   - Feature-based directory structure
   - Consistent file naming
   - Clear test descriptions
   - Comprehensive coverage patterns

## Error Handling

1. **Validation Layer**
   - Pydantic model validation
   - Language validation
   - Template validation
   - API contract validation

2. **Generator Errors**
   - Template rendering errors
   - Context preparation errors
   - Generation failures

3. **Renderer Errors**
   - Format conversion errors
   - Output generation errors
   - Resource access errors

4. **API Error Handling**
   - Contract-compliant error responses
   - Consistent error formats
   - Status code standardization
   - Error boundary patterns
