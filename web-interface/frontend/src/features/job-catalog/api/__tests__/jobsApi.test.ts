import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type {
  JobDescriptionResponse,
  JobDescriptionCreate,
  JobDescriptionUpdate
} from '../types';
import { getJobs, getJob, createJob, updateJob, deleteJob } from '../jobsApi';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Full-stack developer role',
  language_code: 'en',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

const server = setupServer(
  // GET /jobs
  http.get('/v1/api/jobs', ({ request }) => {
    const url = new URL(request.url);
    const languageCode = url.searchParams.get('language_code') || 'en';
    return HttpResponse.json([{ ...mockJob, language_code: languageCode }]);
  }),

  // GET /jobs/:id
  http.get('/v1/api/jobs/:id', () => {
    return HttpResponse.json(mockJob);
  }),

  // POST /jobs
  http.post('/v1/api/jobs', async ({ request }) => {
    const body = await request.json() as JobDescriptionCreate;
    return HttpResponse.json({
      ...mockJob,
      ...body,
    });
  }),

  // PUT /jobs/:id
  http.put('/v1/api/jobs/:id', async ({ request }) => {
    const body = await request.json() as JobDescriptionUpdate;
    return HttpResponse.json({
      ...mockJob,
      ...body,
    });
  }),

  // DELETE /jobs/:id
  http.delete('/v1/api/jobs/:id', () => {
    return new HttpResponse(null, { status: 204 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('jobsApi', () => {
  describe('getJobs', () => {
    it('fetches jobs successfully', async () => {
      const jobs = await getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toEqual(mockJob);
    });

    it('handles language filter', async () => {
      const jobs = await getJobs('fr');
      expect(jobs[0].language_code).toBe('fr');
    });

    it('handles error response', async () => {
      server.use(
        http.get('/v1/api/jobs', () => {
          return HttpResponse.json(
            { detail: { message: 'Server error' } },
            { status: 500 }
          );
        })
      );

      await expect(getJobs()).rejects.toThrow('Server error');
    });
  });

  describe('getJob', () => {
    it('fetches a single job successfully', async () => {
      const job = await getJob(1);
      expect(job).toEqual(mockJob);
    });

    it('handles 404 response', async () => {
      server.use(
        http.get('/v1/api/jobs/:id', () => {
          return HttpResponse.json(
            { detail: { message: 'Job not found' } },
            { status: 404 }
          );
        })
      );

      await expect(getJob(999)).rejects.toThrow('Job not found');
    });
  });

  describe('createJob', () => {
    const newJob = {
      title: 'New Position',
      description: 'Role description',
      language_code: 'en',
    };

    it('creates a job successfully', async () => {
      const job = await createJob(newJob);
      expect(job).toEqual(expect.objectContaining(newJob));
    });

    it('handles validation error', async () => {
      server.use(
        http.post('/v1/api/jobs', () => {
          return HttpResponse.json(
            { detail: { message: 'Invalid data' } },
            { status: 422 }
          );
        })
      );

      await expect(createJob(newJob)).rejects.toThrow('Invalid data');
    });
  });

  describe('updateJob', () => {
    const updates = {
      title: 'Updated Title',
    };

    it('updates a job successfully', async () => {
      const job = await updateJob(1, updates);
      expect(job.title).toBe(updates.title);
    });

    it('handles not found error', async () => {
      server.use(
        http.put('/v1/api/jobs/:id', () => {
          return HttpResponse.json(
            { detail: { message: 'Job not found' } },
            { status: 404 }
          );
        })
      );

      await expect(updateJob(999, updates)).rejects.toThrow('Job not found');
    });
  });

  describe('deleteJob', () => {
    it('deletes a job successfully', async () => {
      await expect(deleteJob(1)).resolves.toBeUndefined();
    });

    it('handles not found error', async () => {
      server.use(
        http.delete('/v1/api/jobs/:id', () => {
          return HttpResponse.json(
            { detail: { message: 'Job not found' } },
            { status: 404 }
          );
        })
      );

      await expect(deleteJob(999)).rejects.toThrow('Job not found');
    });
  });
});
