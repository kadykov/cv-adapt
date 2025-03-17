import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateCV,
  generateCompetences,
  updateGeneratedCV,
  deleteGeneratedCV,
} from '../api/cvGenerationApi';
import type {
  GeneratedCVCreate,
  GeneratedCVResponse,
  GenerateCVRequest,
  GenerateCompetencesRequest,
} from '../../../lib/api/generated-types';
import { GENERATED_CV_QUERY_KEY } from './useGeneratedCV';
import { GENERATED_CVS_QUERY_KEY } from './useGeneratedCVs';

export function useGeneratedCVMutations() {
  const queryClient = useQueryClient();

  // Invalidate both single CV and CVs list queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: GENERATED_CVS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: GENERATED_CV_QUERY_KEY });
  };

  const generateMutation = useMutation({
    mutationFn: (data: GenerateCVRequest) => generateCV(data),
    onSuccess: () => {
      invalidateQueries();
    },
  });

  const generateCompetencesMutation = useMutation({
    mutationFn: (data: GenerateCompetencesRequest) => generateCompetences(data),
    onSuccess: (updatedCV: GeneratedCVResponse) => {
      // Update CV in cache immediately
      queryClient.setQueryData(
        [...GENERATED_CV_QUERY_KEY, updatedCV.id],
        updatedCV,
      );
      // Invalidate lists that might include this CV
      queryClient.invalidateQueries({ queryKey: GENERATED_CVS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<GeneratedCVCreate>;
    }) => updateGeneratedCV(id, data),
    onSuccess: (updatedCV: GeneratedCVResponse) => {
      // Update CV in cache immediately
      queryClient.setQueryData(
        [...GENERATED_CV_QUERY_KEY, updatedCV.id],
        updatedCV,
      );
      // Invalidate lists that might include this CV
      queryClient.invalidateQueries({ queryKey: GENERATED_CVS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGeneratedCV(id),
    onSuccess: (_, id) => {
      // Remove from cache immediately
      queryClient.removeQueries({ queryKey: [...GENERATED_CV_QUERY_KEY, id] });
      // Invalidate list to reflect deletion
      queryClient.invalidateQueries({ queryKey: GENERATED_CVS_QUERY_KEY });
    },
  });

  return {
    generateCV: generateMutation,
    generateCompetences: generateCompetencesMutation,
    updateGeneratedCV: updateMutation,
    deleteGeneratedCV: deleteMutation,
  };
}
