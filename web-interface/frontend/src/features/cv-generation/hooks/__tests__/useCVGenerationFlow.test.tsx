import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCVGenerationFlow } from '../useCVGenerationFlow';
import { mockCV, mockCompetencesResponse } from '../../testing/fixtures';
import type {
  CVDTO,
  JobDescriptionResponse,
  GenerateCompetencesRequest,
  GenerateCVRequest
} from '@/lib/api/generated-types';
import { server } from '@/lib/test/server';
import { http, HttpResponse } from 'msw';

// Mock crypto.randomUUID for deterministic IDs in tests
vi.stubGlobal('crypto', {
  randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
});

// Mock job data - create here to match the job ID used in tests
const mockJobData: JobDescriptionResponse = {
  id: 123,
  title: 'Software Engineer',
  description: 'Building applications with React and TypeScript',
  language_code: 'en',
  created_at: '2025-03-20T12:00:00Z',
  updated_at: '2025-03-20T12:00:00Z'
};

// Use mockCV from fixtures to create our test response
const mockCVResponse = mockCV;

describe('useCVGenerationFlow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset MSW handlers to default behavior
    server.resetHandlers();

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
      // Set up default competences handler
      server.use(
        http.post('/api/generate-competences', () => {
          return HttpResponse.json(mockCompetencesResponse);
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      // First generate competences to have some data
      await act(async () => {
        await result.current.generateCompetences({
          cv_text: 'CV text',
          job_description: 'Job description'
        });
      });

      // Verify competences are generated
      expect(result.current.competences).toHaveLength(4); // From fixture (React.js, TypeScript, Frontend Development, UI/UX Design)
      expect(result.current.competences[0].isApproved).toBe(false);

      // Approve a competence
      await act(async () => {
        result.current.approveCompetence(result.current.competences[0].id, true);
      });

      // Verify competence is approved - only check that first one is approved
      expect(result.current.competences[0].isApproved).toBe(true);
    });

    test('generateCompetences calls API and updates state', async () => {
      server.use(
        http.post('/api/generate-competences', () => {
          return HttpResponse.json(mockCompetencesResponse);
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      const mockRequest: GenerateCompetencesRequest = {
        cv_text: 'CV text',
        job_description: 'Job description',
        notes: 'Focus on technical skills'
      };

      await act(async () => {
        await result.current.generateCompetences(mockRequest);
      });

      // Verify state is updated
      expect(result.current.competences).toHaveLength(4); // From fixture
      expect(result.current.competences[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        text: 'React.js',
        isApproved: false,
      });
    });

    test('generateCV calls API and updates state', async () => {
      server.use(
        http.post('/api/generate-cv', () => {
          return HttpResponse.json(mockCVResponse);
        })
      );

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

      await act(async () => {
        await result.current.generateCV(mockRequest);
      });

      // Verify state is updated
      expect(result.current.cv).toEqual(mockCVResponse);
    });

    test('updateCV calls API and updates state', async () => {
      const updatedCV = {
        ...mockCVResponse,
        summary: { text: 'Updated summary text' }
      } as unknown as CVDTO;

      server.use(
        http.put('/api/generated-cvs/:id', () => {
          return HttpResponse.json(updatedCV);
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      await act(async () => {
        await result.current.updateCV(updatedCV);
      });

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
      server.use(
        http.post('/api/generate-competences', () => {
          return HttpResponse.json({ core_competences: [] });
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

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
      server.use(
        http.post('/api/generate-cv', () => {
          return HttpResponse.json(mockCVResponse);
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

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
      server.use(
        http.post('/api/generate-competences', () => {
          return new HttpResponse(
            JSON.stringify({ message: 'API error' }),
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

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
      server.use(
        http.post('/api/generate-cv', () => {
          return new HttpResponse(
            JSON.stringify({ message: 'API error' }),
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

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
      server.use(
        http.post('/api/generate-competences', () => {
          return new HttpResponse(
            JSON.stringify({ message: 'Unauthorized' }),
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

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
      server.use(
        http.post('/api/generate-cv', () => {
          return new HttpResponse(
            JSON.stringify({ message: 'Not Found' }),
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

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
      server.use(
        http.post('/api/generate-competences', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

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
      server.use(
        http.post('/api/generate-cv', () => {
          return new HttpResponse(
            'Not JSON', // Invalid JSON response
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

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
      // First request will fail
      server.use(
        http.post('/api/generate-competences', () => {
          // Reset this handler after one use
          server.resetHandlers();

          // Add the success handler for the second request
          server.use(
            http.post('/api/generate-competences', () => {
              return HttpResponse.json(mockCompetencesResponse);
            })
          );

          // Return error for first request
          return new HttpResponse(
            JSON.stringify({ message: 'Error' }),
            { status: 500 }
          );
        }, { once: true })
      );

      const { result } = renderHook(() => useCVGenerationFlow(123), { wrapper });

      // First attempt fails
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

      // Second attempt succeeds
      await act(async () => {
        await result.current.generateCompetences({
          cv_text: 'CV text',
          job_description: 'Job description'
        });
      });

      // Verify recovery
      expect(result.current.competencesError).toBeNull();
      expect(result.current.competences).toHaveLength(4); // From fixture
    });
  });
});
