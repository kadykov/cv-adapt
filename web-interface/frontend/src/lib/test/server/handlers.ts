import { http, HttpResponse } from 'msw';
import type { JobsResponse, JobDescriptionResponse } from '../../api/generated-types';

const mockJobs: JobsResponse = [
  {
    id: 1,
    title: 'Frontend Developer',
    description: 'Building user interfaces',
    language_code: 'en',
    created_at: '2024-02-17T12:00:00Z',
    updated_at: null,
  },
  {
    id: 2,
    title: 'Développeur Frontend',
    description: 'Création d\'interfaces utilisateur',
    language_code: 'fr',
    created_at: '2024-02-17T12:00:00Z',
    updated_at: null,
  },
];

export const handlers = [
  http.get('/v1/api/jobs', ({ request }) => {
    const url = new URL(request.url);
    const languageCode = url.searchParams.get('language_code');

    if (languageCode) {
      return HttpResponse.json(
        mockJobs.filter((job: JobDescriptionResponse) => job.language_code === languageCode)
      );
    }

    return HttpResponse.json(mockJobs);
  }),

  http.get('/v1/api/jobs/:id', ({ params }) => {
    const job = mockJobs.find((job: JobDescriptionResponse) => job.id === Number(params.id));
    if (job) {
      return HttpResponse.json(job);
    }
    return new HttpResponse(null, { status: 404 });
  }),
];
