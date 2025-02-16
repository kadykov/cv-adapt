import { handlers as openApiHandlers } from './openapi-msw';
import { handlers as autoMockHandlers } from '../generated/handlers';
import type { components } from '../../types/api-schema';

type AuthResponse = components['schemas']['AuthResponse'];
type UserResponse = components['schemas']['UserResponse'];

// Re-export the test helpers
export const { createSuccessResponse, createErrorResponse, createLoadingResponse } = openApiHandlers;

// Export the http object for creating new handlers
export const { http } = openApiHandlers;

// Export a function to create test-specific handlers
export function createHandlers() {
  return {
    auth: {
      login: {
        success: (data: AuthResponse) =>
          http.post('/v1/api/auth/login', () => createSuccessResponse(data)),
        error: (status: number, message: string) =>
          http.post('/v1/api/auth/login', () => createErrorResponse(status, message)),
        loading: (delayMs?: number) =>
          http.post('/v1/api/auth/login', async () => await createLoadingResponse(delayMs)),
      },
      register: {
        success: (data: AuthResponse) =>
          http.post('/v1/api/auth/register', () => createSuccessResponse(data)),
        error: (status: number, message: string) =>
          http.post('/v1/api/auth/register', () => createErrorResponse(status, message)),
        loading: (delayMs?: number) =>
          http.post('/v1/api/auth/register', async () => await createLoadingResponse(delayMs)),
      },
    },
    users: {
      me: {
        success: (data: UserResponse) =>
          http.get('/v1/api/users/me', () => createSuccessResponse(data)),
        error: (status: number, message: string) =>
          http.get('/v1/api/users/me', () => createErrorResponse(status, message)),
        loading: (delayMs?: number) =>
          http.get('/v1/api/users/me', async () => await createLoadingResponse(delayMs)),
      },
    },
  };
}

// Export handlers for development mode
export const handlers = [
  // Use auto-generated handlers with random mock data for development
  ...autoMockHandlers,

  // Override specific handlers for development if needed
  // Example:
  // http.post('/v1/api/auth/login', async ({ request }) => {
  //   const data = await request.json();
  //   return createSuccessResponse<AuthResponse>({
  //     access_token: 'dev_token',
  //     refresh_token: 'dev_refresh',
  //     token_type: 'bearer',
  //     user: {
  //       id: 1,
  //       email: data.email,
  //       created_at: new Date().toISOString(),
  //     },
  //   });
  // }),
];
