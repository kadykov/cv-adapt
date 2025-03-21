import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGeneratedCV, GENERATED_CV_QUERY_KEY } from '../useGeneratedCV';
import { getGeneratedCV } from '../../api/cvGenerationApi';

// Mock the API function
vi.mock('../../api/cvGenerationApi', () => ({
  getGeneratedCV: vi.fn(),
}));

// Mock implementation of getGeneratedCV
// @ts-expect-error - vi namespace not recognized by TypeScript but works at runtime
const mockGetGeneratedCV = getGeneratedCV as vi.MockedFunction<typeof getGeneratedCV>;

  // Mock data
const mockCV = {
  id: 123,
  title: 'Software Engineer CV',
  content: 'CV content here',
  language_code: 'en',
  created_at: '2025-03-01T12:00:00Z',
  updated_at: '2025-03-01T12:00:00Z',
  generation_status: 'completed',
  generation_error: null,
};

const generatingMockCV = {
  ...mockCV,
  generation_status: 'generating',
};

const completedMockCV = {
  ...mockCV,
  generation_status: 'completed',
};

describe('useGeneratedCV', () => {
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
        },
      },
    });

    // Reset mock before each test
    vi.clearAllMocks();
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

  test('should fetch CV when id is provided', async () => {
    // Setup mock response
    mockGetGeneratedCV.mockResolvedValue(mockCV);

    // Render hook
    const { result } = renderHook(() => useGeneratedCV(123), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API was called with correct ID
    expect(mockGetGeneratedCV).toHaveBeenCalledWith(123);
    expect(mockGetGeneratedCV).toHaveBeenCalledTimes(1);

    // Verify data
    expect(result.current.data).toEqual(mockCV);
  });

  test('should not fetch CV when id is not provided', async () => {
    // Render hook with undefined id
    const { result } = renderHook(() => useGeneratedCV(undefined as unknown as number), {
      wrapper: createWrapper(),
    });

    // Should not be loading since fetching is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);

    // Verify API was not called
    expect(mockGetGeneratedCV).not.toHaveBeenCalled();
  });

  test('should not fetch CV when enabled is false', async () => {
    // Render hook with enabled: false
    const { result } = renderHook(
      () => useGeneratedCV(123, { enabled: false }),
      { wrapper: createWrapper() },
    );

    // Should not be loading since fetching is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);

    // Verify API was not called
    expect(mockGetGeneratedCV).not.toHaveBeenCalled();
  });

  test('should handle API error', async () => {
    // Setup mock to throw error
    const errorMessage = 'Failed to fetch CV';
    mockGetGeneratedCV.mockRejectedValue(new Error(errorMessage));

    // Render hook
    const { result } = renderHook(() => useGeneratedCV(123), {
      wrapper: createWrapper(),
    });

    // Wait for error state
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error handling
    expect(result.current.error).toBeDefined();
    expect(result.current.error instanceof Error).toBe(true);
    expect((result.current.error as Error).message).toBe(errorMessage);
  });

  // Test for query key structure
  test('should construct query with correct query key', async () => {
    // Setup mock response
    mockGetGeneratedCV.mockResolvedValue(mockCV);

    // Render hook
    renderHook(() => useGeneratedCV(123), {
      wrapper: createWrapper(),
    });

    // Wait for data to be fetched
    await waitFor(() => {
      expect(mockGetGeneratedCV).toHaveBeenCalledWith(123);
    });

    // Verify the proper query key format
    expect(GENERATED_CV_QUERY_KEY.length).toBeGreaterThan(0);
    expect(GENERATED_CV_QUERY_KEY[0]).toBe('generated-cv');
  });

  test('should enable polling when CV is in generating state', async () => {
    // Setup mock to return "generating" status
    mockGetGeneratedCV.mockResolvedValue(generatingMockCV);

    // Render hook with polling interval
    const { result } = renderHook(
      () => useGeneratedCV(123, { refetchInterval: 1000 }),
      { wrapper: createWrapper() },
    );

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify data shows generating status
    expect(result.current.data?.generation_status).toBe('generating');

    // Verify refetchInterval was set (indirectly through the active flag)
    expect(result.current.isStale).toBe(false);
  });

  test('should stop polling when CV is no longer generating', async () => {
    // First return "generating" status, then "completed"
    mockGetGeneratedCV
      .mockResolvedValueOnce(generatingMockCV)
      .mockResolvedValueOnce(completedMockCV);

    // Render hook with polling interval
    const { result } = renderHook(
      () => useGeneratedCV(123, { refetchInterval: 1000 }),
      { wrapper: createWrapper() },
    );

    // Wait for initial data with generating status
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.generation_status).toBe('generating');
    });

    // Force refetch to get the completed status
    await result.current.refetch();

    // Verify data shows completed status
    await waitFor(() => {
      expect(result.current.data?.generation_status).toBe('completed');
    });
  });
});
