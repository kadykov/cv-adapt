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
import {
  createGetHandler,
  createPutHandler,
} from '../../../../lib/test/integration/handler-generator';
import { screen } from '@testing-library/react';
import { Auth } from '../../../../routes/Auth';

// Mock data matching the OpenAPI schema
const mockDetailedCV = {
  id: 1,
  user_id: 1,
  language_code: 'en',
  content: '# English CV\n\nThis is my English CV content.',
  is_primary: true,
  created_at: '2024-02-17T12:00:00Z',
  updated_at: null,
};

describe('Detailed CV Form Operations', () => {
  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('auth', <Auth />),
      createRouteConfig('detailed-cvs', <ProtectedRoute />, [
        createRouteConfig('', <DetailedCVListPage />),
        createRouteConfig(':languageCode/create', <DetailedCVFormPage />),
        createRouteConfig(':languageCode/edit', <DetailedCVFormPage />),
        createRouteConfig(':languageCode', <DetailedCVDetailPage />),
      ]),
    ]),
  ];

  test('should navigate to list after successful creation', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.CREATE('en'),
      authenticatedUser: true,
      handlers: [
        createPutHandler(
          'user/detailed-cvs/en',
          'DetailedCVCreate',
          'DetailedCVResponse',
          mockDetailedCV,
        ),
        createGetHandler('user/detailed-cvs', 'DetailedCVResponse', [
          mockDetailedCV,
        ]),
      ],
    });

    // Wait for form to be visible
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'textbox',
        name: /cv content/i,
      },
      waitForLoading: true,
    });

    // Fill form and submit
    const contentInput = screen.getByLabelText(/cv content/i);
    await user.type(contentInput, mockDetailedCV.content);

    const submitButton = screen.getByRole('button', { name: /create cv/i });
    await user.click(submitButton);

    // Verify navigation to list page
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: 'Detailed CVs',
      },
      waitForLoading: true,
    });

    // Verify new CV appears in list
    await NavigationTestUtils.verifyNavigationResult({
      waitForElement: {
        role: 'button',
        name: /English CV/,
      },
      shouldMount: true,
    });
  });

  test('should navigate to list after successful edit', async () => {
    const updatedCV = {
      ...mockDetailedCV,
      content: '# Updated English CV\n\nThis is my updated English CV content.',
      updated_at: '2024-02-17T13:00:00Z',
    };

    const { user } = await setupFeatureTest({
      routes,
      initialPath: ROUTES.DETAILED_CVS.EDIT('en'),
      authenticatedUser: true,
      handlers: [
        createGetHandler(
          'user/detailed-cvs/en',
          'DetailedCVResponse',
          mockDetailedCV,
        ),
        createPutHandler(
          'user/detailed-cvs/en',
          'DetailedCVCreate',
          'DetailedCVResponse',
          updatedCV,
        ),
        createGetHandler('user/detailed-cvs', 'DetailedCVResponse', [
          updatedCV,
        ]),
      ],
    });

    // Wait for form to be visible with existing content
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'textbox',
        name: /cv content/i,
      },
      waitForLoading: true,
    });

    // Update content and submit
    const contentInput = screen.getByLabelText(/cv content/i);
    await user.clear(contentInput);
    await user.type(contentInput, updatedCV.content);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    // Verify navigation to list page
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: 'Detailed CVs',
      },
      waitForLoading: true,
    });

    // Verify updated CV appears in list
    await NavigationTestUtils.verifyNavigationResult({
      waitForElement: {
        role: 'button',
        name: /Updated English CV/,
      },
      shouldMount: true,
    });
  });
});
