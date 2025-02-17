import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useJobs } from '../useJobs';
import { useJob } from '../useJob';
import { useJobMutations } from '../useJobMutations';
import type { JobDescriptionResponse } from '../../api/types';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Full-stack developer role',
  language_code: 'en',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

const server = setupServer(
  http.get('/v1/api/jobs', ({ request }) => {
    const url = new URL(request.url);
    const languageCode = url.searchParams.get('language_code') || 'en';
    return HttpResponse.json([{ ...mockJob, language_code: languageCode }]);
  }),

  http.get('/v1/api/jobs/:id', () => {
    return HttpResponse.json(mockJob);
  }),

  http.post('/v1/api/jobs', async ({ request }) => {
    const body = await request.json() as JobDescriptionResponse;
    return HttpResponse.json({ ...mockJob, ...body });
  }),

  http.put('/v1/api/jobs/:id', async ({ request }) => {
    const body = await request.json() as JobDescriptionResponse;
    return HttpResponse.json({ ...mockJob, ...body });
  }),

  http.delete('/v1/api/jobs/:id', () => {
    return new HttpResponse(null, { status: 204 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wrapper component with React Query provider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Job Hooks', () => {
  describe('useJobs', () => {
    it('fetches jobs list successfully', async () => {
      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0]).toEqual(mockJob);
    });

    it('handles language filter', async () => {
      const { result } = renderHook(() => useJobs({ languageCode: 'fr' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].language_code).toBe('fr');
    });

    it('handles error state', async () => {
      server.use(
        http.get('/v1/api/jobs', () => {
          return HttpResponse.json(
            { detail: { message: 'Server error' } },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useJob', () => {
    it('fetches single job successfully', async () => {
      const { result } = renderHook(() => useJob(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockJob);
    });

    it('handles not found error', async () => {
      server.use(
        http.get('/v1/api/jobs/:id', () => {
          return HttpResponse.json(
            { detail: { message: 'Job not found' } },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useJob(999), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useJobMutations', () => {
    it('creates job successfully', async () => {
      const { result } = renderHook(() => useJobMutations(), {
        wrapper: createWrapper(),
      });

      const newJob = {
        title: 'New Position',
        description: 'Role description',
        language_code: 'en',
      };

      result.current.createJob.mutate(newJob);

      await waitFor(() => {
        expect(result.current.createJob.isSuccess).toBe(true);
      });

      expect(result.current.createJob.data).toEqual(
        expect.objectContaining(newJob)
      );
    });

    it('updates job successfully', async () => {
      const { result } = renderHook(() => useJobMutations(), {
        wrapper: createWrapper(),
      });

      const updates = {
        title: 'Updated Title',
      };

      result.current.updateJob.mutate({ id: 1, data: updates });

      await waitFor(() => {
        expect(result.current.updateJob.isSuccess).toBe(true);
      });

      expect(result.current.updateJob.data?.title).toBe(updates.title);
    });

    it('deletes job successfully', async () => {
      const { result } = renderHook(() => useJobMutations(), {
        wrapper: createWrapper(),
      });

      result.current.deleteJob.mutate(1);

      await waitFor(() => {
        expect(result.current.deleteJob.isSuccess).toBe(true);
      });
    });

    it('handles mutation errors', async () => {
      server.use(
        http.post('/v1/api/jobs', () => {
          return HttpResponse.json(
            { detail: { message: 'Invalid data' } },
            { status: 422 }
          );
        })
      );

      const { result } = renderHook(() => useJobMutations(), {
        wrapper: createWrapper(),
      });

      result.current.createJob.mutate({
        title: '',
        description: '',
        language_code: 'en',
      });

      await waitFor(() => {
        expect(result.current.createJob.isError).toBe(true);
      });
    });
  });
});
