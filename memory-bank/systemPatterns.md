# System Patterns

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

3. **API Contract Management**
   ```
   Backend Definition → OpenAPI Export → Schema Documentation → Frontend Integration → Contract Testing
   ```

## Frontend Architecture Patterns

1. **Authentication State Management**
   ```
   features/auth/
     hooks/
       useAuthQuery.ts      # Core auth query hook
       useAuthState.ts      # Auth state helper hook
       useLoginMutation.ts  # Login mutation hook
       useLogoutMutation.ts # Logout mutation hook
     components/
       AuthProvider.tsx     # Query initialization
     services/
       token-service.ts     # Token management
   ```
   - Centralized auth state with React Query
   - Single source of truth for auth information
   - Automatic synchronization across components
   - Token management integrated with query system

2. **Unified Form Pattern**
   ```
   features/feature-name/
     components/
       DetailedCVPages/     # Organized page components
         DetailedCVFormPage.tsx  # Unified form container
         DetailedCVListPage.tsx  # List view
         index.ts           # Public exports
       DetailedCVForm/      # Form component
         DetailedCVForm.tsx # Core form logic
         __tests__/        # Component tests
   ```
   - Single form component for create/edit
   - Required language code in props
   - Page-level mode detection
   - Centralized navigation
   - Consistent error handling
   - Co-located components
   - Clear separation of concerns

3. **Form Page Pattern**
   ```typescript
   // DetailedCVFormPage.tsx
   export function DetailedCVFormPage() {
     const { languageCode } = useParams<{ languageCode: LanguageCode }>();
     const { data: cv, isLoading } = useDetailedCV(validLanguageCode);

     // Early validations and returns
     if (!validLanguageCode) return <Redirect />;
     if (isLoading) return <Loader />;

     return (
       <DetailedCVForm
         mode={cv ? 'edit' : 'create'}
         languageCode={validLanguageCode}
         initialData={cv}
       />
     );
   }
   ```
   - URL-based mode detection
   - Required language validation
   - Early loading states
   - Clean component hierarchy

4. **Job Management Pattern**
   ```
   features/job-catalog/
     components/             # UI Components
       JobList.tsx          # Grid layout with filtering
       JobForm/             # Form with validation
       JobDetail.tsx        # Full job information
       JobCard.tsx          # Job preview card
     hooks/                 # Data management
       useJobs.ts          # Jobs query hook
       useJob.ts           # Single job query
       useJobMutations.ts  # CRUD operations
     api/                  # API integration
       jobsApi.ts         # API client functions
   ```
   - Feature-complete implementation
   - Type-safe API integration
   - React Query for state management
   - Component-based architecture
   - Comprehensive testing

5. **Language Management**
   ```
   lib/language/
     types.ts       # Language enums and interfaces
     config.ts      # Language configurations
     utils.ts       # Language utility functions
     hooks/         # Language-related hooks
   ```
   - Centralized language type system
   - Enum-based language code validation
   - Type-safe language selection
   - Shared language utilities

6. **Feature-Based Organization**
   ```
   features/
     feature-name/
       components/     # Feature-specific components
       hooks/         # Custom hooks
       utils/         # Helper functions
       types.ts      # Feature-specific types
       __tests__/    # Tests organized by type
   ```

7. **Data Flow Pattern**
   ```
   API Schema → Generated Types → Service Layer → React Query → Components
   ```

8. **Testing Pyramid**
   ```
   Integration Tests (Features)
         ↓
   Unit Tests (Components)
   ```

## API Integration Patterns

1. **Schema Management**
   - OpenAPI schema in backend/docs/api
   - Single source of truth for API contracts
   - Automated schema export process
   - Type generation for frontend

2. **URL Management**
   ```
   lib/api/
     config.ts            # API configuration
       ↓
   lib/test/
     url-helper.ts       # URL generation
     handler-generator.ts # MSW handlers
   ```
   - Centralized API version and prefix
   - Environment-specific configurations
   - Type-safe URL generation
   - Path sanitization and validation

3. **Contract Testing**
   - Schema-based contract validation
   - Type-safe API integration
   - MSW for API mocking
   - React Query integration

## Component Patterns

1. **Language-Aware Components**
   ```
   Language-Aware Component
     ↓
   Language Context/Config
     ↓
   Typed Language Selection
   ```
   - Required language code props
   - Type-safe language validation
   - Early validation returns

2. **Smart/Dumb Component Split**
   ```
   Page Component (Smart)
     ↓
   Form Component (Dumb)
   ```
   - Page handles data fetching/routing
   - Form handles user input/validation
   - Clear responsibility separation

3. **Hook Patterns**
   ```typescript
   // Feature-specific hooks
   function useDetailedCV(languageCode: LanguageCode | undefined) {
     // Only fetch when language code is valid
     return useQuery({
       enabled: !!languageCode,
       // ...
     });
   }
   ```
   - Conditional data fetching
   - Type-safe parameters
   - Consistent error handling

## Error Handling

1. **Frontend Error Pattern**
   ```typescript
   // Type-safe error handling
   interface ApiError {
     status: number;
     message: string;
   }

   if (error && ((error as unknown) as ApiError).status !== 404) {
     return <ErrorDisplay />;
   }
   ```
   - Type-safe error casting
   - Centralized error types
   - Consistent error UI
   - Status code handling

2. **Validation Pattern**
   ```typescript
   // Early validation returns
   if (!validLanguageCode) {
     navigate(ROUTES.LIST);
     return null;
   }
   ```
   - Early validation checks
   - Type-safe validation
   - Clear error paths
   - Automatic navigation

## Testing Patterns

1. **React Query Mutation Testing Pattern**
   ```typescript
   // Create a mock module function
   const mockUseMyMutation = vi.fn();

   // Mock the module
   vi.mock('./myHook', () => ({
     useMyMutation: () => mockUseMyMutation()
   }));

   // Create type-safe mock data
   const createMockMutation = (mutateAsync = vi.fn()) => ({
     mutateAsync,
     mutate: vi.fn(),
     variables: undefined,
     data: undefined,
     error: null,
     isError: false as const,
     isPending: false as const,
     isSuccess: false as const,
     isIdle: true as const,
     status: 'idle' as const,
     // ... other required properties
   });

   // Use in tests
   beforeEach(() => {
     mockUseMyMutation.mockReturnValue({
       mutation: createMockMutation()
     });
   });
   ```
   - Type-safe mutation mocks
   - Reusable mock creation
   - Easy override per test
   - Consistent state flags
   - Complete type coverage

2. **Integration Test Pattern**
   ```typescript
   test('creates new CV with language', async () => {
     // Setup
     const handlers = [
       createGetHandler('/api/cvs'),
       createPutHandler('/api/cvs/de')
     ];

     // Render with routing
     render(<App />, { handlers });

     // Interact and verify
     await user.click(screen.getByText('Create'));
     expect(screen.getByText('Success')).toBeInTheDocument();
   });
   ```
   - Complete feature testing
   - API mock handlers
   - Routing integration
   - User interaction simulation

2. **Unit Test Pattern**
   ```typescript
   test('form handles submission', () => {
     render(
       <DetailedCVForm
         mode="create"
         languageCode={LanguageCode.ENGLISH}
       />
     );
     // Test form behavior
   });
   ```
   - Isolated component testing
   - Required props testing
   - Clear test boundaries
   - Comprehensive coverage
