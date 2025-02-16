import { vi } from 'vitest';
import type { JobService } from '../types/services/job-service';
import type { DetailedCVService } from '../types/services/cv-service';
import { BaseService } from '../types/services/base-service';
import { createSuccessResponse, createErrorResponse } from './helpers';
import { builders } from './index';

export const mockData = {
  job: (overrides = {}) => builders.job(overrides),
  cv: (languageCode = 'en', overrides = {}) => builders.cv(languageCode, overrides)
};

// Mock API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

// Base error handling function
const mockHandleError = (error: unknown): never => {
  throw error;
};

// Mock Base Service
abstract class MockBaseService extends BaseService {
  // Use a concrete implementation that matches the base class
  protected handleError(error: unknown): never {
    return mockHandleError(error);
  }

  protected validate = vi.fn().mockImplementation((data: any) => data);

  constructor() {
    super(mockApiClient);
  }
}

// Mock Job Service
class MockJobService extends MockBaseService implements JobService {
  private jobs: ReturnType<typeof mockData.job>[];

  constructor(jobs: ReturnType<typeof mockData.job>[] = []) {
    super();
    this.jobs = [...jobs];

    this.getJobs = vi.fn().mockImplementation(this.getJobs.bind(this));
    this.getJobById = vi.fn().mockImplementation(this.getJobById.bind(this));
    this.createJob = vi.fn().mockImplementation(this.createJob.bind(this));
    this.updateJob = vi.fn().mockImplementation(this.updateJob.bind(this));
    this.deleteJob = vi.fn().mockImplementation(this.deleteJob.bind(this));
  }

  async getJobs(languageCode?: string) {
    const filteredJobs = languageCode
      ? this.jobs.filter(job => job.language_code === languageCode)
      : this.jobs;
    return createSuccessResponse(filteredJobs);
  }

  async getJobById(id: number) {
    const job = this.jobs.find(j => j.id === id);
    if (!job) {
      return this.handleError(new Error('Job not found'));
    }
    return createSuccessResponse(job);
  }

  async createJob(jobData: any) {
    const newJob = {
      ...mockData.job(),
      ...jobData,
      id: Math.max(0, ...this.jobs.map(j => j.id)) + 1
    };
    this.jobs.push(newJob);
    return createSuccessResponse(newJob);
  }

  async updateJob(id: number, jobData: any) {
    const index = this.jobs.findIndex(j => j.id === id);
    if (index === -1) {
      return this.handleError(new Error('Job not found'));
    }
    const updatedJob = { ...this.jobs[index], ...jobData };
    this.jobs[index] = updatedJob;
    return createSuccessResponse(updatedJob);
  }

  async deleteJob(id: number): Promise<void> {
    const index = this.jobs.findIndex(j => j.id === id);
    if (index === -1) {
      return this.handleError(new Error('Job not found'));
    }
    this.jobs.splice(index, 1);
  }
}

// Mock CV Service
class MockDetailedCVService extends MockBaseService implements DetailedCVService {
  private cvs: ReturnType<typeof mockData.cv>[];

  constructor(cvs: ReturnType<typeof mockData.cv>[] = []) {
    super();
    this.cvs = [...cvs];

    this.getAllDetailedCVs = vi.fn().mockImplementation(this.getAllDetailedCVs.bind(this));
    this.getDetailedCVByLanguage = vi.fn().mockImplementation(this.getDetailedCVByLanguage.bind(this));
    this.upsertDetailedCV = vi.fn().mockImplementation(this.upsertDetailedCV.bind(this));
    this.deleteDetailedCV = vi.fn().mockImplementation(this.deleteDetailedCV.bind(this));
    this.setPrimaryCv = vi.fn().mockImplementation(this.setPrimaryCv.bind(this));
  }

  async getAllDetailedCVs() {
    return createSuccessResponse(this.cvs);
  }

  async getDetailedCVByLanguage(languageCode: string) {
    const cv = this.cvs.find(c => c.language_code === languageCode);
    if (!cv) {
      return this.handleError(new Error('CV not found'));
    }
    return createSuccessResponse(cv);
  }

  async upsertDetailedCV(languageCode: string, cvData: any) {
    const existingIndex = this.cvs.findIndex(c => c.language_code === languageCode);
    const newCV = {
      ...mockData.cv(languageCode),
      ...cvData,
      language_code: languageCode
    };

    if (existingIndex === -1) {
      this.cvs.push(newCV);
    } else {
      this.cvs[existingIndex] = newCV;
    }

    return createSuccessResponse(newCV);
  }

  async deleteDetailedCV(languageCode: string): Promise<void> {
    const index = this.cvs.findIndex(c => c.language_code === languageCode);
    if (index === -1) {
      return this.handleError(new Error('CV not found'));
    }
    this.cvs.splice(index, 1);
  }

  async setPrimaryCv(languageCode: string) {
    const cv = this.cvs.find(c => c.language_code === languageCode);
    if (!cv) {
      return this.handleError(new Error('CV not found'));
    }

    this.cvs.forEach(c => {
      c.is_primary = c.language_code === languageCode;
    });

    return createSuccessResponse(cv);
  }
}

export function createMockJobService(jobs: ReturnType<typeof mockData.job>[] = []): JobService {
  return new MockJobService(jobs);
}

export function createMockDetailedCVService(cvs: ReturnType<typeof mockData.cv>[] = []): DetailedCVService {
  return new MockDetailedCVService(cvs);
}

// Helper to generate test data
export function generateTestData(numJobs = 3, numCVs = 2) {
  const jobs = Array.from({ length: numJobs }, (_, i) =>
    mockData.job({
      id: i + 1,
      title: `Job ${i + 1}`,
      language_code: i % 2 === 0 ? 'en' : 'fr'
    })
  );

  const cvs = Array.from({ length: numCVs }, (_, i) =>
    mockData.cv(i % 2 === 0 ? 'en' : 'fr', {
      id: i + 1,
      is_primary: i === 0
    })
  );

  return { jobs, cvs };
}

export const mockApiMethods = {
  get: mockApiClient.get,
  post: mockApiClient.post,
  put: mockApiClient.put,
  delete: mockApiClient.delete
};
