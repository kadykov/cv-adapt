import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../lib/test/server';
import { getTestApiUrl } from '../../../../lib/test/url-helper';
import { useJobs } from '../useJobs';
import { useJob } from '../useJob';
import { useJobMutations } from '../useJobMutations';
import type {
  JobDescriptionCreate,
  JobDescriptionResponse,
} from '../../../../lib/api/generated-types';
import {
  setTestAuthToken,
  clearTestAuthToken,
} from '../../../../lib/test/test-utils-auth';

const mockEnglishJob: JobDescriptionResponse = {
  id: 1,
  title: 'Frontend Developer',
  description: 'Frontend development role',
  language_code: 'en',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

const mockFrenchJob: JobDescriptionResponse = {
  id: 2,
  title: 'Développeur Frontend',
  description: "Création d'interfaces",
  language_code: 'fr',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

const unauthorizedError = {
  detail: { message: 'Unauthorized - Invalid or missing token' },
};

// Mock handlers for the jobs API
const setupHandlers = () => {
  server.use(
    http.get(getTestApiUrl('/jobs'), ({ request }) => {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return HttpResponse.json(unauthorizedError, { status: 401 });
      }

      // Handle language filter
      const url = new URL(request.url);
      const languageCode = url.searchParams.get('language_code');
      if (languageCode === 'fr') {
        return HttpResponse.json([mockFrenchJob]);
      }
      return HttpResponse.json([mockEnglishJob]);
    }),

    http.get(getTestApiUrl('/jobs/:id'), ({ request }) => {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return HttpResponse.json(unauthorizedError, { status: 401 });
      }
      return HttpResponse.json(mockEnglishJob);
    }),

    http.post(getTestApiUrl('/jobs'), async ({ request }) => {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return HttpResponse.json(unauthorizedError, { status: 401 });
      }

      const body = (await request.json()) as JobDescriptionCreate;
      const response: JobDescriptionResponse = {
        id: 3,
        title: body.title,
        description: body.description,
        language_code: body.language_code,
        created_at: '2024-02-17T22:00:00Z',
        updated_at: null,
      };

      return HttpResponse.json(response);
    }),

    http.put(getTestApiUrl('/jobs/:id'), ({ request }) => {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return HttpResponse.json(unauthorizedError, { status: 401 });
      }

      const response: JobDescriptionResponse = {
        id: mockEnglishJob.id,
        title: 'Updated Title',
        description: mockEnglishJob.description,
        language_code: mockEnglishJob.language_code,
        created_at: mockEnglishJob.created_at,
        updated_at: '2024-02-17T23:00:00Z',
      };

      return HttpResponse.json(response);
    }),

    http.delete(getTestApiUrl('/jobs/:id'), ({ request }) => {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return HttpResponse.json(unauthorizedError, { status: 401 });
      }
      return new HttpResponse(null, { status: 204 });
    }),
  );
};

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
  beforeEach(() => {
    clearTestAuthToken();
    setupHandlers();
  });

  afterEach(() => {
    clearTestAuthToken();
  });

  describe('useJobs', () => {
    it('fetches jobs list successfully', async () => {
      setTestAuthToken();
      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0]).toEqual(mockEnglishJob);
    });

    it('handles language filter', async () => {
      setTestAuthToken();
      const { result } = renderHook(() => useJobs({ languageCode: 'fr' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].language_code).toBe('fr');
    });

    it('handles unauthorized error', async () => {
      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toContain('Unauthorized');
      });
    });
  });

  describe('useJob', () => {
    it('fetches single job successfully', async () => {
      setTestAuthToken();
      const { result } = renderHook(() => useJob(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEnglishJob);
    });

    it('handles unauthorized error', async () => {
      const { result } = renderHook(() => useJob(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toContain('Unauthorized');
      });
    });
  });

  describe('useJobMutations', () => {
    const newJob: JobDescriptionCreate = {
      title: 'New Position',
      description: 'Role description',
      language_code: 'en',
    };

    it('creates job successfully', async () => {
      setTestAuthToken();
      const { result } = renderHook(() => useJobMutations(), {
        wrapper: createWrapper(),
      });

      result.current.createJob.mutate(newJob);

      await waitFor(() => {
        expect(result.current.createJob.isSuccess).toBe(true);
      });

      expect(result.current.createJob.data).toEqual(
        expect.objectContaining(newJob),
      );
    });

    it('updates job successfully', async () => {
      setTestAuthToken();
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
      setTestAuthToken();
      const { result } = renderHook(() => useJobMutations(), {
        wrapper: createWrapper(),
      });

      result.current.deleteJob.mutate(1);

      await waitFor(() => {
        expect(result.current.deleteJob.isSuccess).toBe(true);
      });
    });

    it('handles unauthorized error on create', async () => {
      const { result } = renderHook(() => useJobMutations(), {
        wrapper: createWrapper(),
      });

      result.current.createJob.mutate(newJob);

      await waitFor(() => {
        expect(result.current.createJob.isError).toBe(true);
        expect(result.current.createJob.error?.message).toContain(
          'Unauthorized',
        );
      });
    });
  });
});
