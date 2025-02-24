import { client } from '../../../lib/api/client';
import type {
  JobDescriptionCreate,
  JobDescriptionUpdate,
  JobDescriptionResponse,
  JobsResponse,
} from '../../../lib/api/generated-types';

/**
 * Get all job descriptions, optionally filtered by language
 */
export async function getJobs(language_code = 'en'): Promise<JobsResponse> {
  return client.get(`/jobs?language_code=${language_code}`);
}

/**
 * Get a single job description by ID
 */
export async function getJob(jobId: number): Promise<JobDescriptionResponse> {
  return client.get(`/jobs/${jobId}`);
}

/**
 * Create a new job description
 */
export async function createJob(
  data: JobDescriptionCreate,
): Promise<JobDescriptionResponse> {
  return client.post('/jobs', data);
}

/**
 * Update an existing job description
 */
export async function updateJob(
  jobId: number,
  data: JobDescriptionUpdate,
): Promise<JobDescriptionResponse> {
  return client.put(`/jobs/${jobId}`, data);
}

/**
 * Delete a job description
 */
export async function deleteJob(jobId: number): Promise<void> {
  return client.delete(`/jobs/${jobId}`);
}
