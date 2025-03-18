import { useQuery } from '@tanstack/react-query';
import { getGeneratedCV } from '../api/cvGenerationApi';
import type { components } from '../../../lib/api/types';

type Schema = components['schemas'];
type GeneratedCV = Schema['GeneratedCVResponse'];

export const GENERATED_CV_QUERY_KEY = ['generated-cv'] as const;

interface UseGeneratedCVOptions {
  /**
   * Whether to enable the query
   * @default true
   */
  enabled?: boolean;

  /**
   * Polling interval for generation status (in ms)
   * @default undefined - no polling
   */
  refetchInterval?: number;
}

/**
 * Hook to fetch a single generated CV with optional status polling
 */
export function useGeneratedCV(
  id: number,
  options: UseGeneratedCVOptions = {},
) {
  const { enabled = true, refetchInterval } = options;

  return useQuery<GeneratedCV>({
    queryKey: [...GENERATED_CV_QUERY_KEY, id],
    queryFn: () => getGeneratedCV(id),
    enabled: enabled && !!id,
    // Only poll while generating
    refetchInterval: (query) => {
      if (!refetchInterval) return false;
      return query.state.data?.generation_status === 'generating'
        ? refetchInterval
        : false;
    },
  });
}
