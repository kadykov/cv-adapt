import { createHandler, createErrorHandlers } from './create-handler';
import { TEST_PATHS, type AuthResponse } from '../../types/api-utils';

const { login, register, refresh } = TEST_PATHS.auth;

// Mock data factory function
const createMockAuthData = (): AuthResponse => ({
  user: {
    id: 1,
    email: 'user@example.com',
    created_at: new Date().toISOString(),
    personal_info: {} // Empty object as per schema
  },
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  token_type: 'bearer'
});

// Create handlers with auto-validation
const successHandlers = [
  createHandler({
    path: login,
    method: 'POST',
    mockData: createMockAuthData()
  }),

  createHandler({
    path: register,
    method: 'POST',
    mockData: createMockAuthData()
  }),

  createHandler({
    path: refresh,
    method: 'POST',
    mockData: createMockAuthData()
  })
];

// Create error handlers for each path
const errorHandlers = [login, register, refresh].flatMap(path => createErrorHandlers(path));

export const authHandlers = [...successHandlers, ...errorHandlers];
