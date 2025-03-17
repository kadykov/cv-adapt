import { useQuery } from '@tanstack/react-query';
import { getGeneratedCVs } from '../api/cvGenerationApi';
import type { GeneratedCVResponse } from '../../../lib/api/generated-types';

export const GENERATED_CVS_QUERY_KEY = ['generated-cvs'] as const;

interface UseGeneratedCVsOptions {
  languageCode?: string;
  enabled?: boolean;
}

export function useGeneratedCVs(options: UseGeneratedCVsOptions = {}) {
  const { languageCode = 'en', enabled = true } = options;

  return useQuery<GeneratedCVResponse[]>({
    queryKey: [...GENERATED_CVS_QUERY_KEY, languageCode],
    queryFn: () => getGeneratedCVs(languageCode),
    enabled,
  });
}
