import { describe, test, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Layout } from '@/routes/Layout';
import { createRouteConfig, setupFeatureTest } from '@/lib/test/integration/setup-navigation';
import { GenerationParametersPage } from '../../GenerationParametersPage';
import { mockJob, mockCompetencesResponse } from '../../../../testing/fixtures';
import { cvGenerationIntegrationHandlers, cvGenerationErrorHandlers } from '../../../../testing/integration-handlers';
import type { ApiError } from '@/lib/api/client';

describe('Generation Parameters Integration', () => {
  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig(`jobs/:id/generate`, <GenerationParametersPage />),
    ]),
  ];

  const generatePath = `/jobs/${mockJob.id}/generate`;

  const testConfig = {
    routes,
    initialPath: generatePath,
    authenticatedUser: true,
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should display job details and generation form', async () => {
    await setupFeatureTest({
      ...testConfig,
      handlers: cvGenerationIntegrationHandlers
    });

    // Title should be visible
    expect(screen.getByRole('heading', {
      name: new RegExp(mockJob.title, 'i')
    })).toBeInTheDocument();

    // Form elements should be accessible
    const notesInput = screen.getByRole('textbox', { name: /notes for generation/i });
    expect(notesInput).toBeInTheDocument();
    expect(notesInput).toHaveAttribute('aria-label');

    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).not.toBeDisabled();
    expect(generateButton).toHaveAttribute('type', 'button');
  });

  test('should handle competences generation flow', async () => {
    const { user } = await setupFeatureTest({
      ...testConfig,
      handlers: cvGenerationIntegrationHandlers
    });

    // Enter generation notes
    const notesInput = screen.getByRole('textbox', { name: /notes for generation/i });
    await user.type(notesInput, 'Focus on leadership skills');

    // Start generation
    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    await user.click(generateButton);

    // Loading state should be visible and announced
    const loadingIndicator = screen.getByText(/generating competences/i);
    expect(loadingIndicator).toBeInTheDocument();
    expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');

    // Generated competences should appear
    await waitFor(() => {
      const competencesList = screen.getByRole('list', { name: /generated competences/i });
      expect(competencesList).toBeInTheDocument();
      mockCompetencesResponse.core_competences.forEach(competence => {
        expect(screen.getByText(competence)).toBeInTheDocument();
      });
    });

    // Switch controls should be checked and accessible
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(mockCompetencesResponse.core_competences.length);
    expect(switches[0]).toBeChecked();
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
  });

  test('should validate competence selection', async () => {
    const { user } = await setupFeatureTest({
      ...testConfig,
      handlers: cvGenerationIntegrationHandlers
    });

    // Generate competences first
    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    await user.click(generateButton);

    // Wait for competences to appear
    await waitFor(() => {
      expect(screen.getAllByRole('switch'))
        .toHaveLength(mockCompetencesResponse.core_competences.length);
    });

    // Unselect all competences
    const switches = screen.getAllByRole('switch');
    for (const switchEl of switches) {
      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    }

    // Try to proceed without selected competences
    const proceedButton = screen.getByRole('button', {
      name: new RegExp(`proceed with 0 selected competences`, 'i')
    });
    await user.click(proceedButton);

    // Validation error should be shown and announced
    const errorMessage = screen.getByText(/please select at least one competence/i);
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('role', 'alert');
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
  });

  test('should show error when generation fails', async () => {
    const { user } = await setupFeatureTest({
      ...testConfig,
      handlers: cvGenerationErrorHandlers
    });

    // Try to generate
    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    await user.click(generateButton);

    // Error should be shown with proper ARIA attributes
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/failed to generate competences/i);
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    // Try again button should be accessible
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveAttribute('type', 'button');
  });

  test('should close modal on successful CV generation', async () => {
    // Create mock function for closeModal
    const closeModal = vi.fn();

    // Create type-safe mock data following React Query patterns
    const createMockGenerationStatus = () => ({
      isOpen: true,
      closeModal,
      // React Query properties
      data: null,
      dataUpdatedAt: 0,
      error: null as ApiError | null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: 'idle' as const,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: false,
      isInitialLoading: false,
      isLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      isSuccess: false,
      status: 'idle' as const,
      // Methods
      refetch: vi.fn().mockResolvedValue({ data: null }),
      remove: vi.fn(),
    });

    // Mock the hook with type-safe mock data
    vi.mock('../../../../hooks/useGenerationStatus', () => ({
      useGenerationStatus: () => createMockGenerationStatus()
    }));

    const { user } = await setupFeatureTest({
      ...testConfig,
      handlers: cvGenerationIntegrationHandlers
    });

    // Generate competences first
    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    await user.click(generateButton);

    // Wait for proceed button and click
    await waitFor(async () => {
      const proceedButton = screen.getByRole('button', {
        name: new RegExp(`proceed with ${mockCompetencesResponse.core_competences.length} selected competences`, 'i')
      });
      expect(proceedButton).toHaveAttribute('aria-disabled', 'false');
      await user.click(proceedButton);
    });

    // Modal should close
    await waitFor(() => {
      expect(closeModal).toHaveBeenCalled();
    });
  });
});
