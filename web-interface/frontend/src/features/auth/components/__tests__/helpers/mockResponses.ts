import { http, type HttpHandler } from 'msw';
import type { components } from '@/types/api-schema';

type AuthResponse = components['schemas']['AuthResponse'];

export const mockAuthResponse: AuthResponse = {
  access_token: 'mock_token',
  refresh_token: 'mock_refresh',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'test@example.com',
    created_at: new Date().toISOString()
  }
};

export const createSimpleMockHandlers = () => ({
  loading: (): HttpHandler =>
    http.post('/v1/api/auth/login', () => {
      // Never resolve to maintain loading state
      return new Promise(() => {});
    }),

  error: (message: string = 'An error occurred', status: number = 401): HttpHandler =>
    http.post('/v1/api/auth/login', () => {
      if (status === 0) {
        // Network error simulation
        return new Response(null, { status: 0 });
      }
      return new Response(
        JSON.stringify({ message }),
        {
          status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }),

  success: (data: AuthResponse = mockAuthResponse): HttpHandler =>
    http.post('/v1/api/auth/login', () => {
      return Promise.resolve(
        new Response(
          JSON.stringify(data),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      );
    })
});
