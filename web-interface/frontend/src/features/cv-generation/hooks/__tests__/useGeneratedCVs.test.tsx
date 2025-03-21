import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGeneratedCVs, GENERATED_CVS_QUERY_KEY } from '../useGeneratedCVs';
import { getGeneratedCVs } from '../../api/cvGenerationApi';

// Mock the API function
vi.mock('../../api/cvGenerationApi', () => ({
  getGeneratedCVs: vi.fn(),
}));

// Mock implementation of getGeneratedCVs
// @ts-expect-error - vi namespace not recognized by TypeScript but works at runtime
const mockGetGeneratedCVs = getGeneratedCVs as vi.MockedFunction<typeof getGeneratedCVs>;

// Mock paginated response data
const mockCVs = [
  {
    id: 1,
    title: 'Software Engineer CV',
    content: 'CV content here',
    language_code: 'en',
    created_at: '2025-03-01T12:00:00Z',
    updated_at: '2025-03-01T12:00:00Z',
    generation_status: 'completed',
    generation_error: null,
  },
  {
    id: 2,
    title: 'Product Manager CV',
    content: 'Another CV content',
    language_code: 'en',
    created_at: '2025-03-01T12:30:00Z',
    updated_at: '2025-03-01T12:30:00Z',
    generation_status: 'completed',
    generation_error: null,
  },
];

const mockPaginatedResponse = {
  items: mockCVs,
  total: 2,
  offset: 0,
  limit: 10,
  has_more: false,
};

describe('useGeneratedCVs', () => {
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

  test('should fetch CVs with default parameters', async () => {
    // Setup mock response
    mockGetGeneratedCVs.mockResolvedValue(mockPaginatedResponse);

    // Render hook
    const { result } = renderHook(() => useGeneratedCVs(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API was called with correct default parameters
    expect(mockGetGeneratedCVs).toHaveBeenCalledWith({
      language_code: 'en',
      offset: 0,
      limit: 10,
    });
    expect(mockGetGeneratedCVs).toHaveBeenCalledTimes(1);

    // Verify data
    expect(result.current.data).toEqual(mockPaginatedResponse);
  });

  test('should not fetch when enabled is false', async () => {
    // Render hook with enabled: false
    const { result } = renderHook(
      () => useGeneratedCVs({ enabled: false }),
      { wrapper: createWrapper() },
    );

    // Should not be loading since fetching is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);

    // Verify API was not called
    expect(mockGetGeneratedCVs).not.toHaveBeenCalled();
  });

  test('should handle API error', async () => {
    // Setup mock to throw error
    const errorMessage = 'Failed to fetch CVs';
    mockGetGeneratedCVs.mockRejectedValue(new Error(errorMessage));

    // Render hook
    const { result } = renderHook(() => useGeneratedCVs(), {
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

  test('should construct query with correct query key', async () => {
    // Setup mock response
    mockGetGeneratedCVs.mockResolvedValue(mockPaginatedResponse);

    // Render hook
    renderHook(() => useGeneratedCVs(), {
      wrapper: createWrapper(),
    });

    // Wait for data to be fetched
    await waitFor(() => {
      expect(mockGetGeneratedCVs).toHaveBeenCalled();
    });

    // Verify the proper query key format
    expect(GENERATED_CVS_QUERY_KEY.length).toBeGreaterThan(0);
    expect(GENERATED_CVS_QUERY_KEY[0]).toBe('generated-cvs');
  });

  test('should apply custom filter parameters', async () => {
    // Setup mock response
    mockGetGeneratedCVs.mockResolvedValue(mockPaginatedResponse);

    // Custom filter parameters
    const filterParams = {
      languageCode: 'fr',
      status: 'completed',
      startDate: '2025-01-01',
      endDate: '2025-03-01',
    };

    // Render hook with filter params
    const { result } = renderHook(() => useGeneratedCVs(filterParams), {
      wrapper: createWrapper(),
    });

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API was called with correct parameters
    expect(mockGetGeneratedCVs).toHaveBeenCalledWith({
      language_code: 'fr',
      offset: 0,
      limit: 10,
      status: 'completed',
      start_date: '2025-01-01',
      end_date: '2025-03-01',
    });
  });

  test('should handle pagination parameters', async () => {
    // Setup mock response
    mockGetGeneratedCVs.mockResolvedValue({
      ...mockPaginatedResponse,
      offset: 10,
      limit: 5,
    });

    // Pagination parameters
    const paginationParams = {
      offset: 10,
      limit: 5,
    };

    // Render hook with pagination params
    const { result } = renderHook(() => useGeneratedCVs(paginationParams), {
      wrapper: createWrapper(),
    });

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API was called with correct pagination parameters
    expect(mockGetGeneratedCVs).toHaveBeenCalledWith({
      language_code: 'en',
      offset: 10,
      limit: 5,
    });

    // Verify paginated response data
    expect(result.current.data?.offset).toBe(10);
    expect(result.current.data?.limit).toBe(5);
  });

  test('should include all parameters in query key for cache management', async () => {
    // Setup mock response
    mockGetGeneratedCVs.mockResolvedValue(mockPaginatedResponse);

    // All possible parameters
    const params = {
      languageCode: 'de',
      offset: 20,
      limit: 15,
      status: 'generating',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
    };

    // Render hook
    const { result } = renderHook(() => useGeneratedCVs(params), {
      wrapper: createWrapper(),
    });

    // Wait for query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Get the current query from cache to check its key
    const currentQuery = queryClient.getQueryCache().findAll()[0];
    const queryKey = currentQuery?.queryKey as Array<unknown>;

    // Verify query key structure - should include all parameters
    expect(queryKey[0]).toBe('generated-cvs');
    expect(queryKey[1]).toMatchObject({
      languageCode: 'de',
      offset: 20,
      limit: 15,
      status: 'generating',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
    });
  });
});
