import { describe, test } from 'vitest';
import { screen } from '@testing-library/react';
import { ROUTES } from '../../../../routes/paths';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { JobListPage, JobDetailPage } from '../../components/JobPages';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import { NavigationTestUtils } from '../../../../lib/test/integration/navigation-utils';
import {
  createGetHandler,
  createErrorHandler,
} from '../../../../lib/test/integration/handler-generator';
import type { JobDescriptionResponse } from '../../../../lib/api/generated-types';

const mockJobs: JobDescriptionResponse[] = [
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

describe('Job Catalog List Operations', () => {
  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('jobs', <ProtectedRoute />, [
        createRouteConfig('', <JobListPage />),
        createRouteConfig(':id', <JobDetailPage />),
      ]),
    ]),
  ];

  test('should display jobs with language filtering', async () => {
    await setupFeatureTest({
      routes,
      initialPath: ROUTES.JOBS.LIST,
      authenticatedUser: true,
      handlers: [createGetHandler('/jobs', 'JobDescriptionResponse', mockJobs)],
    });

    // Wait for list to load and verify content
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: 'Frontend Developer',
      },
      waitForLoading: true,
    });

    // Verify job cards and language badges are present
    expect(screen.getByText(/building user interfaces/i)).toBeInTheDocument();
    expect(
      screen.getByText("Création d'interfaces utilisateur"),
    ).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('fr')).toBeInTheDocument();
  });

  test('should navigate from list to detail view', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.JOBS.LIST,
      authenticatedUser: true,
      handlers: [
        createGetHandler('/jobs', 'JobDescriptionResponse', mockJobs),
        createGetHandler('/jobs/1', 'JobDescriptionResponse', mockJobs[0]),
      ],
    });

    // Wait for list to load
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: 'Frontend Developer',
      },
      waitForLoading: true,
    });

    // Click job card and verify detail view
    const jobCard = screen.getByRole('button', { name: /frontend developer/i });
    await NavigationTestUtils.verifyActionNavigation(
      async () => {
        await user.click(jobCard);
      },
      {
        waitForElement: {
          role: 'heading',
          name: 'Frontend Developer',
        },
        waitForLoading: true,
      },
    );

    // Verify detailed content is shown
    expect(screen.getByText('Building user interfaces')).toBeInTheDocument();
  });

  test('should display error state', async () => {
    await setupFeatureTest({
      routes,
      initialPath: ROUTES.JOBS.LIST,
      authenticatedUser: true,
      handlers: [
        createErrorHandler('/jobs', 500, {
          detail: { message: 'Internal Server Error' },
        }),
      ],
    });

    // Wait for error message
    const errorMessage = await screen.findByText(/internal server error/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
