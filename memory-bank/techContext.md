# Technical Context

## Core Technologies

1. **Python 3.12+**
   - Primary development language
   - Leverages modern Python features
   - Strong type hints support

2. **Pydantic**
   - Data validation
   - Serialization/deserialization
   - Type safety enforcement

3. **Template Engine**
   - Jinja2 for template rendering
   - Supports custom templates
   - Language-aware processing

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
   - Vitest test runner with MSW integration
   - Generated handlers from OpenAPI schema
   - Type-safe request/response handling
   - Standardized test helpers:
     - simulateSuccess for happy paths
     - simulateError for error states
     - simulateLoading for loading states
   - Consistent test patterns:
     - Component rendering tests
     - User interaction tests
     - API integration tests
     - Error handling tests
     - Loading state tests
   - Contract validation through types
   - Watch mode for development

3. **Quality Tools**
   - Pre-commit hooks
   - Linting and formatting
   - Type checking
   - Contract validation

## Frontend Stack

1. **Core**
   - TypeScript
   - React
   - Vite build tool
   - MSW for API mocking

2. **Testing Tools**
   - Vitest for test execution
   - MSW with generated handlers
   - React Testing Library for DOM testing
   - OpenAPI for contract validation
   - Custom test helpers for common scenarios
   - Type-safe mock data generation

3. **Type Generation**
   - OpenAPI schema as single source of truth
   - TypeScript types generated directly from OpenAPI
   - Contract validation through generated types
   - MSW handlers aligned with schema

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
