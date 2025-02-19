import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import type { JobDescriptionCreate, JobDescriptionUpdate, JobDescriptionResponse } from '../../../../lib/api/generated-types';
import { JobDetail } from '../JobDetail';
import { createTestWrapper } from '../../../../lib/test-utils';
import { useJob } from '../../hooks/useJob';
import { useJobMutations } from '../../hooks/useJobMutations';

// Mock dependencies
vi.mock('../../hooks/useJob');
vi.mock('../../hooks/useJobMutations');
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '1 day ago'),
}));

// Mock Badge component
vi.mock('../../../../lib/components/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'A great engineering position',
  language_code: 'en',
  created_at: '2024-02-18T10:00:00Z',
  updated_at: null,
};

type JobMutationsResult = {
  createJob: UseMutationResult<JobDescriptionResponse, Error, JobDescriptionCreate, unknown>;
  updateJob: UseMutationResult<JobDescriptionResponse, Error, { id: number; data: JobDescriptionUpdate }, unknown>;
  deleteJob: UseMutationResult<void, Error, number, unknown>;
};

function createMockQueryResult(): UseQueryResult<JobDescriptionResponse, Error>;
function createMockQueryResult(data: JobDescriptionResponse): UseQueryResult<JobDescriptionResponse, Error>;
function createMockQueryResult(data: undefined, error: Error): UseQueryResult<JobDescriptionResponse, Error>;
function createMockQueryResult(data?: JobDescriptionResponse, error?: Error): UseQueryResult<JobDescriptionResponse, Error> {
  function createBaseQueryResult() {
    return {
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      isPaused: false,
      status: 'loading' as const,
      fetchStatus: 'idle' as const,
      refetch: vi.fn(),
    };
  }

  const base = createBaseQueryResult();

  if (error) {
    return {
      ...base,
      data: undefined,
      error,
      errorUpdatedAt: Date.now(),
      failureCount: 1,
      failureReason: error,
      errorUpdateCount: 1,
      isError: true,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isLoading: false,
      isLoadingError: true,
      isInitialLoading: false,
      isPending: false,
      isSuccess: false,
      status: 'error',
      fetchStatus: 'idle',
      promise: Promise.resolve(undefined as unknown)
    } as UseQueryResult<JobDescriptionResponse, Error>;
  }

  if (!data) {
    const promise = new Promise<JobDescriptionResponse>(() => {});
    return {
      ...base,
      data: undefined,
      error: null,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isLoading: true,
      isLoadingError: false,
      isInitialLoading: true,
      isPending: true,
      isSuccess: false,
      status: 'pending',
      fetchStatus: 'fetching',
      promise,
    } as UseQueryResult<JobDescriptionResponse, Error>;
  }

  return {
    ...base,
    data,
    error: null,
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isLoading: false,
    isLoadingError: false,
    isInitialLoading: false,
    isPending: false,
    isSuccess: true,
    status: 'success',
    fetchStatus: 'idle',
    promise: Promise.resolve(data),
  } as UseQueryResult<JobDescriptionResponse, Error>;
}

function createMockMutations(deleteOverrides?: Partial<UseMutationResult<void, Error, number, unknown>>): JobMutationsResult {
  const defaultMutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    isPaused: false,
    isIdle: true,
    status: 'idle' as const,
    variables: undefined,
    submittedAt: 0,
  };

  return {
    createJob: {
      ...defaultMutation,
      mutateAsync: vi.fn().mockResolvedValue(mockJob),
      variables: undefined as JobDescriptionCreate | undefined,
    } as UseMutationResult<JobDescriptionResponse, Error, JobDescriptionCreate, unknown>,
    updateJob: {
      ...defaultMutation,
      mutateAsync: vi.fn().mockResolvedValue(mockJob),
      variables: undefined as { id: number; data: JobDescriptionUpdate } | undefined,
    } as UseMutationResult<JobDescriptionResponse, Error, { id: number; data: JobDescriptionUpdate }, unknown>,
    deleteJob: {
      ...defaultMutation,
      variables: undefined as number | undefined,
      ...deleteOverrides,
    } as UseMutationResult<void, Error, number, unknown>,
  };
}

describe('JobDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useJob).mockReturnValue(createMockQueryResult());
    vi.mocked(useJobMutations).mockReturnValue(createMockMutations());

    const { container } = render(<JobDetail id={1} />, { wrapper: createTestWrapper() });
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders error state', async () => {
    const error = new Error('Failed to load job');
    vi.mocked(useJob).mockReturnValue(createMockQueryResult(undefined, error));
    vi.mocked(useJobMutations).mockReturnValue(createMockMutations());

    await render(<JobDetail id={1} />, { wrapper: createTestWrapper() });

    await screen.findByText(/Failed to load job/i, {}, { timeout: 1000 });
    expect(screen.getByRole('alert')).toHaveTextContent(/Failed to load job/);
    expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
  });

  it('returns null when data is not available', () => {
    vi.mocked(useJob).mockReturnValue(createMockQueryResult());
    vi.mocked(useJobMutations).mockReturnValue(createMockMutations());

    const { container } = render(<JobDetail id={1} />, { wrapper: createTestWrapper() });
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders job details successfully', () => {
    vi.mocked(useJob).mockReturnValue(createMockQueryResult(mockJob));
    vi.mocked(useJobMutations).mockReturnValue(createMockMutations());

    render(<JobDetail id={1} />, { wrapper: createTestWrapper() });

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveTextContent(mockJob.language_code);
    expect(screen.getByText('1 day ago')).toBeInTheDocument();
  });

  it('handles delete action', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useJob).mockReturnValue(createMockQueryResult(mockJob));
    vi.mocked(useJobMutations).mockReturnValue(createMockMutations({
      mutateAsync: mockDelete,
    }));

    render(<JobDetail id={1} />, { wrapper: createTestWrapper() });

    const deleteButton = screen.getByRole('button', { name: /Delete job/i });
    await user.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows loading state during delete', async () => {
    const user = userEvent.setup();
    const neverResolve = new Promise<void>(() => {});

    vi.mocked(useJob).mockReturnValue(createMockQueryResult(mockJob));
    vi.mocked(useJobMutations).mockReturnValue(createMockMutations({
      mutateAsync: vi.fn(() => neverResolve),
      isPending: true,
    }));

    render(<JobDetail id={1} />, { wrapper: createTestWrapper() });

    const deleteButton = screen.getByRole('button', { name: /Delete job/i });
    await user.click(deleteButton);

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(deleteButton).toBeDisabled();
  });

  it('shows error when delete fails', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Failed to delete');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(useJob).mockReturnValue(createMockQueryResult(mockJob));
    vi.mocked(useJobMutations).mockReturnValue(createMockMutations({
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isError: true,
      error: mockError,
    }));

    render(<JobDetail id={1} />, { wrapper: createTestWrapper() });

    const deleteButton = screen.getByRole('button', { name: /Delete job/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to delete job/);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to delete job:', mockError);
    consoleSpy.mockRestore();
  });

  it('conditionally renders edit button', () => {
    const onEdit = vi.fn();

    vi.mocked(useJob).mockReturnValue(createMockQueryResult(mockJob));
    vi.mocked(useJobMutations).mockReturnValue(createMockMutations());

    const { rerender } = render(<JobDetail id={1} />, { wrapper: createTestWrapper() });
    expect(screen.queryByRole('button', { name: /Edit job/i })).not.toBeInTheDocument();

    rerender(<JobDetail id={1} onEdit={onEdit} />);
    expect(screen.getByRole('button', { name: /Edit job/i })).toBeInTheDocument();
  });
});
