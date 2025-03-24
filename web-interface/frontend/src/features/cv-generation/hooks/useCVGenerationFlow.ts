import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { components } from '@/lib/api/types';
import { LanguageCode } from '@/lib/language/types';
import { toApiLanguage } from '@/lib/language/adapters';
import { client } from '@/lib/api/client';

type Schema = components['schemas'];

/**
 * Core competence with internal tracking state.
 * Matches API's CoreCompetenceDTO structure with additional tracking fields
 */
interface TrackedCompetence {
  id: string; // Internal ID for tracking
  text: string; // From CoreCompetenceDTO
  isApproved: boolean; // Internal tracking state
}

/** Parameters for CV generation with internal language code */
type GenerateCVParams = Omit<Schema['GenerateCVRequest'], 'language_code'> & {
  language: LanguageCode
};

interface CVGenerationFlowResult {
  job: Schema['JobDescriptionResponse'] | null;
  cv: Schema['CVDTO'] | null;
  competences: TrackedCompetence[];
  isGeneratingCompetences: boolean;
  isGeneratingCV: boolean;
  competencesError: Error | null;
  cvError: Error | null;
  approveCompetence: (id: string, approved: boolean) => void;
  generateCompetences: (params: Schema['GenerateCompetencesRequest']) => Promise<void>;
  generateCV: (params: GenerateCVParams) => Promise<void>;
  updateCV: (cv: Schema['CVDTO']) => Promise<void>;
  // Testing utilities
  setCompetencesError: (error: Error) => void;
  setCV: (cv: Schema['CVDTO']) => void;
}

/**
 * Hook to manage CV generation flow state and operations.
 * Handles conversion between internal types and API types at boundaries.
 */
export function useCVGenerationFlow(jobId: number): CVGenerationFlowResult {
  // Local state
  const [competences, setCompetences] = useState<TrackedCompetence[]>([]);
  const [cv, setCV] = useState<Schema['CVDTO'] | null>(null);
  const [competencesError, setCompetencesError] = useState<Error | null>(null);
  const [cvError, setCVError] = useState<Error | null>(null);

  // Job data
  const { data: job } = useQuery<Schema['JobDescriptionResponse']>({
    queryKey: ['jobs', jobId],
    queryFn: () => client.get<Schema['JobDescriptionResponse']>(`jobs/${jobId}`),
    enabled: Boolean(jobId),
  });

  // Generate competences mutation
  const {
    mutate: mutateCompetences,
    isPending: isGeneratingCompetences,
  } = useMutation<
    Schema['CoreCompetencesResponse'],
    Error,
    Schema['GenerateCompetencesRequest']
  >({
    mutationFn: async (params) => {
      setCompetencesError(null);
      setCompetences([]);
      try {
        const response = await client.post<Schema['CoreCompetencesResponse']>('generations/competences', params);
        return response;
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error('Unknown error');
        setCompetencesError(normalizedError);
        throw normalizedError;
      }
    },
    onSuccess: (data) => {
      const newCompetences: TrackedCompetence[] = data.core_competences.map(
        (text) => ({
          id: crypto.randomUUID(),
          text,
          isApproved: false,
        }),
      );
      setCompetences(newCompetences);
    },
    onError: (error) => {
      const normalizedError = error instanceof Error ? error : new Error('Unknown error');
      setCompetencesError(normalizedError);
      setCompetences([]);
    }
  });

  // Generate CV mutation
  const {
    mutateAsync: mutateCV,
    isPending: isGeneratingCV,
  } = useMutation<Schema['CVDTO'], Error, GenerateCVParams>({
    mutationFn: async ({ language, ...params }) => {
      setCVError(null);
      try {
        const response = await client.post<Schema['CVDTO']>('generations/cv', {
          ...params,
          language_code: toApiLanguage(language)
        });
        return response;
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error('Unknown error');
        setCVError(normalizedError);
        throw normalizedError;
      }
    },
    onSuccess: (data) => {
      setCV(data);
    },
    onError: (error) => {
      const normalizedError = error instanceof Error ? error : new Error('Unknown error');
      setCVError(normalizedError);
      setCV(null);
    }
  });

  // Update CV mutation
  const { mutate: mutateUpdateCV } = useMutation<Schema['CVDTO'], Error, Schema['CVDTO']>({
    mutationFn: async (cvData) => {
      setCVError(null);
      try {
        const response = await client.put<Schema['CVDTO']>(`generations/cv/${jobId}`, cvData);
        return response;
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error('Unknown error');
        setCVError(normalizedError);
        throw normalizedError;
      }
    },
    onSuccess: (data) => {
      setCV(data);
    },
    onError: (error) => {
      const normalizedError = error instanceof Error ? error : new Error('Unknown error');
      setCVError(normalizedError);
    }
  });

  // Update competence approval state
  const approveCompetence = (id: string, approved: boolean) => {
    setCompetences((prev) =>
      prev.map((comp) =>
        comp.id === id ? { ...comp, isApproved: approved } : comp,
      ),
    );
  };

  return {
    job: job ?? null,
    cv,
    competences,
    isGeneratingCompetences,
    isGeneratingCV,
    competencesError,
    cvError,
    approveCompetence,
    setCompetencesError, // Expose for testing
    setCV, // Expose for testing
    generateCompetences: (params) => new Promise((resolve, reject) => {
      setCompetences([]); // Clear competences immediately
      setCompetencesError(null);

      mutateCompetences(params, {
        onSuccess: () => resolve(),
        onError: (error) => {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          setCompetencesError(normalizedError);
          reject(normalizedError);
        }
      });
    }),
    generateCV: (params) => mutateCV(params).then(() => undefined),
    updateCV: (cvData) => new Promise((resolve, reject) => {
      setCVError(null);

      mutateUpdateCV(cvData, {
        onSuccess: () => {
          resolve();
        },
        onError: (error) => {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          setCVError(normalizedError);
          reject(normalizedError);
        }
      });
    }),
  };
}
