import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/v1';

interface Job {
  id: number;
  title: string;
  description: string;
  language_code: string;
  created_at: string;
  updated_at?: string;
}

interface CreateJobRequest {
  title: string;
  description: string;
  language_code: string;
}

interface UpdateJobRequest {
  title?: string;
  description?: string;
  language_code?: string;
}

const mockJobs: Job[] = [
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Test description',
    language_code: 'en',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Développeur Frontend',
    description: 'Description test',
    language_code: 'fr',
    created_at: new Date().toISOString()
  }
];

export const jobHandlers = [
  // Get jobs list
  http.get(`${API_URL}/jobs`, ({ request }) => {
    const url = new URL(request.url);
    const languageCode = url.searchParams.get('language_code') || 'en';
    const filteredJobs = mockJobs.filter(job => job.language_code === languageCode);
    return HttpResponse.json(filteredJobs);
  }),

  // Get single job
  http.get(`${API_URL}/jobs/:id`, ({ params }) => {
    const job = mockJobs.find(j => j.id === Number(params.id));
    if (!job) {
      return new HttpResponse(
        JSON.stringify({ message: 'Job not found' }),
        { status: 404 }
      );
    }
    return HttpResponse.json(job);
  }),

  // Create job
  http.post(`${API_URL}/jobs`, async ({ request }) => {
    const body = await request.json() as CreateJobRequest;

    if (!body.title || !body.description || !body.language_code) {
      return new HttpResponse(
        JSON.stringify({ message: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const newJob: Job = {
      id: mockJobs.length + 1,
      ...body,
      created_at: new Date().toISOString()
    };

    mockJobs.push(newJob);
    return HttpResponse.json(newJob);
  }),

  // Update job
  http.put(`${API_URL}/jobs/:id`, async ({ request, params }) => {
    const job = mockJobs.find(j => j.id === Number(params.id));
    if (!job) {
      return new HttpResponse(
        JSON.stringify({ message: 'Job not found' }),
        { status: 404 }
      );
    }

    const body = await request.json() as UpdateJobRequest;
    const updatedJob: Job = {
      ...job,
      ...body
    };

    const index = mockJobs.findIndex(j => j.id === Number(params.id));
    mockJobs[index] = updatedJob;

    return HttpResponse.json(updatedJob);
  }),

  // Delete job
  http.delete(`${API_URL}/jobs/:id`, ({ params }) => {
    const index = mockJobs.findIndex(j => j.id === Number(params.id));
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Job not found' }),
        { status: 404 }
      );
    }

    mockJobs.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  })
];
