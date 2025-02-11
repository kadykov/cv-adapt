import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { JobDescriptionResponse } from "../../../types/api";
import { jobsApi } from "../api/jobsApi";
import { ApiError } from "../../../api/core/api-error";

export function JobList() {
  const [jobs, setJobs] = useState<JobDescriptionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setError(null);
      const data = await jobsApi.getJobs();
      setJobs(data);
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
      if (e instanceof ApiError && e.data && typeof e.data === 'object' && 'message' in e.data) {
        setError(e.data.message as string);
      } else {
        setError("Failed to load");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await jobsApi.deleteJob(id);
      setJobs(jobs.filter(job => job.id !== id));
    } catch (e) {
      console.error("Failed to delete job:", e);
      setError("Failed to delete job. Please try again later.");
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div
          className="loading loading-spinner loading-lg"
          role="status"
          aria-label="Loading jobs"
        >
          <span className="sr-only">Loading jobs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" role="alert" aria-live="polite">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span aria-label="error message">{error}</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <p className="mb-4" data-testid="empty-message">No job descriptions found</p>
        <Link to="/jobs/new" className="btn btn-primary">
          Add Job Description
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Link to="/jobs/new" className="btn btn-primary">
          Add Job Description
        </Link>
      </div>
      {jobs.map((job) => (
        <div key={job.id} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <Link to={`/jobs/${job.id}`} className="card-title">
              {job.title}
            </Link>
            <p>{job.description}</p>
            <p className="text-sm text-gray-500">Language: {job.language_code}</p>
            <div className="card-actions justify-end">
              <Link to={`/jobs/${job.id}/edit`} className="btn btn-outline">
                Edit
              </Link>
              <button
                className="btn btn-error"
                onClick={() => handleDelete(job.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
