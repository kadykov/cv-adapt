import type { JobDescriptionCreate, JobDescriptionResponse, JobDescriptionUpdate } from '../../../types/api';

// API endpoint base URL would typically come from environment config
const JOBS_API_BASE = '/api/jobs';

export const jobsApi = {
  /**
   * Get all job descriptions
   */
  async getJobs(): Promise<JobDescriptionResponse[]> {
    const response = await fetch(JOBS_API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch jobs');
    }
    return response.json();
  },

  /**
   * Get a single job description by ID
   */
  async getJob(id: number): Promise<JobDescriptionResponse> {
    const response = await fetch(`${JOBS_API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch job');
    }
    return response.json();
  },

  /**
   * Create a new job description
   */
  async createJob(data: JobDescriptionCreate): Promise<JobDescriptionResponse> {
    const response = await fetch(JOBS_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create job');
    }
    return response.json();
  },

  /**
   * Update an existing job description
   */
  async updateJob(id: number, data: JobDescriptionUpdate): Promise<JobDescriptionResponse> {
    const response = await fetch(`${JOBS_API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update job');
    }
    return response.json();
  },

  /**
   * Delete a job description
   */
  async deleteJob(id: number): Promise<void> {
    const response = await fetch(`${JOBS_API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete job');
    }
  }
};
