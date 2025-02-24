import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../lib/test/server';
import type { JobDescriptionResponse } from '../../../../lib/api/generated-types';
import { getJobs, getJob, createJob, updateJob, deleteJob } from '../jobsApi';
import { tokenService } from '../../../auth/services/token-service';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Frontend Developer',
  description: 'Frontend development role',
  language_code: 'en',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

// Mock handlers for the jobs API
const handlers = [
  http.get('/v1/api/jobs', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    // Handle language filter
    const url = new URL(request.url);
    const languageCode = url.searchParams.get('language_code');
    if (languageCode === 'fr') {
      return HttpResponse.json([{ ...mockJob, language_code: 'fr' }]);
    }

    return HttpResponse.json([mockJob]);
  }),

  http.get('/v1/api/jobs/:id', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json(mockJob);
  }),

  http.post('/v1/api/jobs', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    const data = (await request.json()) as Omit<
      JobDescriptionResponse,
      'id' | 'created_at' | 'updated_at'
    >;
    return HttpResponse.json({
      id: 1,
      created_at: '2024-02-17T22:00:00Z',
      updated_at: null,
      ...data,
    } satisfies JobDescriptionResponse);
  }),

  http.put('/v1/api/jobs/:id', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json({ ...mockJob, title: 'Updated Title' });
  }),

  http.delete('/v1/api/jobs/:id', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    return new HttpResponse();
  }),
];

describe('jobsApi', () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(...handlers);
  });

  describe('getJobs', () => {
    it('fetches jobs successfully with auth token', async () => {
      // Setup auth token
      tokenService.storeTokens({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: '2024-02-24T12:00:00Z',
          personal_info: null,
        },
      });

      const jobs = await getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toEqual(mockJob);
    });

    it('handles language filter with auth token', async () => {
      // Setup auth token
      tokenService.storeTokens({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: '2024-02-24T12:00:00Z',
          personal_info: null,
        },
      });

      const jobs = await getJobs('fr');
      expect(jobs[0].language_code).toBe('fr');
    });

    it('fails without auth token', async () => {
      await expect(getJobs()).rejects.toThrow();
    });
  });

  describe('getJob', () => {
    it('fetches a single job successfully with auth token', async () => {
      // Setup auth token
      tokenService.storeTokens({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: '2024-02-24T12:00:00Z',
          personal_info: null,
        },
      });

      const job = await getJob(1);
      expect(job).toEqual(mockJob);
    });

    it('fails to fetch single job without auth token', async () => {
      await expect(getJob(1)).rejects.toThrow();
    });
  });

  describe('createJob', () => {
    const newJob = {
      title: 'New Position',
      description: 'Role description',
      language_code: 'en',
    };

    it('creates a job successfully with auth token', async () => {
      // Setup auth token
      tokenService.storeTokens({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: '2024-02-24T12:00:00Z',
          personal_info: null,
        },
      });

      const job = await createJob(newJob);
      expect(job).toEqual(expect.objectContaining(newJob));
    });

    it('fails to create job without auth token', async () => {
      await expect(createJob(newJob)).rejects.toThrow();
    });
  });

  describe('updateJob', () => {
    const updates = {
      title: 'Updated Title',
    };

    it('updates a job successfully with auth token', async () => {
      // Setup auth token
      tokenService.storeTokens({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: '2024-02-24T12:00:00Z',
          personal_info: null,
        },
      });

      const job = await updateJob(1, updates);
      expect(job.title).toBe(updates.title);
    });

    it('fails to update job without auth token', async () => {
      await expect(updateJob(1, updates)).rejects.toThrow();
    });
  });

  describe('deleteJob', () => {
    it('deletes a job successfully with auth token', async () => {
      // Setup auth token
      tokenService.storeTokens({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: '2024-02-24T12:00:00Z',
          personal_info: null,
        },
      });

      await expect(deleteJob(1)).resolves.toBe('');
    });

    it('fails to delete job without auth token', async () => {
      await expect(deleteJob(1)).rejects.toThrow();
    });
  });
});
