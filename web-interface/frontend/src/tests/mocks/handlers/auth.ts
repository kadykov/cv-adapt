import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/v1';

interface RegisterRequestBody {
  email: string;
  password: string;
}

interface RefreshTokenRequestBody {
  token: string;
}

export const authHandlers = [
  // Login handler
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    if (username === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: new Date().toISOString()
        }
      });
    }

    return new HttpResponse(
      JSON.stringify({ message: 'Invalid credentials' }),
      { status: 401 }
    );
  }),

  // Register handler
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as RegisterRequestBody;

    if (body.email === 'existing@example.com') {
      return new HttpResponse(
        JSON.stringify({
          detail: {
            message: 'Email already registered',
            code: 'EMAIL_EXISTS',
            field: 'email'
          }
        }),
        { status: 400 }
      );
    }

    return HttpResponse.json({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      token_type: 'bearer',
      user: {
        id: 1,
        email: body.email,
        created_at: new Date().toISOString()
      }
    });
  }),

  // Refresh token handler
  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as RefreshTokenRequestBody;

    if (body.token === 'mock_refresh_token') {
      return HttpResponse.json({
        access_token: 'new_mock_access_token',
        refresh_token: 'new_mock_refresh_token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: new Date().toISOString()
        }
      });
    }

    return new HttpResponse(
      JSON.stringify({ message: 'Invalid refresh token' }),
      { status: 401 }
    );
  }),

  // Logout handler
  http.post(`${API_URL}/auth/logout`, () => {
    return new HttpResponse(null, { status: 200 });
  })
];
