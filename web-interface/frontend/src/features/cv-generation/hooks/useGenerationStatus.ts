import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useRef } from 'react';
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

/**
 * Hook to track CV generation status with auto polling
 * @param cvId - ID of the CV to track
 * @param onComplete - Optional callback when generation completes
 */
export function useGenerationStatus(
  cvId: number,
  onComplete?: (data: GeneratedCV) => void,
): UseQueryResult<GeneratedCV> {
  const lastSeenId = useRef<number | undefined>(undefined);
  const lastSeenStatus = useRef<string | undefined>(undefined);

  return useQuery({
    queryKey: generationKeys.statusById(cvId),
    queryFn: () => getGeneratedCV(cvId),
    enabled: !!cvId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.generation_status === GENERATION_STATUS.GENERATING
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
    select: (data: GeneratedCV) => {
      // Check if we should trigger the callback
      if (
        data.generation_status === GENERATION_STATUS.COMPLETED &&
        onComplete &&
        (lastSeenId.current !== cvId ||
         lastSeenStatus.current !== GENERATION_STATUS.COMPLETED)
      ) {
        // Wait for next tick to avoid React state updates during render
        queueMicrotask(() => onComplete(data));
      }

      // Update last seen values
      lastSeenId.current = cvId;
      lastSeenStatus.current = data.generation_status;

      return data;
    },
  });
}
