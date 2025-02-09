import { useEffect, useState } from 'react';
import type { JobDescriptionResponse } from '../../../types/api';
import { jobsApi } from '../api/jobsApi';

interface JobDetailProps {
  jobId: number;
}

export function JobDetail({ jobId }: JobDetailProps) {
  const [job, setJob] = useState<JobDescriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const data = await jobsApi.getJob(jobId);
        setJob(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setIsLoading(false);
      }
    };

    loadJob();
  }, [jobId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!job) {
    return <div className="text-gray-500">Job not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <div className="space-x-2">
          <a
            href={`/jobs/${job.id}/edit`}
            className="btn btn-outline"
          >
            Edit
          </a>
          <a
            href="/jobs"
            className="btn"
          >
            Back to List
          </a>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-500">
        <div>
          Language: <span className="font-medium">{job.language_code}</span>
        </div>
        <div>
          Created: <span className="font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
        </div>
        {job.updated_at && (
          <div>
            Updated: <span className="font-medium">{new Date(job.updated_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="prose max-w-none">
        <h2 className="text-lg font-semibold">Description</h2>
        <div className="whitespace-pre-wrap">{job.description}</div>
      </div>
    </div>
  );
}
