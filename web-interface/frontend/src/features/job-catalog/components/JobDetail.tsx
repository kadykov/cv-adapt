import { useEffect, useState } from 'react';
import type { JobDescriptionResponse } from '../../../types/api';
import { api } from '../../../api';
import { Link } from 'react-router-dom';

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
        const data = await api.jobs.getJob(jobId);
        setJob(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
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
    return <div className="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <div className="space-x-2">
          <Link
            to={`/jobs/${job.id}/edit`}
            className="btn btn-outline"
          >
            Edit
          </Link>
          <Link
            to="/jobs"
            className="btn"
          >
            Back to List
          </Link>
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
