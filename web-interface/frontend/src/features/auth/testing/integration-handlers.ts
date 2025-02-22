import { HttpResponse, http } from 'msw';

const mockUserData = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-02-21T12:00:00Z',
};

const mockAuthData = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user: mockUserData,
};

export const authIntegrationHandlers = [
  http.post('/v1/api/auth/login', async ({ request }) => {
    const formData = new URLSearchParams(await request.text());
    const username = formData.get('username');
    const password = formData.get('password');
    const grantType = formData.get('grant_type');

    if (
      username === 'test@example.com' &&
      password === 'password123' &&
      grantType === 'password'
    ) {
      return HttpResponse.json(mockAuthData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new HttpResponse(JSON.stringify({ detail: 'Invalid credentials' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),

  http.get('/v1/api/users/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('mock-access-token')) {
      return HttpResponse.json(mockUserData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    return new HttpResponse(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),

  http.post('/v1/api/auth/logout', () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.post('/v1/api/auth/refresh', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('Bearer')) {
      return HttpResponse.json(mockAuthData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    return new HttpResponse(
      JSON.stringify({ detail: 'Invalid refresh token' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }),
];
