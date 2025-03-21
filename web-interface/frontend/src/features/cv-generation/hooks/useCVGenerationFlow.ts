import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  type CVDTO,
  type JobDescriptionResponse,
  type GenerateCompetencesRequest,
  type GenerateCVRequest,
  type GenerateCompetencesResponse,
} from '@/lib/api/generated-types';

interface CoreCompetence {
  id: string;
  text: string;
  isApproved: boolean;
}

interface CVGenerationFlowResult {
  job: JobDescriptionResponse | null;
  cv: CVDTO | null;
  competences: CoreCompetence[];
  isGeneratingCompetences: boolean;
  isGeneratingCV: boolean;
  competencesError: Error | null;
  cvError: Error | null;
  approveCompetence: (id: string, approved: boolean) => void;
  generateCompetences: (params: GenerateCompetencesRequest) => Promise<void>;
  generateCV: (params: GenerateCVRequest) => Promise<void>;
  updateCV: (cv: CVDTO) => Promise<void>;
}

/**
 * Hook to manage CV generation flow state and operations
 */
export function useCVGenerationFlow(jobId: number): CVGenerationFlowResult {
  // Job data
  const { data: job } = useQuery<JobDescriptionResponse>({
    queryKey: ['job', jobId],
    enabled: Boolean(jobId),
  });

  // Local state for approved competences
  const [competences, setCompetences] = useState<CoreCompetence[]>([]);
  const [cv, setCV] = useState<CVDTO | null>(null);

  // Generate competences mutation
  const {
    mutateAsync: mutateCompetences,
    isPending: isGeneratingCompetences,
    error: competencesError,
  } = useMutation<
    GenerateCompetencesResponse,
    Error,
    GenerateCompetencesRequest
  >({
    mutationFn: async (params) => {
      const response = await fetch('/api/generate-competences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate competences');
      }

      const data = await response.json();
      return data;
    },
  });

  // Generate CV mutation
  const {
    mutateAsync: mutateCV,
    isPending: isGeneratingCV,
    error: cvError,
  } = useMutation<CVDTO, Error, GenerateCVRequest>({
    mutationFn: async (params) => {
      const response = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate CV');
      }

      const data = await response.json();
      setCV(data);
      return data;
    },
  });

  // Update CV mutation
  const { mutateAsync: mutateUpdateCV } = useMutation<CVDTO, Error, CVDTO>({
    mutationFn: async (cvData) => {
      const response = await fetch(`/api/generated-cvs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cvData),
      });

      if (!response.ok) {
        throw new Error('Failed to update CV');
      }

      setCV(cvData);
      return cvData;
    },
  });

  // Wrapped mutation to handle competence state updates
  const generateCompetences = async (params: GenerateCompetencesRequest) => {
    const data = await mutateCompetences(params);

    // Transform API response to CoreCompetence format
    const newCompetences: CoreCompetence[] = data.core_competences.map(
      (text: string) => ({
        id: crypto.randomUUID(),
        text,
        isApproved: false,
      }),
    );

    setCompetences(newCompetences);
  };

  // Approve/disapprove competence
  const approveCompetence = (id: string, approved: boolean) => {
    setCompetences((prev) =>
      prev.map((comp) =>
        comp.id === id ? { ...comp, isApproved: approved } : comp,
      ),
    );
  };

  return {
    job: job || null,
    cv,
    competences,
    isGeneratingCompetences,
    isGeneratingCV,
    competencesError:
      competencesError instanceof Error ? competencesError : null,
    cvError: cvError instanceof Error ? cvError : null,
    approveCompetence,
    generateCompetences,
    generateCV: (params) => mutateCV(params).then(() => undefined),
    updateCV: (cvData) => mutateUpdateCV(cvData).then(() => undefined),
  };
}
