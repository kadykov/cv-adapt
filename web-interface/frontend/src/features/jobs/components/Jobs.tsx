import { useJobs } from '../hooks/useJobs';
import { JobCard } from './JobCard';

export function Jobs() {
  const { data: jobs, isLoading, error } = useJobs();

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center min-h-[400px]"
        data-testid="jobs-loading"
      >
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div
          role="alert"
          className="alert alert-error shadow-lg"
          data-testid="jobs-error"
        >
          <span>Error loading jobs. Please try again later.</span>
        </div>
      </div>
    );
  }

  if (!jobs?.length) {
    return (
      <div data-testid="jobs-empty" className="text-center py-10">
        <h3 className="text-lg font-medium">No jobs found</h3>
        <p className="text-gray-500">Check back later for new opportunities.</p>
      </div>
    );
  }

  return (
    <div
      data-testid="jobs-list"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
    >
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
