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
├── api/              # API client functions
├── types/            # Generated TypeScript types
└── validation/       # Zod schemas
```

### Feature Module Structure
Each feature module follows a consistent structure:
```
feature-name/
├── components/   # React components
├── api/         # Feature-specific API calls
├── types/       # Feature-specific types
├── utils/       # Feature-specific utilities
└── validation/  # Feature-specific validation
```

## Implementation Details

### 1. Authentication UI

#### Components
- `LoginForm`: User login interface
  - Email/password inputs with validation
  - Error handling and feedback
  - "Remember me" functionality
- `RegisterForm`: User registration
  - Email/password validation
  - Terms acceptance
  - Success/error feedback
- `ProtectedRoute`: HOC for authenticated routes
  - Redirect to login if not authenticated
  - Loading states during auth check
- `AuthProvider`: Context for auth state
  - JWT token management
  - User session handling

#### State Management
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContext extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
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
