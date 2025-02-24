import { http, HttpResponse, delay } from 'msw';
import type { DefaultBodyType, PathParams } from 'msw';
import type { Job } from '../types';

const mockJobs: Job[] = [
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Full stack developer position',
    language_code: 'en',
    created_at: '2024-02-23T10:00:00Z',
    updated_at: '2024-02-23T10:00:00Z',
  },
  {
    id: 2,
    title: 'Frontend Developer',
    description: 'React specialist needed',
    language_code: 'en',
    created_at: '2024-02-23T11:00:00Z',
    updated_at: '2024-02-23T11:00:00Z',
  },
];

export const jobsIntegrationHandlers = [
  http.get('/v1/api/jobs', async ({ request }) => {
    // Add delay to ensure loading states are visible
    await delay(150);

    // Check for auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(mockJobs);
  }),

  http.get<PathParams, DefaultBodyType>(
    '/v1/api/jobs/:id',
    async ({ params, request }) => {
      await delay(150);

      // Check for auth header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new HttpResponse(null, { status: 401 });
      }

      const job = mockJobs.find((j) => j.id === Number(params.id));

      if (!job) {
        return HttpResponse.json({ message: 'Job not found' }, { status: 404 });
      }

      return HttpResponse.json(job);
    },
  ),
];
