# Web Interface Tutorial

This tutorial will walk you through using and developing the web interface for the CV Adapter.

## Running the Web Interface

The web interface consists of a FastAPI backend and an Astro frontend.

### Backend

To run the backend:

```bash
cd web-interface/backend
uvicorn app.main:app --reload
```

The backend will be available at http://localhost:8000

### Frontend

To run the frontend:

```bash
cd web-interface/frontend
npm run dev
```

The frontend will be available at http://localhost:3000

## System Overview

### Backend Architecture
The backend uses FastAPI and follows a layered architecture:
- API routes in `app/api/` - Handle HTTP requests and responses
- Database models in `app/models/` - Define data structure
- Service layer in `app/services/` - Implement business logic

### Frontend Architecture
The frontend is built with Astro and React:
- Components in `src/components/` - Reusable UI elements
- Pages in `src/pages/` - Route-specific views
- API integration in `src/api/` - Backend communication
- Features in `src/features/` - Feature-based modules

For detailed frontend architecture, see [Frontend Architecture](../explanation/frontend-architecture.md).

## Authentication

The web interface implements a complete authentication system with:
- User registration
- Login/logout
- Token-based authentication
- Token refresh mechanism

For implementation details of the auth UI components, refer to the frontend architecture documentation.

## Testing

### Unit and Integration Tests

The web interface uses Vitest for both unit and integration testing. Integration tests verify the interaction between frontend and backend components, focusing on critical flows like authentication to ensure everything works together properly.

To run the tests:

```bash
# Start the backend in test mode
cd web-interface/backend
TESTING=1 uvicorn app.main:app

# In another terminal, run unit tests
cd web-interface/frontend
npm run test

# Run integration tests
npm run test:integration
```

The test suite covers:
- Unit tests for React components and utilities
- Integration tests for API interactions including:
  - User registration (success and duplicate email cases)
  - User authentication (login with valid/invalid credentials)
  - Token management (refresh flow)
  - Error handling and validation

### Testing Best Practices

1. Integration Testing Strategy:
   - Use Vitest for all testing needs
   - Reset database state between tests
   - Test both success and error cases
   - Verify proper token handling
   - Check error responses and validation

2. Test Organization:
   - Group tests by feature
   - Use descriptive test names
   - Include setup and teardown
   - Document test prerequisites
   - Separate integration tests with `.integration.test.ts` suffix

3. Running Tests:
   ```bash
   # Using justfile commands
   just test-frontend             # Run unit tests
   just test-frontend-integration # Run integration tests
   just test-frontend-all        # Run all frontend tests

   # Or using npm scripts directly
   npm run test                  # Unit tests
   npm run test:integration      # Integration tests
   ```

   The integration tests will automatically start the backend in test mode, run the tests, and clean up afterwards.

## Development Workflow

1. Start both backend and frontend servers
2. Make changes to the code
3. Run relevant unit and integration tests
4. Check test coverage
5. Update documentation if needed

For more detailed development guidelines and architecture decisions, refer to:
- [Frontend Architecture](../explanation/frontend-architecture.md)
- [API Reference](../reference/api/web.md)
