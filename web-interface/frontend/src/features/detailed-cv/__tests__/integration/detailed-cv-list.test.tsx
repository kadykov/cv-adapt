import { describe, test } from 'vitest';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { ROUTES } from '../../../../routes/paths';
import {
  DetailedCVListPage,
  DetailedCVFormPage,
  DetailedCVDetailPage,
} from '../../components/DetailedCVPages';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import { NavigationTestUtils } from '../../../../lib/test/integration/navigation-utils';
import { createGetHandler } from '../../../../lib/test/integration/handler-generator';
import { screen } from '@testing-library/react';

// Mock data matching the OpenAPI schema
const mockDetailedCVs = [
  {
    id: 1,
    user_id: 1,
    language_code: 'en',
    content: '# English CV\n\nThis is my English CV content.',
    is_primary: true,
    created_at: '2024-02-17T12:00:00Z',
    updated_at: null,
  },
  {
    id: 2,
    user_id: 1,
    language_code: 'fr',
    content: '# CV Français\n\nVoici le contenu de mon CV en français.',
    is_primary: false,
    created_at: '2024-02-17T12:00:00Z',
    updated_at: null,
  },
];

describe('Detailed CV List Operations', () => {
  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('detailed-cvs', <ProtectedRoute />, [
        createRouteConfig('', <DetailedCVListPage />),
        createRouteConfig(':languageCode/create', <DetailedCVFormPage />),
        createRouteConfig(':languageCode', <DetailedCVDetailPage />),
      ]),
    ]),
  ];

  test('should navigate to create page when clicking create button', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.LIST,
      authenticatedUser: true,
      handlers: [
        createGetHandler(
          '/user/detailed-cvs',
          'DetailedCVResponse',
          mockDetailedCVs,
        ),
      ],
    });

    // Wait for German CV card to be visible
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: 'German',
      },
      waitForLoading: true,
    });

    // Get the German CV card and find the create button within it
    const createButton = screen.getByRole('button', {
      name: /create detailed cv/i,
    });
    await user.click(createButton);

    // Verify navigation to create page
    await NavigationTestUtils.verifyNavigation({
      pathname: ROUTES.DETAILED_CVS.CREATE('de'),
      waitForElement: {
        role: 'form',
      },
      waitForLoading: true,
    });

    // Verify German language badge is shown
    await NavigationTestUtils.verifyNavigationResult({
      waitForElement: {
        role: 'status',
        name: 'German',
      },
      shouldMount: true,
    });
  });

  test('should navigate to detail page when clicking CV card', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.LIST,
      authenticatedUser: true,
      handlers: [
        createGetHandler(
          '/user/detailed-cvs',
          'DetailedCVResponse',
          mockDetailedCVs,
        ),
        createGetHandler(
          '/user/detailed-cvs/en',
          'DetailedCVResponse',
          mockDetailedCVs[0],
        ),
      ],
    });

    // Wait for English CV to be visible
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'button',
        name: /English CV/,
      },
      waitForLoading: true,
    });

    // Click the English CV card
    await user.click(screen.getByRole('button', { name: /English CV/ }));

    // Verify navigation to detail page
    await NavigationTestUtils.verifyNavigation({
      pathname: ROUTES.DETAILED_CVS.DETAIL('en'),
      waitForElement: {
        role: 'heading',
        name: /English CV/,
      },
      waitForLoading: true,
    });
  });
});
