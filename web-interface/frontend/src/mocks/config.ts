import { generateHandlers } from 'msw-auto-mock';
import { HttpResponse } from 'msw';
import { paths, components } from '../types/api-schema';

type AuthResponse = components['schemas']['AuthResponse'];
type ErrorPayload = { status?: number; message?: string };
type LoadingPayload = { delay?: number };

// Type-safe path helpers
export const API_PATHS = {
  auth: {
    login: '/v1/api/auth/login',
    register: '/v1/api/auth/register',
    refresh: '/v1/api/auth/refresh',
    logout: '/v1/api/auth/logout'
  }
} as const;

export const handlers = generateHandlers<paths>({
  baseUrl: 'http://localhost:3000',
  endpoints: {
    '/v1/api/auth/login': {
      post: {
        success: (data: AuthResponse) => HttpResponse.json(data),
        error: ({ status = 401, message = 'Unauthorized' }: ErrorPayload = {}) =>
          HttpResponse.json(
            { detail: [{ msg: message, type: 'validation_error', loc: ['body'] }] },
            { status }
          ),
        loading: ({ delay = 1000 }: LoadingPayload = {}) =>
          new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
});
