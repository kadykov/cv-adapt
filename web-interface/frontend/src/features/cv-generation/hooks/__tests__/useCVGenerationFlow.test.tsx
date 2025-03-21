import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCVGenerationFlow } from '../useCVGenerationFlow';
import type {
  CVDTO,
  JobDescriptionResponse,
  GenerateCompetencesRequest,
  GenerateCompetencesResponse,
  GenerateCVRequest
} from '@/lib/api/generated-types';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
});

// Mock data
const mockJobData: JobDescriptionResponse = {
  id: 123,
  title: 'Software Engineer',
  description: 'Building applications with React and TypeScript',
  language_code: 'en',
  created_at: '2025-03-20T12:00:00Z',
  updated_at: '2025-03-20T12:00:00Z'
};

const mockCompetencesResponse: GenerateCompetencesResponse = {
  core_competences: [
    'React Development',
    'TypeScript',
    'Frontend Architecture'
  ]
};

// This is a simplified version of the CVDTO for testing purposes
const mockCVResponse = {
  id: 456,
  job_id: 123,
  language_code: 'en',
  status: 'completed',
  created_at: '2025-03-21T12:00:00Z',
  updated_at: '2025-03-21T12:00:00Z',
  title: { text: 'Software Engineer' },
  summary: { text: 'Experienced developer with React and TypeScript skills' },
  core_competences: [{ text: 'React Development' }],
  experiences: [
    {
      company: {
        name: 'Previous Company',
        location: 'Remote'
      },
      position: 'Senior Developer',
      start_date: '2020-01',
      end_date: '2023-12',
      description: 'Led development of various web applications'
    }
  ],
  education: [],
  skills: [],
  personal_info: {
    full_name: 'John Doe',
    email: {
      value: 'john@example.com',
      type: 'email'
    }
  },
  language: { code: 'en' }
} as unknown as CVDTO;

describe('useCVGenerationFlow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Configure QueryClient
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: Infinity,
        },
      },
    });

    // Pre-populate the cache with mock job data
    queryClient.setQueryData(['job', 123], mockJobData);
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  });

  // Wrapper to provide context to hooks
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  // Test groups for better organization
  describe('Basic Functionality', () => {
    test('initializes with correct default values', () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      expect(result.current.job).toEqual(mockJobData);
      expect(result.current.cv).toBeNull();
      expect(result.current.competences).toEqual([]);
      expect(result.current.isGeneratingCompetences).toBe(false);
      expect(result.current.isGeneratingCV).toBe(false);
      expect(result.current.competencesError).toBeNull();
      expect(result.current.cvError).toBeNull();
    });

    test('returns null job data when jobId is not provided', () => {
      const { result } = renderHook(() => useCVGenerationFlow(0), { wrapper });

      expect(result.current.job).toBeNull();
    });

    test('approveCompetence updates competence approval state', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      // First generate competences to have some data
      const mockResponse = new Response(JSON.stringify(mockCompetencesResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.generateCompetences({
          cv_text: 'CV text',
          job_description: 'Job description'
        });
      });

      // Verify competences are generated
      expect(result.current.competences).toHaveLength(3);
      expect(result.current.competences[0].isApproved).toBe(false);

      // Approve a competence
      await act(async () => {
        result.current.approveCompetence(result.current.competences[0].id, true);
      });

      // Verify competence is approved - only check that first one is approved
      expect(result.current.competences[0].isApproved).toBe(true);
    });

    test('generateCompetences calls API and updates state', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const mockRequest: GenerateCompetencesRequest = {
        cv_text: 'CV text',
        job_description: 'Job description',
        notes: 'Focus on technical skills'
      };

      const mockResponse = new Response(JSON.stringify(mockCompetencesResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.generateCompetences(mockRequest);
      });

      // Verify API call was made once
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify it was called with a Request object to the correct URL
      const fetchCall = mockFetch.mock.calls[0][0];
      expect(fetchCall.url).toContain('/api/generate-competences');
      expect(fetchCall.method).toBe('POST');

      // Verify state is updated
      expect(result.current.competences).toHaveLength(3);
      expect(result.current.competences[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        text: 'React Development',
        isApproved: false,
      });
    });

    test('generateCV calls API and updates state', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const mockRequest: GenerateCVRequest = {
        cv_text: 'CV text',
        job_description: 'Job description',
        approved_competences: ['React', 'TypeScript'],
        personal_info: {
          full_name: 'John Doe',
          email: {
            value: 'john@example.com',
            type: 'email',
          },
        },
        notes: 'Focus on technical skills'
      };

      const mockResponse = new Response(JSON.stringify(mockCVResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.generateCV(mockRequest);
      });

      // Verify API call was made once
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify it was called with a Request object to the correct URL
      const fetchCall = mockFetch.mock.calls[0][0];
      expect(fetchCall.url).toContain('/api/generate-cv');
      expect(fetchCall.method).toBe('POST');

      // Verify state is updated
      expect(result.current.cv).toEqual(mockCVResponse);
    });

    test('updateCV calls API and updates state', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const updatedCV = {
        ...mockCVResponse,
        summary: { text: 'Updated summary text' }
      } as unknown as CVDTO;

      const mockResponse = new Response(JSON.stringify(updatedCV), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.updateCV(updatedCV);
      });

      // Verify API call was made once
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify it was called with a Request object to the correct URL
      const fetchCall = mockFetch.mock.calls[0][0];
      expect(fetchCall.url).toContain('/api/generated-cvs/123');
      expect(fetchCall.method).toBe('PUT');

      // Verify state is updated
      expect(result.current.cv).toEqual(updatedCV);
    });
  });

  describe('Edge Cases', () => {
    test('handles negative job ID', () => {
      const { result } = renderHook(() => useCVGenerationFlow(-123), { wrapper });

      expect(result.current.job).toBeNull();
    });

    test('handles extremely large job ID', () => {
      const largeId = Number.MAX_SAFE_INTEGER;
      const { result } = renderHook(() => useCVGenerationFlow(largeId), { wrapper });

      expect(result.current.job).toBeNull();
    });

    test('generates competences with minimal input', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const mockResponse = new Response(JSON.stringify({
        core_competences: [] // Empty competences
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.generateCompetences({
          cv_text: '', // Empty CV text
          job_description: '' // Empty job description
        });
      });

      // Should handle empty competences gracefully
      expect(result.current.competences).toEqual([]);
    });

    test('handles CV generation with empty competences list', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const mockResponse = new Response(JSON.stringify(mockCVResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.generateCV({
          cv_text: 'CV text',
          job_description: 'Job description',
          approved_competences: [], // Empty competences
          personal_info: {
            full_name: 'John Doe',
            email: {
              value: 'john@example.com',
              type: 'email',
            },
          }
        });
      });

      // Should handle empty competences gracefully
      expect(result.current.cv).toEqual(mockCVResponse);
    });
  });

  describe('Error Scenarios', () => {
    test('handles error in generateCompetences', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const errorResponse = new Response(JSON.stringify({ message: 'API error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(errorResponse);

      await act(async () => {
        try {
          await result.current.generateCompetences({
            cv_text: 'CV text',
            job_description: 'Job description'
          });
        } catch {
          // Ignore error for the test
        }
      });

      // Verify error state
      expect(result.current.competencesError).toBeInstanceOf(Error);
      expect(result.current.competencesError?.message).toBe('Failed to generate competences');
    });

    test('handles error in generateCV', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const errorResponse = new Response(JSON.stringify({ message: 'API error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(errorResponse);

      await act(async () => {
        try {
          await result.current.generateCV({
            cv_text: 'CV text',
            job_description: 'Job description',
            approved_competences: ['React'],
            personal_info: {
              full_name: 'John Doe',
              email: {
                value: 'john@example.com',
                type: 'email',
              },
            }
          });
        } catch {
          // Ignore error for the test
        }
      });

      // Verify error state
      expect(result.current.cvError).toBeInstanceOf(Error);
      expect(result.current.cvError?.message).toBe('Failed to generate CV');
    });

    test('handles 401 Unauthorized error in competences generation', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const errorResponse = new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      mockFetch.mockResolvedValueOnce(errorResponse);

      await act(async () => {
        try {
          await result.current.generateCompetences({
            cv_text: 'CV text',
            job_description: 'Job description'
          });
        } catch {
          // Ignore error for the test
        }
      });

      // Verify error state
      expect(result.current.competencesError).toBeInstanceOf(Error);
      expect(result.current.competencesError?.message).toBe('Failed to generate competences');
    });

    test('handles 404 Not Found error in CV generation', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const errorResponse = new Response(
        JSON.stringify({ message: 'Not Found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      mockFetch.mockResolvedValueOnce(errorResponse);

      await act(async () => {
        try {
          await result.current.generateCV({
            cv_text: 'CV text',
            job_description: 'Job description',
            approved_competences: ['React'],
            personal_info: {
              full_name: 'John Doe',
              email: {
                value: 'john@example.com',
                type: 'email',
              },
            }
          });
        } catch {
          // Ignore error for the test
        }
      });

      // Verify error state
      expect(result.current.cvError).toBeInstanceOf(Error);
      expect(result.current.cvError?.message).toBe('Failed to generate CV');
    });

    test('handles network error in competences generation', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      // Simulate a network error
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      await act(async () => {
        try {
          await result.current.generateCompetences({
            cv_text: 'CV text',
            job_description: 'Job description'
          });
        } catch {
          // Ignore error for the test
        }
      });

      // Verify error state
      expect(result.current.competencesError).toBeInstanceOf(Error);
    });

    test('handles malformed JSON response in CV generation', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      // Mock response with invalid JSON
      const badResponse = new Response('Not JSON', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(badResponse);

      await act(async () => {
        try {
          await result.current.generateCV({
            cv_text: 'CV text',
            job_description: 'Job description',
            approved_competences: ['React'],
            personal_info: {
              full_name: 'John Doe',
              email: {
                value: 'john@example.com',
                type: 'email',
              },
            }
          });
        } catch {
          // Ignore error for the test
        }
      });

      // Verify error state
      expect(result.current.cvError).toBeInstanceOf(Error);
    });
  });

  describe('Recovery Scenarios', () => {
    test('recovers after competences generation error', async () => {
      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      // First call fails
      const errorResponse = new Response(JSON.stringify({ message: 'Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(errorResponse);

      await act(async () => {
        try {
          await result.current.generateCompetences({
            cv_text: 'CV text',
            job_description: 'Job description'
          });
        } catch {
          // Ignore error for the test
        }
      });

      // Verify error state
      expect(result.current.competencesError).toBeInstanceOf(Error);

      // Second call succeeds
      const successResponse = new Response(JSON.stringify(mockCompetencesResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockFetch.mockResolvedValueOnce(successResponse);

      await act(async () => {
        await result.current.generateCompetences({
          cv_text: 'CV text',
          job_description: 'Job description'
        });
      });

      // Verify recovery
      expect(result.current.competencesError).toBeNull();
      expect(result.current.competences).toHaveLength(3);
    });
  });
});
