import { useEffect, useState } from 'react';
import type { JobDescriptionResponse } from '../../../types/api';
import { jobsApi } from '../api/jobsApi';

export function JobList() {
  const [jobs, setJobs] = useState<JobDescriptionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await jobsApi.getJobs();
        setJobs(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await jobsApi.deleteJob(id);
      setJobs(jobs => jobs.filter(job => job.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No job descriptions found</p>
        <a href="/jobs/new" className="btn btn-primary mt-4">
          Add Job Description
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Title</th>
            <th>Language</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>
                <a
                  href={`/jobs/${job.id}`}
                  className="font-medium hover:text-primary"
                >
                  {job.title}
                </a>
              </td>
              <td>{job.language_code}</td>
              <td>{new Date(job.created_at).toLocaleDateString()}</td>
              <td>
                <div className="space-x-2">
                  <a
                    href={`/jobs/${job.id}/edit`}
                    className="btn btn-sm btn-outline"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="btn btn-sm btn-error"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
