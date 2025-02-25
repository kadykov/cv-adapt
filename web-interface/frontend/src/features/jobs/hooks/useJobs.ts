import { useQuery } from '@tanstack/react-query';
import { type Job } from '../types';
import { API_ROUTES } from '../../../routes/api-routes';
import { client } from '../../../lib/api/client';

async function fetchJobs(): Promise<Job[]> {
  return client.get<Job[]>(API_ROUTES.JOBS.LIST);
}

export function useJobs() {
  return useQuery<Job[], Error>({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: Infinity, // Keep cached data until manually invalidated
  });
}
