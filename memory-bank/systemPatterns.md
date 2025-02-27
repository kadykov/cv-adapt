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

2. **Job Management Pattern**
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

2. **Language Management**
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

2. **Feature-Based Organization**
   ```
   features/
     feature-name/
       components/     # Feature-specific components
       hooks/         # Custom hooks
       utils/         # Helper functions
       types.ts      # Feature-specific types
       __tests__/    # Tests organized by type
   ```

2. **Data Flow Pattern**
   ```
   API Schema → Generated Types → Service Layer → React Query → Components
   ```

3. **Testing Pyramid**
   ```
   Contract Tests (API Schema)
         ↓
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

2. **Contract Testing**
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
   - Enum-based language selection
   - Type-safe language code handling
   - Centralized language validation

2. **Smart/Dumb Component Split**
   ```
   Smart Component
     ↓
   Data Fetching/State
     ↓
   Presentational Components
   ```

2. **Composition Pattern**
   - Higher-order components for shared logic
   - Component composition over inheritance
   - Context providers for shared state

3. **Hook Patterns**
   - Custom hooks for reusable logic
   - Query hooks for data fetching
   - Form hooks for validation

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

4. **Frontend Extension Points**
   - Custom form validators
   - Component overrides
   - API interceptors
   - Test helpers

## Performance Patterns

1. **Frontend Optimization**
   - React Query caching
   - Code splitting by feature
   - Lazy loading components
   - Bundle size optimization

2. **Backend Caching**
   - Template caching
   - Language context caching
   - Resource pooling

3. **Lazy Loading**
   - Deferred template loading
   - On-demand resource initialization
   - Route-based code splitting

## Error Handling

1. **Language Validation**
   - Enum-based validation
   - Type-safe language code checks
   - Consistent error messages
   - Cross-component validation rules

2. **Validation Layer**
   - Pydantic model validation
   - Language validation
   - Template validation

2. **Generator Errors**
   - Template rendering errors
   - Context preparation errors
   - Generation failures

3. **Renderer Errors**
   - Format conversion errors
   - Output generation errors
   - Resource access errors
