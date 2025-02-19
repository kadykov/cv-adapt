import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../lib/test/server';
import type { JobDescriptionResponse } from '../../../../lib/api/generated-types';
import { getJobs, getJob, createJob, updateJob, deleteJob } from '../jobsApi';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Frontend Developer',
  description: 'Frontend development role',
  language_code: 'en',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};


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
