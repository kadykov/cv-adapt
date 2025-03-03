import { describe, test } from 'vitest';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { ROUTES } from '../../../../routes/paths';
import { DetailedCVListPage } from '../../components/DetailedCVPages';
import {
  createRouteConfig,
  setupRouteTest,
} from '../../../../lib/test/integration/setup-navigation';
import { NavigationTestUtils } from '../../../../lib/test/integration/navigation-utils';

describe('Detailed CV Protected Routes', () => {
  test('should redirect unauthenticated user to login', async () => {
    const routes = [
      createRouteConfig('/', undefined),
      createRouteConfig('/auth', undefined),
      createRouteConfig('/', <Layout />, [
        createRouteConfig('detailed-cvs', <ProtectedRoute />, [
          createRouteConfig('', <DetailedCVListPage />),
        ]),
      ]),
    ];

    await setupRouteTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.LIST,
      authenticatedUser: false,
    });

    // Verify redirect to login
    await NavigationTestUtils.verifyNavigation({
      pathname: ROUTES.AUTH,
      waitForElement: {
        role: 'heading',
        name: /sign in/i,
      },
      waitForLoading: true,
    });
  });

  test('should allow authenticated user to access protected route', async () => {
    const routes = [
      createRouteConfig('/', undefined),
      createRouteConfig('/auth', undefined),
      createRouteConfig('/', <Layout />, [
        createRouteConfig('detailed-cvs', <ProtectedRoute />, [
          createRouteConfig('', <DetailedCVListPage />),
        ]),
      ]),
    ];

    await setupRouteTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.LIST,
      authenticatedUser: true,
    });

    // Verify user can access the protected route
    await NavigationTestUtils.verifyNavigation({
      pathname: ROUTES.DETAILED_CVS.LIST,
      waitForElement: {
        role: 'heading',
        name: /detailed cvs/i,
      },
      waitForLoading: true,
    });
  });
});
