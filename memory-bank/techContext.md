# Technical Context

## Core Technologies

1. **Backend**
   - Python 3.12+
     - Primary development language
     - Modern Python features
     - Strong type hints

   - Pydantic
     - Data validation
     - Serialization/deserialization
     - Type safety enforcement

   - Template Engine
     - Jinja2 for template rendering
     - Custom templates support
     - Language-aware processing

2. **Frontend**
   - React 19+ with TypeScript
     - Modern React features
     - Strict type safety
     - Component architecture

   - State Management
     - React Query for server state
     - Local state with hooks
     - Context for global state

   - UI Components
     - Tailwind CSS
     - DaisyUI components
     - Headless UI

## Development Tools

1. **UV Package Manager**
   - Recommended over pip
   - Faster dependency resolution
   - Better reproducibility

2. **Just**
   - Task runner
   - Development workflow automation
   - Quality checks and testing

## Architecture Components

1. **Application Layer**
   - Core orchestration logic
   - CV generation workflow
   - Component assembly

2. **Models Layer**
   - Domain entities (Pydantic models)
   - Language support
   - Validation rules

3. **Services Layer**
   - Generator services
   - Business logic
   - Template management

4. **Renderers Layer**
   - Output generation
   - Format conversion
   - Template rendering

## Testing & Quality

1. **Backend Testing**
   - PyTest for unit/integration tests
   - Comprehensive test coverage
   - Test fixtures and utilities

2. **Frontend Testing**
   - Vitest test runner
   - React Testing Library
   - MSW for API mocking
   - Contract testing with OpenAPI

3. **Quality Tools**
   - Pre-commit hooks
   - ESLint + TypeScript
   - Prettier formatting
   - Type checking

## Package Management

1. **Backend**
   - UV Package Manager
     - Fast dependency resolution
     - Better reproducibility
     - Lock file support

2. **Frontend**
   - NPM with package-lock.json
     - Strict versioning
     - Dependency auditing
     - Script management

## Documentation

1. **Framework**
   - MkDocs for documentation
   - Diátaxis organization
   - Comprehensive API docs

2. **Structure**
   - Tutorials
   - How-to guides
   - Technical reference
   - Explanation articles

3. **API Documentation**
   - OpenAPI schema
   - Generated types
   - Integration guides
   - Testing documentation
