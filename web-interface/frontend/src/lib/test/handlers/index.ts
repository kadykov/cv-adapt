import { http, HttpResponse } from 'msw';
import { mockAuthResponse, mockUser } from '../../../features/auth/testing/fixtures';
import type { JobDescriptionResponse } from '../../../features/job-catalog/api/types';

const API_PREFIX = '/v1/api';

// Mock job data
const mockJobEn: JobDescriptionResponse = {
  id: 1,
  title: 'Frontend Developer',
  description: 'Frontend development role',
  language_code: 'en',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

const mockJobFr: JobDescriptionResponse = {
  id: 2,
  title: 'Développeur Frontend',
  description: 'Rôle de développement frontend',
  language_code: 'fr',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

// Use English job as default for single-job responses
const mockJob = mockJobEn;

export const handlers = [
  // Job handlers
  http.get(`${API_PREFIX}/jobs`, ({ request }) => {
    const url = new URL(request.url);
    const languageCode = url.searchParams.get('language_code') || 'en';
    if (languageCode === 'fr') {
      return HttpResponse.json([mockJobFr]);
    }
    // Default to English job
    return HttpResponse.json([mockJobEn]);
  }),

  http.get(`${API_PREFIX}/jobs/:id`, () => {
    return HttpResponse.json(mockJob);
  }),

  http.post(`${API_PREFIX}/jobs`, async ({ request }) => {
    const body = await request.json() as JobDescriptionResponse;
    return HttpResponse.json({ ...mockJob, ...body });
  }),

  http.put(`${API_PREFIX}/jobs/:id`, async ({ request }) => {
    const body = await request.json() as JobDescriptionResponse;
    return HttpResponse.json({ ...mockJob, ...body });
  }),

  http.delete(`${API_PREFIX}/jobs/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Auth handlers
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
