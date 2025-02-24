import { useQuery } from '@tanstack/react-query';
import { type Job } from '../types';
import { API_ROUTES } from '../../../routes/api-routes';

async function fetchJobs(): Promise<Job[]> {
  const response = await fetch(API_ROUTES.JOBS.LIST, {
    headers: {
      Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }

  return response.json();
}

export function useJobs() {
  return useQuery<Job[], Error>({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
