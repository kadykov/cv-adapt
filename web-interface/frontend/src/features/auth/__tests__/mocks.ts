import { http, HttpResponse } from 'msw';
import { mockAuthResponse, mockUser } from '../test-utils.tsx';

export const authHandlers = [
  http.post('/v1/api/auth/register', async ({ request }) => {
    const data = (await request.json()) as { email: string; password: string };
    if (data?.email === 'exists@example.com') {
      return new HttpResponse(
        JSON.stringify({
          detail: {
            message: 'Email already registered',
            code: 'EMAIL_EXISTS',
          },
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    return HttpResponse.json(mockAuthResponse);
  }),

  http.post('/v1/api/auth/login', async () => {
    return HttpResponse.json(mockAuthResponse);
  }),

  http.post('/v1/api/auth/refresh', async ({ request }) => {
    const data = await request.json() as { token: string };
    if (data.token === 'invalid-refresh-token') {
      return new HttpResponse(
        JSON.stringify({
          detail: { message: 'Invalid refresh token' },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    return HttpResponse.json(mockAuthResponse);
  }),

  http.get('/v1/api/users/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new HttpResponse(
        JSON.stringify({
          detail: { message: 'Unauthorized' },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    return HttpResponse.json(mockUser);
  }),
];
