# Frontend Architecture

## Overview

The CV-Adapt frontend is built with Astro and React, focusing on type safety, performance, and maintainability. This document outlines the frontend architecture and implementation details for the web interface.

## Core Architecture

### Technology Stack
- **Astro**: Main framework providing partial hydration and SSG capabilities
- **React**: For interactive components
- **TypeScript**: For type safety across the application
- **Tailwind CSS + DaisyUI**: For styling and component design
- **Zod**: For runtime validation

### Project Structure
```
src/
├── features/           # Feature-based modules
│   ├── auth/          # Authentication feature
│   ├── cv-management/ # CV Management feature
│   ├── job-catalog/   # Job Description feature
│   └── cv-generation/ # CV Generation feature
├── shared/            # Shared utilities and components
├── api/              # API client and shared API functions
│   ├── client.ts    # Base API client with auth handling
│   └── types.ts     # API type definitions
├── types/            # Generated TypeScript types
└── validation/       # Zod schemas
```

### API Layer Architecture

The frontend API layer is organized into three main components that provide a standardized interface for backend API interactions:

#### 1. API Configuration (api-config.ts)

Centralizes API configuration and type definitions:

```typescript
interface ApiConfig {
  baseUrl: string;
  version: string;
  authTokenKey: string;
  getFullUrl: () => string;
}

type RequestOptions = {
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
} & Omit<RequestInit, "headers">;
```

Key features:
- Environment-based configuration
- Type definitions for request options
- Centralized API endpoint management
- Version control for API endpoints

#### 2. API Client (api-client.ts)

Implements a singleton client for handling API requests:

```typescript
class ApiClient {
  private static instance: ApiClient;

  // HTTP methods with type safety
  async get<T>(path: string, options?: RequestOptions): Promise<T>;
  async post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T>;
  async put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T>;
  async delete(path: string, options?: RequestOptions): Promise<void>;

  // Private helper methods
  private getAuthToken(): string | null;
  private getHeaders(options: RequestOptions): HeadersInit;
  private handleResponse<T>(response: Response): Promise<T>;
  private getFullUrl(path: string): string;
}
```

Key features:
- Singleton pattern for consistent instance management
- Type-safe request/response handling
- Automatic auth token injection
- URL path normalization
- Flexible request options
- Support for auth and non-auth requests

#### 3. API Error Handling (api-error.ts)

Provides standardized error handling:

```typescript
class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: unknown);

  static fromResponse(response: Response, data?: unknown): ApiError;
  static fromError(error: unknown): ApiError;
}
```

Key features:
- Standardized error format
- HTTP status code support
- Error response data preservation
- Conversion utilities for different error types
- Consistent error handling across the application

The API layer provides several benefits:
- Centralized configuration management
- Consistent error handling
- Type-safe request/response handling
- Standardized request formatting
- Authentication token management
- Request option flexibility

### Feature Module Structure
Each feature module follows a consistent structure:
```
feature-name/
├── components/   # React components
├── api/         # Feature-specific API calls using base client
│   ├── types.ts # Feature-specific API types
│   └── api.ts   # API function implementations
├── types/       # Feature-specific types
├── utils/       # Feature-specific utilities
└── validation/  # Feature-specific validation
```

## Implementation Details

### 1. Authentication UI

#### Components
- `LoginForm`: User login interface
  - Email/password inputs with Zod validation
  - Unified error handling and feedback
  - "Remember me" functionality
  - Protected route redirection after login
  - Integration with OpenAPI schemas
- `RegisterForm`: User registration
  - Extended password validation with regex patterns
  - Terms acceptance with type-safe validation
  - Success/error feedback with specific messages
- `ProtectedRoute`: React component for authenticated routes
  - Automatic redirect to login if not authenticated
  - Loading states during auth check
  - Integrated with router configuration
- `Layout`: Application shell with auth-aware navigation
  - Conditional rendering based on auth state
  - Login/Logout navigation
  - Responsive header and footer
- `AuthProvider`: Context for auth state management
  - JWT token management with refresh handling
  - User session persistence
  - Type-safe API integration with OpenAPI schemas

#### Authentication Flow
```typescript
// Generated from OpenAPI schemas
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Zod validation schemas
const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

// Protected routing configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'login',
        element: <LoginForm />,
      },
      {
        path: 'jobs',
        element: (
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        ),
      }
    ],
  },
]);

// API Integration with error handling
const handleAuthResponse = async (response: Response): Promise<AuthResponse> => {
  if (!response.ok) {
    let errorMessage = "Authentication failed";
    try {
      const errorData = await response.json();
      if (response.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'object'
          ? errorData.detail.message || "Authentication failed"
          : errorData.detail;
      }
      throw new AuthenticationError(errorMessage, response.status, errorData);
    } catch (e) {
      console.log('Failed to parse error response:', e);
      throw new AuthenticationError(
        response.statusText || "An unexpected error occurred",
        response.status
      );
    }
  }
  const data = await response.json();
  return authResponseSchema.parse(data);
};
```

### 2. API Integration Pattern

Each feature module follows a consistent pattern for API integration:

```typescript
// Feature-specific API functions
export const featureApi = {
  // GET requests
  getItems: () => apiClient.get<Item[]>('/items'),

  // POST requests with data
  createItem: (data: CreateItemDto) =>
    apiClient.post<Item>('/items', data),

  // PUT requests for updates
  updateItem: (id: number, data: UpdateItemDto) =>
    apiClient.put<Item>(`/items/${id}`, data),

  // DELETE requests
  deleteItem: (id: number) =>
    apiClient.delete(`/items/${id}`)
};

// Type definitions
interface CreateItemDto {
  // ...
}

interface UpdateItemDto {
  // ...
}

// Usage in components
const ItemList = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    featureApi.getItems()
      .then(setItems)
      .catch(handleError);
  }, []);
  // ...
};
```

### 2. CV Management Interface

#### Components
- `CVList`: Overview of user's CVs
  - Language-based grouping
  - Primary CV indication
  - Quick actions
- `CVEditor`: CV editing interface
  - Rich text editing
  - Section management
  - Real-time validation
- `LanguageSelector`: Language selection
  - Supported languages list
  - Primary language setting
- `AutoSave`: Auto-save functionality
  - Periodic saves
  - Dirty state tracking
  - Save status indication

#### Data Flow
```typescript
interface CVState {
  currentCV: DetailedCV | null;
  isEditing: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
}

interface CVContext extends CVState {
  saveCV: () => Promise<void>;
  createCV: (language: string) => Promise<void>;
  updateCV: (data: Partial<DetailedCV>) => Promise<void>;
  setPrimaryCV: (id: number) => Promise<void>;
}
```

### 3. Job Description Catalog

#### Components
- `JobList`: Job listings view
  - Filtering and search
  - Language-based views
  - Ranking indicators
- `JobDetail`: Detailed job view
  - Full description
  - Match scoring
  - Action buttons
- `JobForm`: Create/edit form
  - Title and description
  - Language selection
  - Validation

#### State Management
```typescript
interface JobState {
  jobs: JobDescription[];
  filters: JobFilters;
  selectedJob: JobDescription | null;
}

interface JobFilters {
  language: string | null;
  searchTerm: string;
  sortBy: 'date' | 'relevance';
}
```

### 4. CV Generation Flow

#### Components
- `GenerationForm`: Generation options
  - Job selection
  - Language options
  - Format selection
- `GenerationProgress`: Progress tracking
  - Status indication
  - Error handling
  - Cancel option
- `PreviewPanel`: Result preview
  - Generated CV display
  - Export options
  - Edit capabilities

#### Process Flow
```typescript
interface GenerationState {
  status: 'idle' | 'generating' | 'complete' | 'error';
  progress: number;
  result: GeneratedCV | null;
  error: Error | null;
}

interface GenerationOptions {
  detailedCvId: number;
  jobDescriptionId: number;
  outputLanguage: string;
  format: 'pdf' | 'docx' | 'html';
}
```

### 5. Local Storage & Offline Support

#### Storage Structure
```typescript
interface LocalStorage {
  auth: {
    token: string;
    refreshToken: string;
  };
  user: {
    profile: UserProfile;
    preferences: UserPreferences;
  };
  cvs: {
    [language: string]: DetailedCV;
  };
  jobs: {
    recent: JobDescription[];
    drafts: JobDescription[];
  };
  generated: {
    recent: GeneratedCV[];
    pending: GenerationRequest[];
  };
}
```

#### Sync Strategy
1. **Background Sync**
   - Periodic sync attempts
   - Queue-based operation handling
   - Conflict resolution

2. **Offline Support**
   - Operation queueing
   - Optimistic updates
   - Status indicators

3. **Cache Management**
   - TTL-based invalidation
   - Priority-based storage
   - Size-based cleanup

## Performance Optimization

### 1. Code Splitting
- Route-based splitting
- Feature-based chunks
- Dynamic imports for heavy components

### 2. Caching Strategy
- API response caching
- Asset caching
- State persistence

### 3. Loading States
- Skeleton loading
- Progressive enhancement
- Optimistic updates

## Testing Strategy

### 1. Unit Tests
- Component testing
- Utility function testing
- State management testing

### 2. Integration Tests
- Feature flow testing
- API integration testing
- State transitions

### 3. E2E Tests
- Critical user flows
- Authentication flows
- Generation processes

### 4. Performance Tests
- Load time metrics
- Memory usage
- Network efficiency

## Development Guidelines

### 1. Component Development
- Use TypeScript for all components
- Implement proper prop validation
- Add accessibility attributes
- Include loading/error states

### 2. State Management
- Use React Context for shared state
- Implement proper typings
- Handle edge cases
- Include error boundaries

### 3. API Integration
- Use generated types
- Implement proper error handling
- Add retry mechanisms
- Include timeout handling

## Deployment Considerations

### 1. Build Process
- Optimize asset bundling
- Implement proper chunking
- Configure CDN integration
- Enable compression

### 2. Monitoring
- Error tracking
- Performance monitoring
- User analytics
- API metrics

### 3. Updates
- Progressive rollouts
- Versioning strategy
- Cache invalidation
- Fallback mechanisms
