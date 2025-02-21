import { describe, test, expect } from 'vitest';
import {
  render,
  screen,
  waitFor,
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
  addIntegrationHandlers,
} from '../../../../lib/test/integration';
import { JobList } from '../../components/JobList';

describe('Job Operations Integration', () => {
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

  const mockNewJob = {
    title: 'Backend Developer',
    description: 'Building APIs',
    language_code: 'en',
  };

  // Add handlers for job operations
  addIntegrationHandlers([
    // List jobs
    createGetHandler('/v1/api/jobs', 'JobDescriptionResponse', mockJobs),
    // Get single job
    createGetHandler('/v1/api/jobs/1', 'JobDescriptionResponse', mockJobs[0]),
    // Create job
    createPostHandler(
      '/v1/api/jobs',
      'JobDescriptionCreate',
      'JobDescriptionResponse',
      {
        id: 3,
        created_at: '2024-02-17T12:00:00Z',
        updated_at: null,
        ...mockNewJob,
      },
    ),
    // Update job
    createPutHandler(
      '/v1/api/jobs/1',
      'JobDescriptionUpdate',
      'JobDescriptionResponse',
      {
        ...mockJobs[0],
        title: 'Senior Frontend Developer',
        updated_at: '2024-02-17T13:00:00Z',
      },
    ),
    // Delete job
    createDeleteHandler('/v1/api/jobs/1'),
  ]);

  test('should list jobs with language filtering', async () => {
    render(<JobList />);

    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();
    });

    // Check language badges
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('fr')).toBeInTheDocument();

    // TODO: Add language filter interaction tests
    // This will require implementing the language filter component
  });

  test('should display loading and error states', async () => {
    // Add error handler
    addIntegrationHandlers([
      createGetHandler('/v1/api/jobs', 'JobDescriptionResponse', null, {
        status: 500,
      }),
    ]);

    render(<JobList />);

    // Should show loading spinner initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Should show error state with specific message
    await waitFor(() => {
      expect(screen.getByText(/failed to load jobs/i)).toBeInTheDocument();
    });
  });

  // TODO: Add tests for job creation, update, and deletion
  // This will require implementing and using the JobForm component
});
