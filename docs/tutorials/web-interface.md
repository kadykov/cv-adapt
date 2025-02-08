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

### Integration Tests

The web interface includes integration tests to verify the interaction between frontend and backend components. These tests focus on critical flows like authentication to ensure everything works together properly.

To run the integration tests:

```bash
# Start the backend in test mode
cd web-interface/backend
TESTING=1 uvicorn app.main:app

# In another terminal, run the tests
cd web-interface/frontend
npm run test:integration
```

The integration test suite covers:
- User registration (success and duplicate email cases)
- User authentication (login with valid/invalid credentials)
- Token management (refresh flow)
- Error handling and validation

Each test ensures proper API interaction and data handling between frontend and backend.

### End-to-End Tests

The project includes E2E tests using Playwright to simulate real user interactions in the browser.

To run E2E tests:

```bash
cd web-interface/frontend
npm run test:e2e
```

For debugging E2E tests:
```bash
npm run test:e2e:debug  # Run tests in debug mode
npm run test:e2e:ui     # Run tests with Playwright UI
```

### Testing Best Practices

1. Integration Testing Strategy:
   - Use `supertest` for API testing
   - Reset database state between tests
   - Test both success and error cases
   - Verify proper token handling
   - Check error responses and validation

2. E2E Testing Strategy:
   - Test complete user flows
   - Verify form submissions
   - Check navigation flows
   - Validate error messages
   - Test responsive design

3. Test Organization:
   - Group tests by feature
   - Use descriptive test names
   - Include setup and teardown
   - Document test prerequisites

4. Running Tests:
   ```bash
   # Using justfile commands
   just test-frontend             # Run unit tests
   just test-frontend-integration # Run integration tests
   just test-frontend-e2e        # Run E2E tests
   just test-frontend-all        # Run all frontend tests

   # Or using npm scripts directly
   npm run test                  # Unit tests
   npm run test:integration      # Integration tests
   npm run test:e2e             # E2E tests
   ```

   The integration tests will automatically start the backend in test mode, run the tests, and clean up afterwards.

## Development Workflow

1. Start both backend and frontend servers
2. Make changes to the code
3. Run relevant tests
4. Check test coverage
5. Update documentation if needed

For more detailed development guidelines and architecture decisions, refer to:
- [Frontend Architecture](../explanation/frontend-architecture.md)
- [API Reference](../reference/api/web.md)
