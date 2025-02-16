import { ApiError } from '../core/ApiError';

import {
  JobDescriptionResponse,
  JobDescriptionCreate,
  JobDescriptionUpdate
} from '@/types/api-schema';

export class JobsService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || '';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get all jobs
   */
  async getJobs(): Promise<JobDescriptionResponse[]> {
    const response = await fetch(`${this.apiUrl}/v1/jobs`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  }

  /**
   * Get job by ID
   */
  async getJob(id: number): Promise<JobDescriptionResponse> {
    const response = await fetch(`${this.apiUrl}/v1/jobs/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  }

  /**
   * Create a new job
   */
  async createJob(job: JobDescriptionCreate): Promise<JobDescriptionResponse> {
    const response = await fetch(`${this.apiUrl}/v1/jobs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(job)
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  }

  /**
   * Update an existing job
   */
  async updateJob(id: number, job: JobDescriptionUpdate): Promise<JobDescriptionResponse> {
    const response = await fetch(`${this.apiUrl}/v1/jobs/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(job)
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  }

  /**
   * Delete a job
   */
  async deleteJob(id: number): Promise<void> {
    const response = await fetch(`${this.apiUrl}/v1/jobs/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }
  }
}
