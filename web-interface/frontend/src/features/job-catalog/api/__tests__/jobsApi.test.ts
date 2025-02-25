import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../lib/test/server';
import { getTestApiUrl } from '../../../../lib/test/url-helper';
import { getJobs, getJob, createJob, updateJob, deleteJob } from '../jobsApi';
import type {
  JobDescriptionCreate,
  JobDescriptionResponse,
} from '../../../../lib/api/generated-types';
import {
  setTestAuthToken,
  clearTestAuthToken,
} from '../../../../lib/test/test-utils-auth';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Frontend Developer',
  description: 'Frontend development role',
  language_code: 'en',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

const unauthorizedError = {
  detail: { message: 'Unauthorized - Invalid or missing token' },
};

const handlers = [
  http.get(getTestApiUrl('/jobs'), ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(unauthorizedError, { status: 401 });
    }
    return HttpResponse.json([mockJob]);
  }),

  http.get(getTestApiUrl('/jobs/:id'), ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(unauthorizedError, { status: 401 });
    }
    return HttpResponse.json(mockJob);
  }),

  http.post(getTestApiUrl('/jobs'), async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(unauthorizedError, { status: 401 });
    }
    const data = (await request.json()) as JobDescriptionCreate;
    const response: JobDescriptionResponse = {
      id: 2,
      title: data.title,
      description: data.description,
      language_code: data.language_code,
      created_at: '2024-02-17T22:00:00Z',
      updated_at: null,
    };
    return HttpResponse.json(response);
  }),

  http.put(getTestApiUrl('/jobs/:id'), ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(unauthorizedError, { status: 401 });
    }
    return HttpResponse.json({
      ...mockJob,
      title: 'Updated Title',
      updated_at: '2024-02-17T23:00:00Z',
    } satisfies JobDescriptionResponse);
  }),

  http.delete(getTestApiUrl('/jobs/:id'), ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(unauthorizedError, { status: 401 });
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

describe('jobsApi', () => {
  beforeEach(() => {
    clearTestAuthToken();
    server.use(...handlers);
  });

  afterEach(() => {
    clearTestAuthToken();
  });

  describe('getJobs', () => {
    it('fetches jobs successfully with auth token', async () => {
      setTestAuthToken();
      const jobs = await getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toEqual(mockJob);
    });

    it('fails without auth token', async () => {
      await expect(getJobs()).rejects.toThrow(/unauthorized/i);
    });
  });

  describe('getJob', () => {
    it('fetches single job successfully', async () => {
      setTestAuthToken();
      const job = await getJob(1);
      expect(job).toEqual(mockJob);
    });

    it('fails to fetch single job without auth token', async () => {
      await expect(getJob(1)).rejects.toThrow(/unauthorized/i);
    });
  });

  describe('createJob', () => {
    const newJob: JobDescriptionCreate = {
      title: 'New Position',
      description: 'Role description',
      language_code: 'en',
    };

    it('creates job successfully', async () => {
      setTestAuthToken();
      const job = await createJob(newJob);
      expect(job).toEqual(expect.objectContaining(newJob));
    });

    it('fails to create job without auth token', async () => {
      await expect(createJob(newJob)).rejects.toThrow(/unauthorized/i);
    });
  });

  describe('updateJob', () => {
    const updates = {
      title: 'Updated Title',
    };

    it('updates job successfully', async () => {
      setTestAuthToken();
      const job = await updateJob(1, updates);
      expect(job.title).toBe(updates.title);
    });

    it('fails to update job without auth token', async () => {
      await expect(updateJob(1, updates)).rejects.toThrow(/unauthorized/i);
    });
  });

  describe('deleteJob', () => {
    it('deletes job successfully', async () => {
      setTestAuthToken();
      await expect(deleteJob(1)).resolves.not.toThrow();
    });

    it('fails to delete job without auth token', async () => {
      await expect(deleteJob(1)).rejects.toThrow(/unauthorized/i);
    });
  });
});
