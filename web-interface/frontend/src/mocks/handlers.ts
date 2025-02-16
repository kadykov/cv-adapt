import { http, type HttpResponse } from 'msw';
import type { components } from '../types/api-schema';

type AuthResponse = components['schemas']['AuthResponse'];

// Base handlers for testing purposes
const loginHandlers = {
  success: (response: AuthResponse) => {
    return http.post('/v1/api/auth/login', () => {
      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  },
  error: ({ status = 401, message = 'Unauthorized' }) => {
    return http.post('/v1/api/auth/login', () => {
      return new Response(
        JSON.stringify({
          detail: [{ msg: message, type: 'validation_error', loc: ['body'] }]
        }),
        {
          status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  },
  loading: ({ delay = 1000 } = {}) => {
    return http.post('/v1/api/auth/login', async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return new Response(
        JSON.stringify({ status: 'pending' }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  }
};

// Feature-grouped handlers for test usage
export const handlers = {
  auth: {
    login: loginHandlers
  }
};

// Default handlers array for MSW server setup
export const defaultHandlers = [
  // Add initial success handlers for each endpoint
  loginHandlers.success({
    access_token: 'default_token',
    refresh_token: 'default_refresh',
    token_type: 'bearer',
    user: {
      id: 1,
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      personal_info: {}
    }
  })
];
