import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStepState } from '../useStepState';
import { GenerationStep } from '@/features/cv-generation/utils';

// Mock useGenerationStatus hook
vi.mock('../useGenerationStatus', () => ({
  useGenerationStatus: () => ({
    isLoading: false,
    error: null,
  }),
}));

describe('useStepState', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: Infinity,
        },
        mutations: {
          retry: false,
          networkMode: 'always',
        }
      }
    });
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  test('should initialize with default state', () => {
    const { result } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'parameters',
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.stepState).toEqual({
      hasGeneratedCompetences: false,
      hasReviewedCompetences: false,
      hasGeneratedCV: false,
      hasReviewedCV: false,
      stepNotes: {},
    });
  });

  test('should update step completion state', async () => {
    const { result } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'competences.generate' as GenerationStep,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isCurrentStepComplete).toBe(false);

    await act(async () => {
      await result.current.completeCurrentStep();
    });

    // Wait for cache update
    await waitFor(() => {
      expect(result.current.stepState.hasGeneratedCompetences).toBe(true);
    });
    expect(result.current.isCurrentStepComplete).toBe(true);
  });

  test('should manage step notes', async () => {
    const testNote = 'Focus on leadership skills';
    const { result } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'parameters' as GenerationStep,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.updateStepNotes(testNote);
    });

    // Wait for cache update
    await waitFor(() => {
      expect(result.current.stepState.stepNotes.parameters).toBe(testNote);
    });
  });

  test('should enforce step dependencies', async () => {
    // First instance for prerequisites
    const { result: prerequisites } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'competences.generate' as GenerationStep,
        }),
      { wrapper: createWrapper() },
    );

    // Can't access CV generation initially
    const { result: cvGeneration } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'cv.generate' as GenerationStep,
        }),
      { wrapper: createWrapper() },
    );
    expect(cvGeneration.current.isStepAllowed).toBe(false);

    // Complete prerequisites
    await act(async () => {
      prerequisites.current.completeCurrentStep();
    });

    // Switch to edit step and complete review
    const { result: competenceReview } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'competences.edit' as GenerationStep,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      competenceReview.current.completeCurrentStep();
    });

    // Now CV generation should be allowed
    expect(cvGeneration.current.isStepAllowed).toBe(true);
  });

  test('should reset state', async () => {
    const { result } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'parameters' as GenerationStep,
        }),
      { wrapper: createWrapper() },
    );

    // Set some state
    await act(async () => {
      result.current.updateStepNotes('Test notes');
      result.current.completeCurrentStep();
    });

    // Reset state
    await act(async () => {
      result.current.resetState();
    });

    // Verify reset
    expect(result.current.stepState).toEqual({
      hasGeneratedCompetences: false,
      hasReviewedCompetences: false,
      hasGeneratedCV: false,
      hasReviewedCV: false,
      stepNotes: {},
    });
  });

  test('should persist state between instances', async () => {
    // First instance
    const { result: result1 } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'parameters' as GenerationStep,
        }),
      { wrapper: createWrapper() },
    );

    // Set state in first instance
    await act(async () => {
      result1.current.updateStepNotes('Test notes');
    });

    // Second instance with same jobId
    const { result: result2 } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'parameters' as GenerationStep,
        }),
      { wrapper: createWrapper() },
    );

    // State should be shared
    expect(result2.current.stepState.stepNotes.parameters).toBe('Test notes');
  });

  test('should handle generation status', () => {
    const { result } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'parameters' as GenerationStep,
          cvId: 456,
        }),
      { wrapper: createWrapper() },
    );

    // Verify generation status is exposed
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeDefined();
  });

  test('should handle multiple steps for same job', async () => {
    const wrapper = createWrapper();

    // First instance for parameters
    const { result: parametersResult } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'parameters' as GenerationStep,
        }),
      { wrapper },
    );

    // Update notes in parameters
    await act(async () => {
      await parametersResult.current.updateStepNotes('Parameter notes');
    });

    // Wait for first update
    await waitFor(() => {
      expect(parametersResult.current.stepState.stepNotes.parameters).toBe('Parameter notes');
    });

    // Instance for competences step
    const { result: competencesResult } = renderHook(
      () =>
        useStepState({
          jobId: '123',
          currentStep: 'competences.generate' as GenerationStep,
        }),
      { wrapper },
    );

    // Add notes for competences
    await act(async () => {
      await competencesResult.current.updateStepNotes('Competences notes');
    });

    // Wait for both updates to be reflected
    await waitFor(() => {
      expect(competencesResult.current.stepState.stepNotes).toEqual({
        parameters: 'Parameter notes',
        'competences.generate': 'Competences notes',
      });
    });
  });
});
