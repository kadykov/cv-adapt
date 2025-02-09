import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { jobsApi } from '../jobsApi';
import type { JobDescriptionCreate, JobDescriptionResponse, JobDescriptionUpdate } from '../../../../types/api';

describe('jobsApi Integration', () => {
  const mockToken = 'test-token';
  const mockJob: JobDescriptionResponse = {
    id: 1,
    title: 'Test Job',
    description: 'Test Description',
    requirements: ['req1', 'req2'],
    responsibilities: ['resp1', 'resp2'],
    language_code: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', mockToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Authentication Integration', () => {
    it('includes auth token when fetching jobs', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockJob]),
      });

      await jobsApi.getJobs();

      expect(fetch).toHaveBeenCalledWith('/api/jobs', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
      });
    });

    it('handles unauthorized error when fetching jobs', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(jobsApi.getJobs()).rejects.toThrow('Unauthorized');
    });
  });

  describe('CRUD Operations', () => {
    it('creates job with auth token', async () => {
      const newJob: JobDescriptionCreate = {
        title: 'New Job',
        description: 'New Description',
        requirements: ['req1'],
        responsibilities: ['resp1'],
        language_code: 'en',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockJob, ...newJob }),
      });

      await jobsApi.createJob(newJob);

      expect(fetch).toHaveBeenCalledWith('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(newJob),
      });
    });

    it('updates job with auth token', async () => {
      const updateData: JobDescriptionUpdate = {
        title: 'Updated Job',
        description: 'Updated Description',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockJob, ...updateData }),
      });

      await jobsApi.updateJob(1, updateData);

      expect(fetch).toHaveBeenCalledWith('/api/jobs/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(updateData),
      });
    });

    it('deletes job with auth token', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      await jobsApi.deleteJob(1);

      expect(fetch).toHaveBeenCalledWith('/api/jobs/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(jobsApi.getJobs()).rejects.toThrow();
    });

    it('handles validation errors from server', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          message: 'Validation failed',
          errors: ['Title is required'],
        }),
      });

      await expect(jobsApi.createJob({} as JobDescriptionCreate))
        .rejects.toThrow('Validation failed');
    });

    it('handles server errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      });

      await expect(jobsApi.getJob(1)).rejects.toThrow('Internal server error');
    });
  });
});
