import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGenerationStatus } from '../useGenerationStatus';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GENERATION_STATUS } from '../../constants';
import type { components } from '../../../../lib/api/types';

// Mock API functions first, before importing them
vi.mock('../../api/cvGenerationApi');

// Import API module after mocking
import * as api from '../../api/cvGenerationApi';

// Type-safe mock data
const mockGeneratingCV: components['schemas']['GeneratedCVResponse'] = {
  id: 123,
  generation_status: GENERATION_STATUS.GENERATING,
  // Include all required fields to satisfy the schema
  job_description_id: 456,
  language_code: 'en',
  status: 'active',
  created_at: '2025-03-01T10:00:00Z',
  updated_at: '2025-03-01T10:05:00Z',
  user_id: 789,
  detailed_cv_id: 101,
  content: {},
};

const mockCompletedCV: components['schemas']['GeneratedCVResponse'] = {
  ...mockGeneratingCV,
  generation_status: GENERATION_STATUS.COMPLETED,
};

describe('useGenerationStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0
        }
      }
    });

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  });

  // Helper render function
  const renderStatusHook = (cvId?: number, onComplete?: (data: components['schemas']['GeneratedCVResponse']) => void) => {
    return renderHook(
      () => useGenerationStatus(cvId as number, onComplete),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      }
    );
  };

  test('should be disabled when no cvId is provided', async () => {
    // Render hook without cvId
    const { result } = renderStatusHook(undefined);

    // Verify query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);

    // Verify API was not called
    expect(api.getGeneratedCV).not.toHaveBeenCalled();
  });

  test('should fetch data when cvId is provided', async () => {
    // Mock API response
    vi.mocked(api.getGeneratedCV).mockResolvedValue(mockGeneratingCV);

    // Render hook with valid cvId
    const { result } = renderStatusHook(123);

    // Wait for query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API was called with correct parameter
    expect(api.getGeneratedCV).toHaveBeenCalledWith(123);

    // Verify data matches mock response
    expect(result.current.data).toEqual(mockGeneratingCV);
  });

  test('should execute callback when generation completes', async () => {
    // Set up query observer to track refetch interval changes
    const observer = vi.fn();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    queryClient.getQueryCache().subscribe(observer);

    // Mock API to return COMPLETED status
    vi.mocked(api.getGeneratedCV).mockResolvedValueOnce(mockGeneratingCV);

    // Mock callback
    const onCompleteMock = vi.fn();

    // Render hook with callback
    renderStatusHook(123, onCompleteMock);

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(observer).toHaveBeenCalled();
    });

    // Verify initial state didn't trigger callback
    expect(onCompleteMock).not.toHaveBeenCalled();

    // Now mock the completed state
    vi.mocked(api.getGeneratedCV).mockResolvedValueOnce(mockCompletedCV);

    // Get the observer's latest call
    const latestCall = observer.mock.calls[observer.mock.calls.length - 1];
    const query = latestCall[0].query;

    // Manually trigger a fetch to simulate polling
    await query.fetch();

    // Wait for completion and verify callback was called once
    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledWith(mockCompletedCV);
    });
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  test('should not execute callback when status is GENERATING', async () => {
    // Mock callback
    const onCompleteMock = vi.fn();

    // Mock API to return GENERATING status
    vi.mocked(api.getGeneratedCV).mockResolvedValue(mockGeneratingCV);

    // Render hook with callback
    const { result } = renderStatusHook(123, onCompleteMock);

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify callback was not called
    expect(onCompleteMock).not.toHaveBeenCalled();
  });

  test('should handle 404 error without retrying', async () => {
    // Create error with statusCode
    const error = new Error('Not Found');
    Object.assign(error, { statusCode: 404 });

    // Mock API to throw 404
    vi.mocked(api.getGeneratedCV).mockRejectedValue(error);

    // Render hook
    const { result } = renderStatusHook(123);

    // Wait for error state
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should only be called once (no retries)
    expect(api.getGeneratedCV).toHaveBeenCalledTimes(1);
  });

  test('should handle and retry other errors', async () => {
    // Configure query client with retry settings matching the hook's logic
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // The hook retries up to 3 times for non-404 errors
          retry: false, // Disable automatic retries, we'll use the hook's custom retry logic
          retryDelay: 1, // Minimal delay for faster tests
          gcTime: 0
        }
      }
    });

    // Create error (not a 404)
    const error = new Error('Network error');

    // Mock API to consistently throw error
    const mockApi = vi.mocked(api.getGeneratedCV);
    mockApi.mockRejectedValue(error);

    // Render hook
    const { result } = renderStatusHook(123);

    // Wait for error state and retries to complete
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
        // The hook's retry logic will retry up to 3 times for non-404 errors
        // So we expect 4 total calls (1 initial + 3 retries)
        expect(result.current.failureCount).toBe(4);
      },
      { timeout: 500 }
    );

    // Verify exact number of calls
    expect(mockApi).toHaveBeenCalledTimes(4);
  });

  test('should stop polling when status changes from GENERATING to COMPLETED', async () => {
    // Set up query client with fast polling
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchInterval: 10,
          staleTime: 0,
          gcTime: 0,
          retry: false
        }
      }
    });

    // Mock API sequence
    const mockApi = vi.mocked(api.getGeneratedCV);

    // First call returns GENERATING, subsequent calls return COMPLETED
    mockApi.mockResolvedValueOnce(mockGeneratingCV);
    mockApi.mockResolvedValue(mockCompletedCV); // All subsequent calls

    // Create a hook instance
    const { result } = renderStatusHook(123);

    // Wait for initial GENERATING status
    await waitFor(() => {
      expect(result.current.data?.generation_status).toBe(GENERATION_STATUS.GENERATING);
    });

    // Record the number of API calls after initial fetch
    const initialCalls = mockApi.mock.calls.length;

    // Manually trigger refetch to ensure the mock returns the completed status
    await result.current.refetch();

    // Wait for status to change to COMPLETED
    await waitFor(() => {
      expect(result.current.data?.generation_status).toBe(GENERATION_STATUS.COMPLETED);
    });

    // Record the number of calls at completion
    const completionCalls = mockApi.mock.calls.length;

    // Verify that at least one additional call was made (polling worked)
    expect(completionCalls).toBeGreaterThan(initialCalls);

    // Wait a bit to check if polling stops
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify no additional calls were made after COMPLETED
    expect(mockApi.mock.calls.length).toBe(completionCalls);
  });

  test('should execute callback for each completed CV', async () => {
    const onCompleteMock = vi.fn();

    // Create two different completed CVs
    const cv1 = mockCompletedCV;
    const cv2 = {
      ...mockCompletedCV,
      id: 456,
      job_description_id: 789
    };

    // Mock API to return appropriate CV based on ID
    const mockApi = vi.mocked(api.getGeneratedCV);
    mockApi.mockImplementation((id) => {
      return Promise.resolve(id === 123 ? cv1 : cv2);
    });

    // Set up query client with minimal settings
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnMount: true, // Ensure refetch when rerender happens
          refetchOnWindowFocus: false,
          gcTime: 0 // Prevent query cache across tests
        }
      }
    });

    // Create a hook instance with the first CV ID
    const { rerender } = renderStatusHook(123, onCompleteMock);

    // Wait for first CV to complete and callback to be called
    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledWith(cv1);
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
    });

    // Reset the callback mock to clearly see the second call
    onCompleteMock.mockClear();

    // Change to second CV - this should trigger a rerender and new query
    rerender();

    // Manually update the hook with the new CV ID
    const { result: newResult } = renderStatusHook(456, onCompleteMock);

    // Wait for data to be fetched for the second CV
    await waitFor(() => {
      expect(newResult.current.isSuccess).toBe(true);
    });

    // Check that the callback was called for the second CV
    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledWith(cv2);
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
    });
  });
});
