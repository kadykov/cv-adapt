import type {
  JobDescriptionCreate,
  JobDescriptionUpdate,
  JobDescriptionResponse,
  JobsResponse,
} from '../../../lib/api/generated-types';

const BASE_URL = '/v1/api/jobs';

/**
 * Get all job descriptions, optionally filtered by language
 */
export async function getJobs(language_code = 'en'): Promise<JobsResponse> {
  const response = await fetch(`${BASE_URL}?language_code=${language_code}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || 'Failed to fetch jobs');
  }

  return response.json();
}

/**
 * Get a single job description by ID
 */
export async function getJob(jobId: number): Promise<JobDescriptionResponse> {
  const response = await fetch(`${BASE_URL}/${jobId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || 'Failed to fetch job');
  }

  return response.json();
}

/**
 * Create a new job description
 */
export async function createJob(
  data: JobDescriptionCreate,
): Promise<JobDescriptionResponse> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || 'Failed to create job');
  }

  return response.json();
}

/**
 * Update an existing job description
 */
export async function updateJob(
  jobId: number,
  data: JobDescriptionUpdate,
): Promise<JobDescriptionResponse> {
  const response = await fetch(`${BASE_URL}/${jobId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || 'Failed to update job');
  }

  return response.json();
}

/**
 * Delete a job description
 */
export async function deleteJob(jobId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${jobId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || 'Failed to delete job');
  }
}
