import { describe, test } from 'vitest';
import { screen } from '@testing-library/react';
import { Layout } from '@/routes/Layout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { Auth } from '@/routes/Auth';
import {
  createRouteConfig,
  setupFeatureTest,
} from '@/lib/test/integration/setup-navigation';
import {
  createGetHandler,
} from '@/lib/test/integration/handler-generator';
import { NavigationTestUtils } from '@/lib/test/integration/navigation-utils';
import { GenerationFlowLayout } from '@/features/cv-generation/components/GenerationFlowLayout';
import { mockJob } from '@/features/cv-generation/testing/fixtures';
import { ROUTES } from '@/routes/paths';

describe('Generation Flow Layout', () => {
  const jobId = mockJob.id;

  // Mock pages with required functionality
  const ParametersPage = () => (
    <GenerationFlowLayout>
      <form>
        <h1>Generate CV for {mockJob.title}</h1>
        <textarea aria-label="Notes for generation" />
        <button type="submit">Generate Competences</button>
      </form>
    </GenerationFlowLayout>
  );

  const CompetencesGeneratePage = () => (
    <GenerationFlowLayout disableNext>
      <div>
        <h1>Generate Competences</h1>
      </div>
    </GenerationFlowLayout>
  );

  // Use actual route paths from ROUTES constant
  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('auth', <Auth />),
      createRouteConfig('jobs', <ProtectedRoute />, [
        createRouteConfig(':jobId', <ProtectedRoute />, [
          createRouteConfig('generate', <ProtectedRoute />, [
            createRouteConfig('parameters', <ParametersPage />),
            createRouteConfig('competences/generate', <CompetencesGeneratePage />),
          ]),
        ]),
      ]),
    ]),
  ];

  const commonHandlers = [
    // Job detail endpoint
    createGetHandler(
      `jobs/${jobId}`,
      'JobDescriptionResponse',
      mockJob
    ),
  ];

  test('should render initial step with proper accessibility', async () => {
    await setupFeatureTest({
      routes,
      initialPath: `${ROUTES.JOBS.GENERATE.PARAMETERS(jobId)}?language=en`,
      authenticatedUser: true,
      handlers: commonHandlers,
    });

    await NavigationTestUtils.waitForLoadingComplete();

    // Check navigation landmarks
    expect(screen.getByRole('navigation', { name: /cv generation progress/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();

    // Check initial step selection
    expect(screen.getByRole('tab', { selected: true }))
      .toHaveTextContent(/parameters/i);
  });

  test('should handle navigation between steps', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: `${ROUTES.JOBS.GENERATE.PARAMETERS(jobId)}?language=en`,
      authenticatedUser: true,
      handlers: commonHandlers,
    });

    await NavigationTestUtils.waitForLoadingComplete();

    // Verify initial button states
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();

    // Navigate to competences step
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Verify competences page is shown
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: /generate competences/i,
      },
      waitForLoading: true,
    });

    // Verify navigation controls in disabled step
    expect(screen.getByRole('button', { name: /back/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /please complete current step/i }))
      .toBeDisabled();
  });

  test('should handle navigation controls states', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: `${ROUTES.JOBS.GENERATE.PARAMETERS(jobId)}?language=en`,
      authenticatedUser: true,
      handlers: commonHandlers,
    });

    await NavigationTestUtils.waitForLoadingComplete();

    // Check initial button states
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeEnabled();

    // Navigate to next step
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await NavigationTestUtils.waitForLoadingComplete();

    // Verify disabled step controls
    expect(screen.getByRole('button', { name: /back/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /please complete current step/i })).toBeDisabled();
  });

  test('should handle navigation cancellation', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: `${ROUTES.JOBS.GENERATE.PARAMETERS(jobId)}?language=en`,
      authenticatedUser: true,
      handlers: commonHandlers,
    });

    await NavigationTestUtils.waitForLoadingComplete();

    // Cancel generation
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Verify navigation away from generation flow
    await NavigationTestUtils.verifyNavigationResult({
      waitForElement: {
        role: 'navigation',
        name: /cv generation progress/i,
      },
      shouldMount: false,
    });
  });

  test('should prevent navigation through disabled steps', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: `${ROUTES.JOBS.GENERATE.PARAMETERS(jobId)}?language=en`,
      authenticatedUser: true,
      handlers: commonHandlers,
    });

    await NavigationTestUtils.waitForLoadingComplete();

    // Verify initial button states
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();

    // Navigate to competences step
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Verify disabled step state
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'button',
        name: /please complete current step/i,
      },
      waitForLoading: true,
    });

    // Verify navigation limitation
    expect(screen.getByRole('button', { name: /back/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /please complete current step/i }))
      .toBeDisabled();

    // Verify can navigate back
    await user.click(screen.getByRole('button', { name: /back/i }));

    // Check we're back at parameters
    await NavigationTestUtils.verifyNavigation({
      waitForElement: {
        role: 'heading',
        name: /generate cv for/i,
      },
      waitForLoading: true,
    });
  });
});
