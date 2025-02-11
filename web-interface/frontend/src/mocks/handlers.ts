import { http, HttpResponse } from 'msw';
import { mockAuthResponse, mockUser } from './auth-mock-data';
import { mockDetailedCV, mockGeneratedCV } from './cv-mock-data';
import { mockJob } from './job-mock-data';

export const handlers = [
  // Auth handlers
  http.post('*/v1/auth/register', async () => {
    return HttpResponse.json(mockAuthResponse);
  }),

  http.post('*/v1/auth/login', async () => {
    return new Promise((resolve) => {
      // Add small delay to simulate network
      setTimeout(() => {
        resolve(HttpResponse.json(mockAuthResponse, { status: 200 }));
      }, 10);
    });
  }),

  http.post('*/v1/auth/refresh', async () => {
    return HttpResponse.json(mockAuthResponse);
  }),

  http.post('*/v1/auth/logout', async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(new HttpResponse(null, { status: 204 }));
      }, 10);
    });
  }),

  // User profile handlers
  http.get('*/user/profile', () => {
    return HttpResponse.json(mockUser);
  }),

  http.put('*/user/profile', () => {
    return HttpResponse.json(mockUser);
  }),

  // CV handlers
  http.get('*/user/detailed-cvs', () => {
    return HttpResponse.json([mockDetailedCV]);
  }),

  http.get('*/user/detailed-cvs/:language_code', () => {
    return HttpResponse.json(mockDetailedCV);
  }),

  http.put('*/user/detailed-cvs/:language_code', () => {
    return HttpResponse.json(mockDetailedCV);
  }),

  http.delete('*/user/detailed-cvs/:language_code', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('*/user/detailed-cvs/:language_code/primary', () => {
    return HttpResponse.json({ ...mockDetailedCV, is_primary: true });
  }),

  // Jobs handlers
  http.get('*/jobs', async ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('empty')) {
      return HttpResponse.json([]);
    }
    if (url.searchParams.get('error')) {
      return HttpResponse.json(
        { message: 'Failed to load' },
        { status: 500 }
      );
    }
    return HttpResponse.json([mockJob]);
  }),

  http.post('*/jobs', async () => {
    return HttpResponse.json(mockJob);
  }),

  http.get('*/jobs/:job_id', async ({ params }) => {
    const { job_id } = params;
    if (job_id === '999') {
      return HttpResponse.json(
        { message: 'Job not found' },
        { status: 404 }
      );
    }
    if (job_id === 'invalid-id') {
      return HttpResponse.json(
        { message: 'Failed to load job details' },
        { status: 400 }
      );
    }
    return HttpResponse.json(mockJob);
  }),

  http.put('*/jobs/:job_id', async () => {
    return HttpResponse.json(mockJob);
  }),

  http.delete('*/jobs/:job_id', async ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('error')) {
      return HttpResponse.json(
        { message: 'Failed to delete job. Please try again later.' },
        { status: 500 }
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Generation handlers
  http.post('*/api/generate-competences', () => {
    return HttpResponse.json({
      technical: ['React', 'TypeScript'],
      soft: ['Communication', 'Teamwork']
    });
  }),

  http.post('*/generate', () => {
    return HttpResponse.json(mockGeneratedCV);
  }),

  http.get('*/generations', () => {
    return HttpResponse.json([mockGeneratedCV]);
  }),

  http.get('*/generations/:cv_id', () => {
    return HttpResponse.json(mockGeneratedCV);
  })
];
