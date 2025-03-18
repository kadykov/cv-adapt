import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Layout } from '../../../../../../routes/Layout';
import { createRouteConfig, setupFeatureTest } from '../../../../../../lib/test/integration/setup-navigation';
import { createGetHandler } from '../../../../../../lib/test/integration/handler-generator';
import { GenerationParametersPage } from '../../GenerationParametersPage';
import { mockJob, mockCompetencesResponse } from '../../../../testing/fixtures';
import { cvGenerationHandlers } from '../../../../testing/handlers';
import { useGenerationStatus } from '../../../../hooks/useGenerationStatus';
import type { GeneratedCVResponse } from '@/lib/api/generated-types';
import type { QueryObserverResult } from '@tanstack/react-query';

// Mock useGenerationStatus hook
vi.mock('../../../../hooks/useGenerationStatus');

// Default mock implementation
beforeEach(() => {
  vi.mocked(useGenerationStatus).mockReturnValue({
    isOpen: true,
    closeModal: vi.fn(),
    isSuccess: true,
    status: 'success',
    data: null,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn()
  });
});

describe('Generation Parameters Integration', () => {
  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig(`jobs/:id/generate`, <GenerationParametersPage />),
    ]),
  ];

  test('should display job details and generation form', async () => {
    await setupFeatureTest({
      routes,
      initialPath: `/jobs/${mockJob.id}/generate`,
      authenticatedUser: true,
      handlers: [
        createGetHandler(`/jobs/${mockJob.id}`, 'JobDescriptionResponse', mockJob),
        ...cvGenerationHandlers
      ],
    });

    expect(screen.getByRole('heading', { name: new RegExp(mockJob.title, 'i') })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /notes for generation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate competences/i })).toBeInTheDocument();
  });

  test('should handle competences generation flow', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: `/jobs/${mockJob.id}/generate`,
      authenticatedUser: true,
      handlers: [
        createGetHandler(`/jobs/${mockJob.id}`, 'JobDescriptionResponse', mockJob),
        ...cvGenerationHandlers
      ],
    });

    const notesInput = screen.getByRole('textbox', { name: /notes for generation/i });
    await user.type(notesInput, 'Focus on leadership skills');

    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    await user.click(generateButton);

    // Loading state
    expect(screen.getByText(/generating competences/i)).toBeInTheDocument();

    // Generated competences
    await waitFor(() => {
      mockCompetencesResponse.core_competences.forEach(competence => {
        expect(screen.getByText(competence)).toBeInTheDocument();
      });
    });

    // Switch controls should be checked by default
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(mockCompetencesResponse.core_competences.length);
    expect(switches[0]).toBeChecked();
  });

  test('should validate competence selection', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: `/jobs/${mockJob.id}/generate`,
      authenticatedUser: true,
      handlers: [
        createGetHandler(`/jobs/${mockJob.id}`, 'JobDescriptionResponse', mockJob),
        ...cvGenerationHandlers
      ],
    });

    // Generate competences
    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    await user.click(generateButton);

    // Wait for competences
    await waitFor(() => {
      expect(screen.getAllByRole('switch')).toHaveLength(mockCompetencesResponse.core_competences.length);
    });

    // Unselect all competences
    const switches = screen.getAllByRole('switch');
    for (const switchEl of switches) {
      await user.click(switchEl);
    }

    // Try to proceed
    const proceedButton = screen.getByRole('button', {
      name: new RegExp(`proceed with 0 selected competences`, 'i')
    });
    await user.click(proceedButton);

    // Validation error
    expect(screen.getByText(/please select at least one competence/i)).toBeInTheDocument();
  });

  test('should show error when generation fails', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: `/jobs/${mockJob.id}/generate`,
      authenticatedUser: true,
      handlers: [
        createGetHandler(`/jobs/${mockJob.id}`, 'JobDescriptionResponse', mockJob),
        // Use the error handler directly
        cvGenerationHandlers[cvGenerationHandlers.length - 2] // Error handler for competences
      ]
    });

    // Try to generate
    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    await user.click(generateButton);

    // Error should be shown
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to generate competences/i);
    });
  });

  test('should close modal on successful CV generation', async () => {
    const closeModal = vi.fn();

    // Update the mock to use this specific closeModal function
    vi.mocked(useGenerationStatus).mockReturnValue({
      isOpen: true,
      closeModal,
      isSuccess: true,
      status: 'success',
      data: null,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn()
    });

    const { user } = await setupFeatureTest({
      routes,
      initialPath: `/jobs/${mockJob.id}/generate`,
      authenticatedUser: true,
      handlers: [
        createGetHandler(`/jobs/${mockJob.id}`, 'JobDescriptionResponse', mockJob),
        ...cvGenerationHandlers
      ],
    });

    // Generate competences
    const generateButton = screen.getByRole('button', { name: /generate competences/i });
    await user.click(generateButton);

    // Wait for proceed button and click
    await waitFor(async () => {
      const proceedButton = screen.getByRole('button', {
        name: new RegExp(`proceed with ${mockCompetencesResponse.core_competences.length} selected competences`, 'i')
      });
      await user.click(proceedButton);
    });

    // Modal should close
    await waitFor(() => {
      expect(closeModal).toHaveBeenCalled();
    });
  });
});
