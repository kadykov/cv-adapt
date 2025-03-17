import { useQuery } from '@tanstack/react-query';
import { getGeneratedCV } from '../api/cvGenerationApi';
import type { GeneratedCVResponse } from '../../../lib/api/generated-types';
import { GENERATION_STATUS, STATUS_POLLING_INTERVAL } from '../constants';

// Query keys
export const generationKeys = {
  all: ['cv-generation'] as const,
  status: () => [...generationKeys.all, 'status'] as const,
  statusById: (cvId: number) => [...generationKeys.status(), cvId] as const,
};

export function useGenerationStatus(
  cvId: number,
  onComplete?: (data: GeneratedCVResponse) => void,
) {
  return useQuery({
    queryKey: generationKeys.statusById(cvId),
    queryFn: () => getGeneratedCV(cvId),
    enabled: !!cvId,
    refetchInterval: (query) => {
      const data = query.state.data as GeneratedCVResponse | undefined;
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
      if (error instanceof Error && 'statusCode' in error) {
        return (error as { statusCode: number }).statusCode !== 404;
      }
      return failureCount < 3;
    },
  });
}
