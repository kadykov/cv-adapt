import { describe, test } from 'vitest';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { ROUTES } from '../../../../routes/paths';
import { DetailedCVListPage } from '../../components/DetailedCVPages';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import { NavigationTestUtils } from '../../../../lib/test/integration/navigation-utils';
import { Auth } from '../../../../routes/Auth';
import { createGetHandler } from '../../../../lib/test/integration/handler-generator';

describe('Detailed CV Protected Routes', () => {
  test('should redirect unauthenticated user to login', async () => {
    const routes = [
      createRouteConfig('/', <Layout />, [
        createRouteConfig('auth', <Auth />),
        createRouteConfig('detailed-cvs', <ProtectedRoute />, [
          createRouteConfig('', <DetailedCVListPage />),
        ]),
      ]),
    ];

    await setupFeatureTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.LIST,
      authenticatedUser: false,
    });

    // Verify redirect to login by checking for the login form
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: /sign in/i,
      },
      waitForLoading: true,
    });
  });

  test('should allow authenticated user to access protected route', async () => {
    const routes = [
      createRouteConfig('/', <Layout />, [
        createRouteConfig('auth', <Auth />),
        createRouteConfig('detailed-cvs', <ProtectedRoute />, [
          createRouteConfig('', <DetailedCVListPage />),
        ]),
      ]),
    ];

    await setupFeatureTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.LIST,
      authenticatedUser: true,
      handlers: [
        createGetHandler('user/detailed-cvs', 'DetailedCVResponse', [
          {
            id: 1,
            user_id: 1,
            language_code: 'en',
            content: '# English CV\n\nThis is my English CV content.',
            is_primary: true,
            created_at: '2024-02-17T12:00:00Z',
            updated_at: null,
          },
        ]),
      ],
    });

    // Verify user can access the protected route
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: /detailed cvs/i,
      },
      waitForLoading: true,
    });
  });
});
