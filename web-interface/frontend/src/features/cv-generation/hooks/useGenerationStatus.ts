import { useState } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getGeneratedCV } from '../api/cvGenerationApi';
import type { components } from '../../../lib/api/types';
import { GENERATION_STATUS, STATUS_POLLING_INTERVAL } from '../constants';

type Schema = components['schemas'];
type GeneratedCV = Schema['GeneratedCVResponse'];

// Query keys
export const generationKeys = {
  all: ['cv-generation'] as const,
  status: () => [...generationKeys.all, 'status'] as const,
  statusById: (cvId: number) => [...generationKeys.status(), cvId] as const,
};

type UseGenerationStatusResult = UseQueryResult<GeneratedCV> & {
  isOpen: boolean;
  closeModal: () => void;
};

/**
 * Hook to track CV generation status with auto polling
 * @param cvId - ID of the CV to track
 * @param onComplete - Optional callback when generation completes
 */
export function useGenerationStatus(
  cvId: number,
  onComplete?: (data: GeneratedCV) => void,
): UseGenerationStatusResult {
  const [isOpen, setIsOpen] = useState(true);

  const query = useQuery<GeneratedCV>({
    queryKey: generationKeys.statusById(cvId),
    queryFn: () => getGeneratedCV(cvId),
    enabled: !!cvId,
    // Only poll while generating
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return STATUS_POLLING_INTERVAL;
      if (
        data.generation_status === GENERATION_STATUS.COMPLETED &&
        onComplete
      ) {
        onComplete(data);
      }
      return data.generation_status === GENERATION_STATUS.GENERATING
        ? STATUS_POLLING_INTERVAL
        : false;
    },
    retry: (failureCount, error) => {
      // Only retry if not 404 and less than 3 attempts
      if (error instanceof Error && 'statusCode' in error) {
        return (error as { statusCode: number }).statusCode !== 404;
      }
      return failureCount < 3;
    },
  });

  return {
    ...query,
    isOpen,
    closeModal: () => setIsOpen(false)
  };
}
