import { describe, test } from 'vitest';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { JobListPage } from '../../components/JobPages';
import {
  createRouteConfig,
  setupRouteTest,
} from '../../../../lib/test/integration/setup-navigation';
import { NavigationTestUtils } from '../../../../lib/test/integration/navigation-utils';

describe('Job Catalog Protected Routes', () => {
  test('should redirect unauthenticated user to login', async () => {
    const routes = [
      createRouteConfig('/', <Layout />, [
        createRouteConfig('auth', <div aria-label="login-page">Sign In</div>),
        createRouteConfig('jobs', <ProtectedRoute />, [
          createRouteConfig('', <JobListPage />),
        ]),
      ]),
    ];

    await setupRouteTest({
      routes,
      initialPath: '/jobs',
      authenticatedUser: false,
    });

    // Verify redirect shows login page
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'generic',
        name: 'login-page',
      },
      waitForLoading: true,
    });
  });

  test('should allow authenticated user to access protected route', async () => {
    const routes = [
      createRouteConfig('/', <Layout />, [
        createRouteConfig('auth', <div>Sign In</div>),
        createRouteConfig('jobs', <ProtectedRoute />, [
          createRouteConfig('', <JobListPage />),
        ]),
      ]),
    ];

    await setupRouteTest({
      routes,
      initialPath: '/jobs',
      authenticatedUser: true,
    });

    // Verify user can see the jobs list page
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'link',
        name: /add job/i,
      },
      waitForLoading: true,
    });
  });
});
