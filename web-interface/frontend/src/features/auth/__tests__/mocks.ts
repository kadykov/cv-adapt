import { http, HttpResponse } from 'msw';
import { mockAuthResponse, mockUser } from '../testing';

const API_PREFIX = '/api';

export const authHandlers = [
  http.post(`${API_PREFIX}/auth/register`, async ({ request }) => {
    const data = await request.json() as { email: string; password: string };
    if (data?.email === 'exists@example.com') {
      return new HttpResponse(
        JSON.stringify({
          message: 'Email already registered',
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

  http.post(`${API_PREFIX}/auth/login`, () => {
    return HttpResponse.json(mockAuthResponse);
  }),

  http.post(`${API_PREFIX}/auth/refresh`, async ({ request }) => {
    const data = await request.json() as { token: string };
    if (data.token === 'invalid-refresh-token') {
      return new HttpResponse(
        JSON.stringify({
          message: 'Invalid refresh token',
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

  http.get(`${API_PREFIX}/users/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    const expectedAuthHeader = `Bearer ${localStorage.getItem('accessToken')}`;
    if (!authHeader || authHeader !== expectedAuthHeader) {
      return new HttpResponse(
        JSON.stringify({
          message: 'Unauthorized',
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
