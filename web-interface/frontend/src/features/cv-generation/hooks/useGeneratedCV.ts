import { useQuery } from '@tanstack/react-query';
import { getGeneratedCV } from '../api/cvGenerationApi';
import type { GeneratedCVResponse } from '../../../lib/api/generated-types';

export const GENERATED_CV_QUERY_KEY = ['generated-cv'] as const;

interface UseGeneratedCVOptions {
  enabled?: boolean;
}

export function useGeneratedCV(
  id: number,
  options: UseGeneratedCVOptions = {},
) {
  const { enabled = true } = options;

  return useQuery<GeneratedCVResponse>({
    queryKey: [...GENERATED_CV_QUERY_KEY, id],
    queryFn: () => getGeneratedCV(id),
    enabled: enabled && !!id,
  });
}
