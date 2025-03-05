import { describe, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { ROUTES } from '../../../../routes/paths';
import {
  CreateJobPage,
  EditJobPage,
  JobListPage,
  JobDetailPage,
} from '../../components/JobPages';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import {
  createGetHandler,
  createPostHandler,
  createPutHandler,
} from '../../../../lib/test/integration/handler-generator';
import type { JobDescriptionResponse } from '../../../../lib/api/generated-types';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Frontend Developer',
  description: 'Building user interfaces',
  language_code: 'en',
  created_at: '2024-02-17T12:00:00Z',
  updated_at: null,
};

const mockNewJob = {
  title: 'Backend Developer',
  description: 'Building APIs',
  language_code: 'en',
};

describe('Job Form Operations', () => {
  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('auth', <div aria-label="login-page">Sign In</div>),
      createRouteConfig('', <ProtectedRoute />, [
        createRouteConfig('jobs', <JobListPage />),
        createRouteConfig('jobs/new', <CreateJobPage />),
        createRouteConfig('jobs/:id/edit', <EditJobPage />),
        createRouteConfig('jobs/:id', <JobDetailPage />),
      ]),
    ]),
  ];

  test('should create new job and navigate to list', async () => {
    // Set up handlers and auth state
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.JOBS.CREATE,
      authenticatedUser: true,
      history: {
        entries: ['/jobs/new'],
        index: 0,
      },
      handlers: [
        // Auth handler
        createGetHandler('/auth/me', 'UserResponse', {
          id: 1,
          email: 'test@example.com',
          created_at: '2024-02-17T12:00:00Z',
          personal_info: null,
        }),
        // Initial jobs list
        createGetHandler('/jobs', 'JobDescriptionResponse', [mockJob]),
        // Create job response
        createPostHandler(
          '/jobs',
          'JobDescriptionCreate',
          'JobDescriptionResponse',
          {
            id: 3,
            title: mockNewJob.title,
            description: mockNewJob.description,
            language_code: mockNewJob.language_code,
            created_at: '2024-02-17T12:00:00Z',
            updated_at: null,
          },
        ),
        // Updated jobs list after creation
        createGetHandler('/jobs', 'JobDescriptionResponse', [
          mockJob,
          {
            id: 3,
            title: mockNewJob.title,
            description: mockNewJob.description,
            language_code: mockNewJob.language_code,
            created_at: '2024-02-17T12:00:00Z',
            updated_at: null,
          },
        ]),
      ],
    });

    // Wait for auth state to be ready
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
      expect(localStorage.getItem('access_token')).toBeTruthy();
    });

    // Wait for form
    const form = await screen.findByRole('form');
    expect(form).toBeInTheDocument();

    // Fill in form
    await user.type(screen.getByLabelText(/title/i), mockNewJob.title);
    await user.type(
      screen.getByLabelText(/description/i),
      mockNewJob.description,
    );

    // Select language
    const languageButton = screen.getByRole('button', { name: /language/i });
    await user.click(languageButton);
    await user.click(screen.getByText('English (English)'));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create job/i });

    // Verify auth state before submission
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeTruthy();
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    // Submit form and verify auth isn't lost during submission
    await user.click(submitButton);
    expect(localStorage.getItem('access_token')).toBeTruthy();

    // Wait for jobs list page to be rendered
    await waitFor(
      () => {
        const addJobButton = screen.getByRole('link', { name: /add job/i });
        expect(addJobButton).toBeInTheDocument();
        expect(addJobButton.getAttribute('href')).toBe('/jobs/new');
      },
      {
        timeout: 2000,
      },
    );
  });

  test('should handle form validation errors', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.JOBS.CREATE,
      authenticatedUser: true,
      history: {
        entries: ['/jobs/new'],
        index: 0,
      },
    });

    // Wait for form to be mounted
    const form = await screen.findByRole('form');
    expect(form).toBeInTheDocument();

    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /create job/i });
    await user.click(submitButton);

    // Verify all validation errors appear
    await waitFor(() => {
      const errors = screen.getAllByRole('alert');
      expect(errors).toHaveLength(3); // title, description, and language
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/please select a valid language/i),
      ).toBeInTheDocument();
    });
  });

  test('should update existing job and navigate to detail', async () => {
    const updatedTitle = 'Senior Frontend Developer';
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.JOBS.EDIT('1'),
      authenticatedUser: true,
      history: {
        entries: ['/jobs/1/edit'],
        index: 0,
      },
      handlers: [
        createGetHandler('/jobs/1', 'JobDescriptionResponse', mockJob),
        createPutHandler(
          '/jobs/1',
          'JobDescriptionUpdate',
          'JobDescriptionResponse',
          {
            ...mockJob,
            title: updatedTitle,
            updated_at: '2024-02-17T13:00:00Z',
          },
        ),
      ],
    });

    // Wait for form to be mounted with initial data
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue(mockJob.title);
    });

    // Update title
    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, updatedTitle);

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Verify navigation to detail page by checking job details
    await waitFor(() => {
      const jobTitle = screen.getByRole('heading', { name: updatedTitle });
      expect(jobTitle).toBeInTheDocument();
    });
  });

  test('should handle update error and show error message', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.JOBS.EDIT('1'),
      authenticatedUser: true,
      history: {
        entries: ['/jobs/1/edit'],
        index: 0,
      },
      handlers: [
        createGetHandler('/jobs/1', 'JobDescriptionResponse', mockJob),
        createPutHandler(
          '/jobs/1',
          'JobDescriptionUpdate',
          'JobDescriptionResponse',
          mockJob,
          {
            validateRequest: () => false, // Force validation failure
            errorResponse: {
              status: 500,
              message: 'Server error while updating',
            },
          },
        ),
      ],
    });

    // Wait for form to be mounted with initial data
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue(mockJob.title);
    });

    // Update title
    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Senior Frontend Developer');

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Verify error message is shown
    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent(/server error while updating/i);
    });

    // Verify we're still on the edit form
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
  });
});
