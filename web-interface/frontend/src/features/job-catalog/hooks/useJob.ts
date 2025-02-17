import { useQuery } from '@tanstack/react-query';
import { getJob } from '../api/jobsApi';
import type { JobDescriptionResponse } from '../api/types';

export const JOB_QUERY_KEY = ['job'] as const;

interface UseJobOptions {
  enabled?: boolean;
}

export function useJob(id: number, options: UseJobOptions = {}) {
  const { enabled = true } = options;

  return useQuery<JobDescriptionResponse>({
    queryKey: [...JOB_QUERY_KEY, id],
    queryFn: () => getJob(id),
    enabled,
  });
}
