import { useQuery } from '@tanstack/react-query';
import { getGeneratedCVs } from '../api/cvGenerationApi';
import type { components } from '../../../lib/api/types';

type Schema = components['schemas'];

export const GENERATED_CVS_QUERY_KEY = ['generated-cvs'] as const;

interface UseGeneratedCVsOptions {
  languageCode?: string;
  offset?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch paginated list of generated CVs with filtering
 */
export function useGeneratedCVs(options: UseGeneratedCVsOptions = {}) {
  const {
    languageCode = 'en',
    offset = 0,
    limit = 10,
    status,
    startDate,
    endDate,
    enabled = true,
  } = options;

  return useQuery<Schema['PaginatedResponse_GeneratedCVResponse_']>({
    queryKey: [
      ...GENERATED_CVS_QUERY_KEY,
      { languageCode, offset, limit, status, startDate, endDate },
    ],
    queryFn: () =>
      getGeneratedCVs({
        language_code: languageCode,
        offset,
        limit,
        status,
        start_date: startDate,
        end_date: endDate,
      }),
    enabled,
  });
}
