import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
} from '../../../lib/test/integration';

const mockJobs = [
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
    description: "Création d'interfaces utilisateur",
    language_code: 'fr',
    created_at: '2024-02-17T12:00:00Z',
    updated_at: null,
  },
];

export const jobCatalogIntegrationHandlers = [
  // List jobs
  createGetHandler('/jobs', 'JobDescriptionResponse', mockJobs),
  // Get single job
  createGetHandler('/jobs/1', 'JobDescriptionResponse', mockJobs[0]),
  // Create job
  createPostHandler('/jobs', 'JobDescriptionCreate', 'JobDescriptionResponse', {
    id: 3,
    title: 'Backend Developer',
    description: 'Building APIs',
    language_code: 'en',
    created_at: '2024-02-17T12:00:00Z',
    updated_at: null,
  }),
  // Update job
  createPutHandler(
    '/jobs/1',
    'JobDescriptionUpdate',
    'JobDescriptionResponse',
    {
      ...mockJobs[0],
      title: 'Senior Frontend Developer',
      updated_at: '2024-02-17T13:00:00Z',
    },
  ),
  // Delete job
  createDeleteHandler('/jobs/1'),
];
