import { describe, it, expect, beforeAll } from 'vitest';
import { jobsApi } from '../jobsApi';
import { createTestHelpers } from '@/tests/setup';
import type { JobDescriptionResponse } from '@/types/api';

describe('jobsApi integration', () => {
  const { simulateSuccess } = createTestHelpers();

  const mockJobs: JobDescriptionResponse[] = [
    {
      id: 1,
      title: 'Software Engineer',
      description: 'Test description',
      language_code: 'en',
      created_at: new Date().toISOString(),
      updated_at: null
    },
    {
      id: 2,
      title: 'Frontend Developer',
      description: 'Another description',
      language_code: 'en',
      created_at: new Date().toISOString(),
      updated_at: null
    }
  ];

  // Set up initial data
  beforeAll(() => {
    mockJobs.forEach(job => {
      simulateSuccess(`/api/v1/jobs/${job.id}`, 'get', job);
    });
    simulateSuccess('/api/v1/jobs', 'get', mockJobs);
  });

  describe('getJobs', () => {
    it('fetches jobs with correct structure', async () => {
      const jobs = await jobsApi.getJobs();

      expect(jobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining<Partial<JobDescriptionResponse>>({
            id: expect.any(Number),
            title: expect.any(String),
            description: expect.any(String),
            language_code: expect.any(String),
            created_at: expect.any(String)
          })
        ])
      );
    });

    it('returns jobs matching the schema', async () => {
      const jobs = await jobsApi.getJobs();

      // Verify each job has all required fields
      jobs.forEach(job => {
        expect(job).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            title: expect.any(String),
            description: expect.any(String),
            language_code: expect.stringMatching(/^[a-z]{2}$/), // Two-letter language code
            created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) // ISO date format
          })
        );
      });
    });
  });

  describe('getJobById', () => {
    it('fetches a single job with correct structure', async () => {
      const job = await jobsApi.getJobById(1);

      expect(job).toEqual(
        expect.objectContaining<Partial<JobDescriptionResponse>>({
          id: 1,
          title: expect.any(String),
          description: expect.any(String),
          language_code: expect.any(String),
          created_at: expect.any(String)
        })
      );
    });

    it('returns 404 for non-existent job', async () => {
      await expect(jobsApi.getJobById(999)).rejects.toThrow('Job not found');
    });

    it('validates job details match the schema', async () => {
      const job = await jobsApi.getJobById(1);

      // Detailed schema validation
      expect(job).toEqual({
        id: expect.any(Number),
        title: expect.any(String),
        description: expect.any(String),
        language_code: expect.stringMatching(/^[a-z]{2}$/),
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        updated_at: expect.any(String) || null
      });
    });
  });
});
