import { http, HttpResponse } from 'msw';
import type { AuthResponse } from '../../../lib/api/generated-types';
import { mockAuthResponse } from '../../../test/utils/auth-test-utils';

const API_BASE = '/v1/api';

export const authHandlers = [
  // Login handler
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      password: string;
      scope?: string;
      grant_type?: string;
    };

    if (
      body.username === 'test@example.com' &&
      body.password === 'password123'
    ) {
      return HttpResponse.json<AuthResponse>(mockAuthResponse);
    }

    return new HttpResponse(null, {
      status: 401,
      statusText: 'Invalid credentials',
    });
  }),

  // Register handler
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
    };
    return HttpResponse.json({
      ...mockAuthResponse,
      user: {
        ...mockAuthResponse.user,
        email: body.email,
      },
    });
  }),

  // Profile handler
  http.get(`${API_BASE}/auth/profile`, () => {
    return HttpResponse.json(mockAuthResponse.user);
  }),

  // Token refresh handler
  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json<AuthResponse>({
      ...mockAuthResponse,
      access_token: 'new-access-token',
    });
  }),
];
