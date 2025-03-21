import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGeneratedCVMutations } from '../useGeneratedCVMutations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GENERATED_CV_QUERY_KEY } from '../useGeneratedCV';
import { GENERATED_CVS_QUERY_KEY } from '../useGeneratedCVs';
import type { components } from '@/lib/api/types';

// Must mock API functions first, before importing them
vi.mock('@/features/cv-generation/api/cvGenerationApi');

// Import the API module after mocking
import * as apiModule from '@/features/cv-generation/api/cvGenerationApi';

// Create mock data with proper types
const mockGenerateCVRequest: components['schemas']['GenerateCVRequest'] = {
  cv_text: "Professional software engineer with experience in React and TypeScript",
  job_description: "We are looking for a skilled software developer with React experience",
  personal_info: {
    full_name: "John Doe",
    email: {
      value: "john@example.com",
      type: "email",
    },
  },
  approved_competences: ["React", "TypeScript", "Frontend Development"],
  notes: "Focus on technical skills",
};

const mockGeneratedCVResponse = {
  id: 789,
  job_id: 123,
  language_code: 'en',
  status: 'completed',
  created_at: '2025-03-21T12:00:00Z',
  updated_at: '2025-03-21T12:05:00Z',
  content: {
    summary: 'Professional software engineer with expertise in React and TypeScript',
    sections: [
      {
        title: 'Experience',
        items: [
          {
            title: 'Senior Developer',
            organization: 'Tech Company',
            start_date: '2020-01',
            end_date: '2023-12',
            description: 'Led development teams on critical projects',
          },
        ],
      },
    ],
  },
};

describe('useGeneratedCVMutations', () => {
  let queryClient: QueryClient;

  // Setup before each test
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Reset mock implementations
    vi.clearAllMocks();

    // Spy on queryClient methods to verify cache operations
    vi.spyOn(queryClient, 'invalidateQueries');
  });

  // Clean up after each test
  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  });

  // Helper to render the hook with the QueryClientProvider
  const renderMutationsHook = () => {
    return renderHook(() => useGeneratedCVMutations(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });
  };

  describe('generateCV mutation', () => {
    test('should successfully generate a CV and invalidate queries', async () => {
      // Mock the API response
      vi.mocked(apiModule.generateCV).mockResolvedValue(mockGeneratedCVResponse);

      // Render the hook
      const { result, rerender } = renderMutationsHook();

      // Initial state check
      expect(result.current.generateCV.isPending).toBe(false);

      // Trigger the mutation
      let resolvedData;
      await act(async () => {
        resolvedData = await result.current.generateCV.mutateAsync(mockGenerateCVRequest);
      });

      // Force a rerender to ensure state is updated
      rerender();

      // Verify the API was called
      expect(apiModule.generateCV).toHaveBeenCalledTimes(1);
      expect(apiModule.generateCV).toHaveBeenCalledWith(mockGenerateCVRequest);

      // Verify the returned data
      expect(resolvedData).toEqual(mockGeneratedCVResponse);

      // Verify the API was called (no need to check again - removed duplicate)

      // Verify cache invalidations
      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: GENERATED_CVS_QUERY_KEY
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: GENERATED_CV_QUERY_KEY
      });

      // Verify the response data
      expect(result.current.generateCV.data).toEqual(mockGeneratedCVResponse);
    });

    test('should handle error when CV generation fails', async () => {
      // Create a mock error
      const mockError = new Error('Failed to generate CV');

      // Mock the API to throw an error
      vi.mocked(apiModule.generateCV).mockRejectedValue(mockError);

      // Render the hook
      const { result, rerender } = renderMutationsHook();

      // Try to execute the mutation and catch the error
      let caughtError = null;
      await act(async () => {
        try {
          await result.current.generateCV.mutateAsync(mockGenerateCVRequest);
        } catch (e) {
          caughtError = e;
        }
      });

      // Force a rerender to ensure state is updated
      rerender();

      // Verify the API was called
      expect(apiModule.generateCV).toHaveBeenCalledTimes(1);
      expect(apiModule.generateCV).toHaveBeenCalledWith(mockGenerateCVRequest);

      // Verify the error was caught
      expect(caughtError).toBe(mockError);

      // Verify the API was called (no need to check again - removed duplicate)

      // Verify no cache invalidations occurred
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();

      // Verify the error was returned
      expect(caughtError).toBe(mockError);
    });

    test('should not invalidate cache when mutation is cancelled', async () => {
      // Need to track if invalidateQueries was called
      let queriesInvalidated = false;

      // Set up the queryClient with a custom implementation
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });

      // Override the invalidateQueries method to track calls
      queryClient.invalidateQueries = vi.fn((filters, options) => {
        queriesInvalidated = true;
        // Call original implementation for other tests
        return QueryClient.prototype.invalidateQueries.call(queryClient, filters, options);
      });

      // Mock the API with a slow response that never resolves
      vi.mocked(apiModule.generateCV).mockImplementation(() => {
        return new Promise(() => {
          // This promise never resolves or rejects
        });
      });

      // Render the hook with the prepared queryClient
      const { result } = renderMutationsHook();

      // Start the mutation but don't await it
      act(() => {
        result.current.generateCV.mutateAsync(mockGenerateCVRequest)
          .catch(() => null); // Catch the cancellation error
      });

      // Wait for the mutation to be pending
      await waitFor(() => {
        expect(result.current.generateCV.isPending).toBe(true);
      });

      // Verify API was called
      expect(apiModule.generateCV).toHaveBeenCalledTimes(1);

      // Now cancel all mutations before they complete
      act(() => {
        queryClient.getMutationCache().clear();
      });

      // Reset the mocks for our assertions
      vi.clearAllMocks();
      queriesInvalidated = false;

      // Give React time to process the cancellation
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify that the invalidateQueries was not called after cancellation
      expect(queriesInvalidated).toBe(false);
    });
  });

  describe('generateCompetences mutation', () => {
    // Create mock data for competences
    const mockGenerateCompetencesRequest: components['schemas']['GenerateCompetencesRequest'] = {
      cv_text: "React developer with 5 years of experience",
      job_description: "Looking for a senior React developer",
      notes: "Focus on frontend technologies"
    };

    const mockCompetencesResponse = {
      core_competences: [
        "React Development",
        "Frontend Architecture",
        "TypeScript",
        "UI/UX Implementation"
      ]
    };

    test('should successfully generate competences and invalidate queries', async () => {
      // Mock the API response
      vi.mocked(apiModule.generateCompetences).mockResolvedValue(mockCompetencesResponse);

      // Render the hook
      const { result, rerender } = renderMutationsHook();

      // Trigger the mutation
      let resolvedData;
      await act(async () => {
        resolvedData = await result.current.generateCompetences.mutateAsync(mockGenerateCompetencesRequest);
      });

      // Force a rerender
      rerender();

      // Verify the API was called
      expect(apiModule.generateCompetences).toHaveBeenCalledTimes(1);
      expect(apiModule.generateCompetences).toHaveBeenCalledWith(mockGenerateCompetencesRequest);

      // Verify the returned data
      expect(resolvedData).toEqual(mockCompetencesResponse);

      // Verify cache invalidation - only invalidates CVs list, not individual CV
      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: GENERATED_CVS_QUERY_KEY
      });
    });

    test('should handle error when competences generation fails', async () => {
      // Create a mock error
      const mockError = new Error('Failed to generate competences');

      // Mock the API to throw an error
      vi.mocked(apiModule.generateCompetences).mockRejectedValue(mockError);

      // Render the hook
      const { result, rerender } = renderMutationsHook();

      // Try to execute the mutation and catch the error
      let caughtError = null;
      await act(async () => {
        try {
          await result.current.generateCompetences.mutateAsync(mockGenerateCompetencesRequest);
        } catch (e) {
          caughtError = e;
        }
      });

      // Force a rerender
      rerender();

      // Verify the API was called
      expect(apiModule.generateCompetences).toHaveBeenCalledTimes(1);
      expect(apiModule.generateCompetences).toHaveBeenCalledWith(mockGenerateCompetencesRequest);

      // Verify the error was caught
      expect(caughtError).toBe(mockError);

      // Verify no cache invalidations occurred
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe('updateGeneratedCV mutation', () => {
    // Create mock data for CV update
    const mockUpdateData: components['schemas']['GeneratedCVUpdate'] = {
      status: 'completed',
      generation_parameters: {
        includePersonalProjects: true,
        highlightTechnicalSkills: true
      }
    };

    const mockUpdatedCV = {
      id: 123,
      user_id: 456,
      job_description_id: 789,
      detailed_cv_id: 101,
      language_code: 'en',
      status: 'completed',
      generation_status: 'completed',
      created_at: '2025-03-21T10:00:00Z',
      updated_at: '2025-03-21T11:00:00Z',
      generation_parameters: {
        includePersonalProjects: true,
        highlightTechnicalSkills: true
      }
    };

    test('should successfully update a CV and update cache', async () => {
      // Mock the API response
      vi.mocked(apiModule.updateGeneratedCV).mockResolvedValue(mockUpdatedCV);

      // Render the hook
      const { result, rerender } = renderMutationsHook();

      // Spy on queryClient.setQueryData
      vi.spyOn(queryClient, 'setQueryData');

      // Prepare update parameters
      const updateParams = {
        id: 123,
        data: mockUpdateData
      };

      // Trigger the mutation
      let resolvedData;
      await act(async () => {
        resolvedData = await result.current.updateGeneratedCV.mutateAsync(updateParams);
      });

      // Force a rerender
      rerender();

      // Verify the API was called with correct parameters
      expect(apiModule.updateGeneratedCV).toHaveBeenCalledTimes(1);
      expect(apiModule.updateGeneratedCV).toHaveBeenCalledWith(123, mockUpdateData);

      // Verify the returned data
      expect(resolvedData).toEqual(mockUpdatedCV);

      // Verify cache updates - should update the specific CV and invalidate the list
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(1);
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        [...GENERATED_CV_QUERY_KEY, mockUpdatedCV.id],
        mockUpdatedCV
      );

      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: GENERATED_CVS_QUERY_KEY
      });
    });

    test('should handle error when CV update fails', async () => {
      // Create a mock error
      const mockError = new Error('Failed to update CV');

      // Mock the API to throw an error
      vi.mocked(apiModule.updateGeneratedCV).mockRejectedValue(mockError);

      // Render the hook
      const { result, rerender } = renderMutationsHook();

      // Spy on queryClient.setQueryData
      vi.spyOn(queryClient, 'setQueryData');

      // Prepare update parameters
      const updateParams = {
        id: 123,
        data: mockUpdateData
      };

      // Try to execute the mutation and catch the error
      let caughtError = null;
      await act(async () => {
        try {
          await result.current.updateGeneratedCV.mutateAsync(updateParams);
        } catch (e) {
          caughtError = e;
        }
      });

      // Force a rerender
      rerender();

      // Verify the API was called
      expect(apiModule.updateGeneratedCV).toHaveBeenCalledTimes(1);
      expect(apiModule.updateGeneratedCV).toHaveBeenCalledWith(123, mockUpdateData);

      // Verify the error was caught
      expect(caughtError).toBe(mockError);

      // Verify no cache updates occurred
      expect(queryClient.setQueryData).not.toHaveBeenCalled();
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe('deleteGeneratedCV mutation', () => {
    test('should successfully delete a CV and update cache', async () => {
      // Mock the API to return undefined (successful deletion)
      vi.mocked(apiModule.deleteGeneratedCV).mockResolvedValue(undefined);

      // Render the hook
      const { result, rerender } = renderMutationsHook();

      // Spy on queryClient.removeQueries
      vi.spyOn(queryClient, 'removeQueries');

      // CV ID to delete
      const cvId = 123;

      // Trigger the mutation
      await act(async () => {
        await result.current.deleteGeneratedCV.mutateAsync(cvId);
      });

      // Force a rerender
      rerender();

      // Verify the API was called with correct parameters
      expect(apiModule.deleteGeneratedCV).toHaveBeenCalledTimes(1);
      expect(apiModule.deleteGeneratedCV).toHaveBeenCalledWith(cvId);

      // Verify cache updates - should remove the specific CV and invalidate the list
      expect(queryClient.removeQueries).toHaveBeenCalledTimes(1);
      expect(queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: [...GENERATED_CV_QUERY_KEY, cvId]
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: GENERATED_CVS_QUERY_KEY
      });
    });

    test('should handle error when CV deletion fails', async () => {
      // Create a mock error
      const mockError = new Error('Failed to delete CV');

      // Mock the API to throw an error
      vi.mocked(apiModule.deleteGeneratedCV).mockRejectedValue(mockError);

      // Render the hook
      const { result, rerender } = renderMutationsHook();

      // Spy on queryClient.removeQueries
      vi.spyOn(queryClient, 'removeQueries');

      // CV ID to delete
      const cvId = 123;

      // Try to execute the mutation and catch the error
      let caughtError = null;
      await act(async () => {
        try {
          await result.current.deleteGeneratedCV.mutateAsync(cvId);
        } catch (e) {
          caughtError = e;
        }
      });

      // Force a rerender
      rerender();

      // Verify the API was called
      expect(apiModule.deleteGeneratedCV).toHaveBeenCalledTimes(1);
      expect(apiModule.deleteGeneratedCV).toHaveBeenCalledWith(cvId);

      // Verify the error was caught
      expect(caughtError).toBe(mockError);

      // Verify no cache updates occurred
      expect(queryClient.removeQueries).not.toHaveBeenCalled();
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
  });
});
