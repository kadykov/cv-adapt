/**
 * React Query hooks for detailed CV mutations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  upsertDetailedCV,
  deleteDetailedCV,
  setPrimaryCV,
} from '../api/detailedCVApi';
import { detailedCVKeys } from './useDetailedCVs';
import type { DetailedCVFormData } from '../types/detailed-cv';

/**
 * Hook for detailed CV mutations (create, update, delete, set primary)
 */
export function useDetailedCVMutations() {
  const queryClient = useQueryClient();

  // Create or update a detailed CV
  const upsertCV = useMutation({
    mutationFn: ({
      languageCode,
      data,
    }: {
      languageCode: string;
      data: DetailedCVFormData;
    }) => upsertDetailedCV(languageCode, data),
    onSuccess: () => {
      // Invalidate all detailed CV queries to refetch data
      queryClient.invalidateQueries({ queryKey: detailedCVKeys.all });
    },
  });

  // Delete a detailed CV
  const deleteCV = useMutation({
    mutationFn: (languageCode: string) => deleteDetailedCV(languageCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailedCVKeys.all });
    },
  });

  // Set a detailed CV as primary
  const setPrimary = useMutation({
    mutationFn: (languageCode: string) => setPrimaryCV(languageCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailedCVKeys.all });
    },
  });

  return {
    upsertCV,
    deleteCV,
    setPrimary,
  };
}
