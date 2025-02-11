import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../../api/core/api-error';
import { jobsApi } from '../api/jobsApi';
import type { JobDescriptionResponse } from '../../../types/api';

export const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDescriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const jobData = await jobsApi.getJobById(Number(id));
        setJob(jobData);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load job details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (!job) {
    return <div className="p-4">Job not found</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{job.title}</h1>
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <p className="whitespace-pre-wrap">{job.description}</p>
      </div>
      <div className="text-sm text-gray-500">
        <p>Language: {job.language_code}</p>
        <p>Created: {new Date(job.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
};
