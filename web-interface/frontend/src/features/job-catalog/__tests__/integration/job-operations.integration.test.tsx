import { describe, test, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { getTestApiUrl } from '../../../../lib/test/url-helper';
import type { RenderOptions } from '@testing-library/react';
import {
  render,
  screen,
  waitFor,
  createGetHandler,
  createPostHandler,
  createPutHandler,
  addIntegrationHandlers,
} from '../../../../lib/test/integration';
import type { ReactNode } from 'react';
import {
  JobListPage,
  CreateJobPage,
  EditJobPage,
  JobDetailPage,
} from '../../components/JobPages';
import { http, HttpResponse } from 'msw';
import { ROUTES } from '../../../../routes/paths';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { authIntegrationHandlers } from '../../../auth/testing/integration-handlers';
import { IntegrationTestWrapper } from '../../../../lib/test/integration';
import { QueryClient } from '@tanstack/react-query';
import { setupAuthenticatedState } from '../../../auth/testing/setup';

describe('Job Operations Integration', () => {
  // Create RenderOptions type that includes wrapper
  interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    wrapper?: React.ComponentType;
  }

  const RouterWrapper = ({
    children,
    initialEntries,
  }: {
    children: ReactNode;
    initialEntries: string[];
  }) => (
    <IntegrationTestWrapper initialEntries={initialEntries}>
      {children}
    </IntegrationTestWrapper>
  );
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

  const serverError = {
    detail: { message: 'Internal Server Error' },
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderWithAuth = async (
    initialEntries: string[] = [ROUTES.JOBS.LIST],
  ) => {
    // Mock authenticated state with tokens
    localStorage.setItem('access_token', 'valid-access-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: Infinity,
        },
      },
    });

    // Setup auth state before rendering
    setupAuthenticatedState(queryClient);

    const wrapper = render(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Welcome to CV Adapt</div>} />
            <Route path={ROUTES.JOBS.LIST} element={<JobListPage />} />
            <Route path={ROUTES.JOBS.CREATE} element={<CreateJobPage />} />
            <Route path={ROUTES.JOBS.EDIT(':id')} element={<EditJobPage />} />
            <Route
              path={ROUTES.JOBS.DETAIL(':id')}
              element={<JobDetailPage />}
            />
          </Route>
        </Route>
      </Routes>,
      {
        wrapper: ({ children }: { children: ReactNode }) =>
          RouterWrapper({ children, initialEntries }),
      } as ExtendedRenderOptions,
    );

    // Wait for initial query to complete
    await queryClient.resetQueries();

    // Wait for auth state to be initialized
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    return wrapper;
  };

  // Add auth and job operation handlers
  beforeEach(() => {
    localStorage.clear();
    // Reset handlers before each test
    addIntegrationHandlers([
      // Include auth handlers from auth integration tests
      ...authIntegrationHandlers,
      // List jobs - customize based on test
      createGetHandler('/jobs', 'JobDescriptionResponse', mockJobs),
      // Get single job
      createGetHandler('/jobs/1', 'JobDescriptionResponse', mockJobs[0]),
      // Create job
      createPostHandler(
        '/jobs',
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
        '/jobs/1',
        'JobDescriptionUpdate',
        'JobDescriptionResponse',
        {
          ...mockJobs[0],
          title: 'Senior Frontend Developer',
          updated_at: '2024-02-17T13:00:00Z',
        },
      ),
    ]);
  });

  test('should list jobs with language filtering', async () => {
    await renderWithAuth([ROUTES.JOBS.LIST]);

    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();
    });

    // Check language badges
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('fr')).toBeInTheDocument();
  });

  test('should display loading and error states', async () => {
    // Add custom error handler
    addIntegrationHandlers([
      http.get(getTestApiUrl('jobs'), () => {
        return HttpResponse.json(serverError, { status: 500 });
      }),
    ]);

    await renderWithAuth([ROUTES.JOBS.LIST]);

    // Should show loading spinner initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Should show error state with specific message
    await waitFor(() => {
      expect(screen.getByText(serverError.detail.message)).toBeInTheDocument();
    });
  });

  test('should create a new job', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.JOBS.CREATE]);

    // Fill in the form
    await user.type(screen.getByLabelText(/title/i), mockNewJob.title);
    await user.type(
      screen.getByLabelText(/description/i),
      mockNewJob.description,
    );

    // Open language dropdown and select 'en'
    const languageButton = screen.getByRole('button', { name: /language/i });
    await user.click(languageButton);
    await user.click(screen.getByText('English (English)'));

    // Submit form
    await user.click(screen.getByRole('button', { name: /create job/i }));

    // Should show success state
    await waitFor(() => {
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    });
  });

  test('should handle form validation errors', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.JOBS.CREATE]);

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create job/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/please select a valid language/i),
      ).toBeInTheDocument();
    });
  });

  test('should update an existing job', async () => {
    const user = userEvent.setup();

    await renderWithAuth([ROUTES.JOBS.EDIT(1)]);

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument(); // Wait for input to be present
    });
    expect(screen.getByLabelText(/title/i)).toHaveValue('Frontend Developer'); // Assert value outside waitFor
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      'Building user interfaces',
    );

    // Update title
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(
      screen.getByLabelText(/title/i),
      'Senior Frontend Developer',
    );

    // Submit form
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Should show success state
    await waitFor(() => {
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    });
  });

  test('should delete a job and redirect to list', async () => {
    // Override handlers for delete test
    addIntegrationHandlers([
      // After delete, list should return jobs without the deleted one
      http.get(getTestApiUrl('jobs'), () => {
        return HttpResponse.json(mockJobs.filter((job) => job.id !== 1));
      }),
      // Delete handler
      http.delete(getTestApiUrl('jobs/1'), async () => {
        // Return success and trigger redirect
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.history.pushState({}, '', '/jobs');
        return new HttpResponse(null, { status: 204 });
      }),
    ]);

    const user = userEvent.setup();
    await renderWithAuth([ROUTES.JOBS.DETAIL(1)]);

    // Wait for job details to load
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    // Click delete button and wait for redirect
    await user.click(screen.getByRole('button', { name: /delete job/i }));
    await waitFor(() => expect(window.location.pathname).toBe('/jobs'));

    // Should not see deleted job in the list
    await waitFor(() => {
      expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
    });
  });

  test('should navigate from list to detail and edit pages', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.JOBS.LIST]);

    // Click on the job card to navigate to detail page
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Frontend Developer'));

    // Should see job details
    await waitFor(() => {
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByText('Building user interfaces')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit job/i });
    await user.click(editButton);

    // Should see the edit form
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save changes/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toHaveValue('Frontend Developer');
    });
  });

  test('should navigate between list and create pages', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.JOBS.LIST]);

    // Wait for jobs list to load
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    // Click "Add Job" button in the JobList
    const addJobButton = screen.getByRole('link', { name: /add job/i });
    await user.click(addJobButton);

    // Should see the create job form
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create job/i }),
      ).toBeInTheDocument();
    });

    // Go back to job list by clicking Jobs link
    const jobsLink = screen.getByText('Jobs');
    await user.click(jobsLink);

    // Should see the job list again
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });
  });
});
