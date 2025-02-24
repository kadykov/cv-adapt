import { http, HttpResponse } from 'msw';
import type { components } from '../../../lib/api/types';

type UserResponse = components['schemas']['UserResponse'];
type AuthResponse = components['schemas']['AuthResponse'];

const mockUser: UserResponse = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-02-23T10:00:00Z',
  personal_info: null,
};

const mockAuthResponse: AuthResponse = {
  access_token: 'fake_token',
  refresh_token: 'fake_refresh',
  token_type: 'bearer',
  user: mockUser,
};

export const authIntegrationHandlers = [
  http.post('/v1/api/auth/login', async ({ request }) => {
    const body = await request.text();

    // Parse form data
    const formData = new URLSearchParams(body);
    const password = formData.get('password');

    if (password === 'wrongpassword') {
      return HttpResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 },
      );
    }

    return HttpResponse.json(mockAuthResponse);
  }),

  http.post('/v1/api/auth/refresh', () => {
    return HttpResponse.json(mockAuthResponse);
  }),

  http.post('/v1/api/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  // Handle user profile fetch for token validation
  http.get('/v1/api/users/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json(mockUser);
  }),
];
