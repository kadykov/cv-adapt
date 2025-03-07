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
import { screen, within } from '@testing-library/react';
import { Auth } from '../../../../routes/Auth';

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
      createRouteConfig('auth', <Auth />),
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
          'user/detailed-cvs',
          'DetailedCVResponse',
          mockDetailedCVs,
        ),
      ],
    });

    // Wait for German CV card to be visible
    const germanHeading = await screen.findByTestId('de-heading');

    // Find the German card and get the create button within it
    const germanCard = germanHeading.closest('.card') as HTMLElement;
    expect(germanCard).not.toBeNull();

    const createButton = within(germanCard).getByRole('button', {
      name: /create detailed cv/i,
    });

    await user.click(createButton);

    // Wait for loading to complete and form to be visible
    await NavigationTestUtils.waitForLoadingComplete();

    // Verify form and German badge are shown
    const createForm = await screen.findByRole('form');
    expect(createForm).toBeInTheDocument();

    const germanBadge = await screen.findByText('German');
    expect(germanBadge).toBeInTheDocument();
  });

  test('should navigate to detail page when clicking CV card', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.LIST,
      authenticatedUser: true,
      handlers: [
        createGetHandler(
          'user/detailed-cvs',
          'DetailedCVResponse',
          mockDetailedCVs,
        ),
        createGetHandler(
          'user/detailed-cvs/en',
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
      waitForElement: {
        role: 'heading',
        name: /English CV/,
      },
      waitForLoading: true,
    });
  });
});
