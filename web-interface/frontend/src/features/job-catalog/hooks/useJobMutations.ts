import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJob, updateJob, deleteJob } from '../api/jobsApi';
import type {
  JobDescriptionCreate,
  JobDescriptionUpdate,
  JobDescriptionResponse,
} from '../../../lib/api/generated-types';
import { JOB_QUERY_KEY } from './useJob';
import { JOBS_QUERY_KEY } from './useJobs';

export function useJobMutations() {
  const queryClient = useQueryClient();

  // Invalidate both single job and jobs list queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: JOB_QUERY_KEY });
  };

  const createMutation = useMutation({
    mutationFn: (data: JobDescriptionCreate) => createJob(data),
    onSuccess: () => {
      invalidateQueries();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: JobDescriptionUpdate }) =>
      updateJob(id, data),
    onSuccess: (updatedJob: JobDescriptionResponse) => {
      // Update job in cache immediately
      queryClient.setQueryData([...JOB_QUERY_KEY, updatedJob.id], updatedJob);
      // Invalidate lists that might include this job
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJob(id),
    onSuccess: (_, id) => {
      // Remove from cache immediately
      queryClient.removeQueries({ queryKey: [...JOB_QUERY_KEY, id] });
      // Invalidate list to reflect deletion
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });

  return {
    createJob: createMutation,
    updateJob: updateMutation,
    deleteJob: deleteMutation,
  };
}
