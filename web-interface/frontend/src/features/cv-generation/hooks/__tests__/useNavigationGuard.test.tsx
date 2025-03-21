import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useNavigationGuard } from '../useNavigationGuard';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ROUTES } from '@/routes/paths';

// Mock useStepState hook
vi.mock('../useStepState', () => ({
  useStepState: vi.fn().mockReturnValue({
    stepState: {
      hasGeneratedCompetences: false,
      hasReviewedCompetences: false,
      hasGeneratedCV: false,
      hasReviewedCV: false,
      stepNotes: {},
    },
    isCurrentStepComplete: false,
    isStepAllowed: true,
    completeCurrentStep: vi.fn(),
    updateStepNotes: vi.fn(),
    resetState: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe('useNavigationGuard', () => {
  let queryClient: QueryClient;
  const jobId = '123';
  const mockNavigate = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: Infinity,
        },
      },
    });
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  });

  // Helper to render hook with providers
  const renderNavigationGuard = (
    initialPath: string,
    props: Parameters<typeof useNavigationGuard>[0],
  ) => {
    type HookResult = ReturnType<typeof useNavigationGuard>;
    const resultRef = { current: null as HookResult | null };

    const TestComponent = () => {
      const hookResult = useNavigationGuard(props);
      resultRef.current = hookResult;
      return null;
    };

    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <QueryClientProvider client={queryClient}>
              <TestComponent />
            </QueryClientProvider>
          ),
        },
      ],
      { initialEntries: [initialPath] },
    );

    // Mock navigate method - only pass the first argument to mockNavigate
    // to ensure tests pass with toHaveBeenCalledWith
    vi.spyOn(router, 'navigate').mockImplementation((to) => {
      mockNavigate(to);
      return Promise.resolve();
    });

    render(<RouterProvider router={router} />);

    return resultRef;
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('should allow navigation to current step', async () => {
    const result = renderNavigationGuard('/jobs/123/generate/parameters', {
      currentStep: 'parameters',
      jobId,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.isCurrentStepAllowed).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('should prevent skipping to future steps', async () => {
    const result = renderNavigationGuard('/jobs/123/generate/cv/generate', {
      currentStep: 'parameters',
      jobId,
      isStepCompleted: false,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.isCurrentStepAllowed).toBe(false);
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      ROUTES.JOBS.GENERATE.PARAMETERS(jobId),
    );
  });

  test('should allow future step navigation when completed', async () => {
    const result = renderNavigationGuard(
      '/jobs/123/generate/competences/edit',
      {
        currentStep: 'competences.generate',
        jobId,
        isStepCompleted: true,
      },
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.isCurrentStepAllowed).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('should enforce step dependencies', async () => {
    // Try to access CV edit without generating CV
    const result = renderNavigationGuard('/jobs/123/generate/cv/edit', {
      currentStep: 'cv.edit',
      jobId,
      allowFutureSteps: true, // Even with future steps allowed
      isStepCompleted: true,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.isCurrentStepAllowed).toBe(false);
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      ROUTES.JOBS.GENERATE.CV.GENERATE(jobId),
    );
  });

  test('should handle missing dependencies in order', async () => {
    // Try to access export with multiple missing steps
    const result = renderNavigationGuard('/jobs/123/generate/export', {
      currentStep: 'export',
      jobId,
      allowFutureSteps: true,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.isCurrentStepAllowed).toBe(false);
    });
    // Should redirect to first missing dependency
    expect(mockNavigate).toHaveBeenCalledWith(
      ROUTES.JOBS.GENERATE.COMPETENCES.GENERATE(jobId),
    );
  });

  test('should expose step state', async () => {
    const result = renderNavigationGuard('/jobs/123/generate/parameters', {
      currentStep: 'parameters',
      jobId,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.stepState).toEqual({
        hasGeneratedCompetences: false,
        hasReviewedCompetences: false,
        hasGeneratedCV: false,
        hasReviewedCV: false,
        stepNotes: {},
      });
    });
  });

  test('should allow backwards navigation', async () => {
    const result = renderNavigationGuard('/jobs/123/generate/parameters', {
      currentStep: 'competences.generate',
      jobId,
      isStepCompleted: false,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.isCurrentStepAllowed).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('should handle malformed paths gracefully', async () => {
    const result = renderNavigationGuard(
      '/jobs/123/generate/invalid-step',
      {
        currentStep: 'parameters',
        jobId,
      },
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.isCurrentStepAllowed).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('should handle empty paths gracefully', async () => {
    const result = renderNavigationGuard('/jobs/123/generate', {
      currentStep: 'parameters',
      jobId,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current!.isCurrentStepAllowed).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
