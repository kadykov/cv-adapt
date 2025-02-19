import { useQuery } from '@tanstack/react-query';
import { getJobs } from '../api/jobsApi';
import type { JobsResponse } from '../../../lib/api/generated-types';

export const JOBS_QUERY_KEY = ['jobs'] as const;

interface UseJobsOptions {
  languageCode?: string;
  enabled?: boolean;
}

export function useJobs(options: UseJobsOptions = {}) {
  const { languageCode = 'en', enabled = true } = options;

  return useQuery<JobsResponse>({
    queryKey: [...JOBS_QUERY_KEY, languageCode],
    queryFn: () => getJobs(languageCode),
    enabled,
  });
}
