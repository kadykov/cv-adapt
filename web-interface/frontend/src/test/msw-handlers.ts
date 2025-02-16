import { http, HttpResponse } from 'msw';
import type { z } from 'zod';
import { schemas } from '../types/zod-schemas';
import { mockData } from './service-mocks';
import { mockCVContent } from './mock-data';

// Utility to create a response delay simulation
const ARTIFICIAL_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 1000;

/**
 * Creates a delayed response
 */
async function delay() {
  await new Promise(r => setTimeout(r, ARTIFICIAL_DELAY_MS));
}

/**
 * MSW handlers for job-related endpoints
 */
export const jobHandlers = [
  // Get jobs
  http.get('/api/v1/jobs', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const languageCode = url.searchParams.get('language_code') || 'en';
    const jobs: z.infer<typeof schemas.JobDescriptionResponse>[] = [
      mockData.job(),
      {
        id: 2,
        title: 'Frontend Developer',
        description: 'Test job description',
        language_code: languageCode,
        created_at: new Date().toISOString()
      }
    ];
    return HttpResponse.json(jobs);
  }),

  // Get job by ID
  http.get('/api/v1/jobs/:jobId', async () => {
    await delay();
    const job = mockData.job();
    return HttpResponse.json(job);
  }),

  // Create job
  http.post('/api/v1/jobs', async ({ request }) => {
    await delay();
    const jobData = await request.json() as z.infer<typeof schemas.JobDescriptionCreate>;
    const job: z.infer<typeof schemas.JobDescriptionResponse> = {
      id: 1,
      title: jobData.title,
      description: jobData.description,
      language_code: jobData.language_code,
      created_at: new Date().toISOString()
    };
    return HttpResponse.json(job);
  }),

  // Update job
  http.put('/api/v1/jobs/:jobId', async ({ params, request }) => {
    await delay();
    const jobId = Number(params.jobId);
    const jobData = await request.json() as z.infer<typeof schemas.JobDescriptionUpdate>;
    const baseJob = mockData.job();
    const job: z.infer<typeof schemas.JobDescriptionResponse> = {
      ...baseJob,
      id: jobId,
      title: jobData.title ?? baseJob.title,
      description: jobData.description ?? baseJob.description,
      language_code: jobData.language_code ?? baseJob.language_code,
      updated_at: new Date().toISOString()
    };
    return HttpResponse.json(job);
  }),

  // Delete job
  http.delete('/api/v1/jobs/:jobId', async () => {
    await delay();
    return new HttpResponse(null, { status: 204 });
  })
];

/**
 * MSW handlers for CV-related endpoints
 */
export const cvHandlers = [
  // Get all CVs
  http.get('/api/v1/user/detailed-cvs', async () => {
    await delay();
    const cvs: z.infer<typeof schemas.DetailedCVResponse>[] = [
      {
        id: 1,
        user_id: 1,
        language_code: 'en',
        content: mockCVContent,
        is_primary: false,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 1,
        language_code: 'fr',
        content: mockCVContent,
        is_primary: true,
        created_at: new Date().toISOString()
      }
    ];
    return HttpResponse.json(cvs);
  }),

  // Get CV by language
  http.get('/api/v1/user/detailed-cvs/:languageCode', async ({ params }) => {
    await delay();
    const languageCode = params.languageCode as string;
    const cv: z.infer<typeof schemas.DetailedCVResponse> = {
      id: 1,
      user_id: 1,
      language_code: languageCode,
      content: mockCVContent,
      is_primary: false,
      created_at: new Date().toISOString()
    };
    return HttpResponse.json(cv);
  }),

  // Create/Update CV
  http.put('/api/v1/user/detailed-cvs/:languageCode', async ({ params, request }) => {
    await delay();
    const languageCode = params.languageCode as string;
    const cvData = await request.json() as z.infer<typeof schemas.DetailedCVCreate>;
    const cv: z.infer<typeof schemas.DetailedCVResponse> = {
      id: 1,
      user_id: 1,
      language_code: languageCode,
      content: cvData.content || mockCVContent,
      is_primary: cvData.is_primary,
      created_at: new Date().toISOString()
    };
    return HttpResponse.json(cv);
  }),

  // Set CV as primary
  http.put('/api/v1/user/detailed-cvs/:languageCode/primary', async ({ params }) => {
    await delay();
    const languageCode = params.languageCode as string;
    const cv: z.infer<typeof schemas.DetailedCVResponse> = {
      id: 1,
      user_id: 1,
      language_code: languageCode,
      content: mockCVContent,
      is_primary: true,
      created_at: new Date().toISOString()
    };
    return HttpResponse.json(cv);
  }),

  // Delete CV
  http.delete('/api/v1/user/detailed-cvs/:languageCode', async () => {
    await delay();
    return new HttpResponse(null, { status: 204 });
  })
];

/**
 * MSW handlers for authentication endpoints
 */
export const authHandlers = [
  // Login
  http.post('/api/v1/auth/login', async () => {
    await delay();
    const user = mockData.user();
    const response = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      user
    };
    return HttpResponse.json(response);
  }),

  // Register
  http.post('/api/v1/auth/register', async ({ request }) => {
    await delay();
    const user = mockData.user();
    const response = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      user
    };
    return HttpResponse.json(response);
  }),

  // Refresh token
  http.post('/api/v1/auth/refresh', async () => {
    await delay();
    const user = mockData.user();
    const response = {
      access_token: 'new-mock-token',
      refresh_token: 'new-mock-refresh-token',
      token_type: 'bearer',
      user
    };
    return HttpResponse.json(response);
  }),

  // Test token
  http.post('/api/v1/auth/test-token', async () => {
    await delay();
    const user = mockData.user();
    return HttpResponse.json(user);
  }),

  // Logout
  http.post('/api/v1/auth/logout', async () => {
    await delay();
    return new HttpResponse(null, { status: 204 });
  })
];

// Export all handlers for use in MSW setup
export const handlers = [
  ...jobHandlers,
  ...cvHandlers,
  ...authHandlers
];
