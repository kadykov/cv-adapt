import { useState } from 'react';
import { useJob } from '../../job-catalog/hooks/useJob';
import { useGeneratedCVMutations } from './useGeneratedCVMutations';
import type { components } from '../../../lib/api/types';
import type { ApiError } from '../../../lib/api/client';

type Schema = components['schemas'];

interface GenerationParams {
  cvText: string;
  notes?: string;
}

interface CVGenerationFlowResult {
  job: Schema['JobDescriptionResponse'] | undefined;
  generateCompetences: (params: GenerationParams) => Promise<void>;
  generateFullCV: (params: GenerationParams) => Promise<void>;
  isGeneratingCompetences: boolean;
  isGeneratingCV: boolean;
  competencesError: ApiError | null;
  cvError: ApiError | null;
  competences: string[];
}

/**
 * Hook to manage CV generation flow with competences and full CV generation
 */
export function useCVGenerationFlow(jobId: number): CVGenerationFlowResult {
  const [competences, setCompetences] = useState<string[]>([]);
  const { data: job } = useJob(jobId);
  const { generateCompetences, generateCV } = useGeneratedCVMutations();

  const generateCompetencesForCV = async ({ cvText, notes }: GenerationParams) => {
    if (!job) {
      throw new Error('Job not found');
    }

    const request: Schema['GenerateCompetencesRequest'] = {
      cv_text: cvText,
      job_description: job.description,
      notes
    };

    const result = await generateCompetences.mutateAsync(request);
    setCompetences(result.core_competences);
  };

  const generateFullCV = async ({ cvText, notes }: GenerationParams) => {
    if (!job) {
      throw new Error('Job not found');
    }

    if (!competences.length) {
      throw new Error('No competences generated yet');
    }

    const request: Schema['GenerateCVRequest'] = {
      cv_text: cvText,
      job_description: job.description,
      personal_info: {
        full_name: "John Doe", // TODO: Get from user profile
        email: {
          value: "john@example.com", // TODO: Get from user profile
          type: "email",
          icon: "email",
          url: "mailto:john@example.com"
        }
      },
      approved_competences: competences,
      notes
    };

    await generateCV.mutateAsync(request);
  };

  return {
    job,
    generateCompetences: generateCompetencesForCV,
    generateFullCV,
    isGeneratingCompetences: generateCompetences.isPending,
    isGeneratingCV: generateCV.isPending,
    competencesError: generateCompetences.error as ApiError | null,
    cvError: generateCV.error as ApiError | null,
    competences
  };
}
