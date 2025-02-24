import { format } from 'date-fns';
import { type Job } from '../types';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <div
      data-testid="job-card"
      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
    >
      <div className="card-body">
        <h2 className="card-title">{job.title}</h2>
        <div className="badge badge-primary">{job.language_code}</div>
        <p className="mt-4">{job.description}</p>
        <div className="text-sm text-gray-500 mt-4">
          Created: {format(new Date(job.created_at), 'PPP')}
        </div>
      </div>
    </div>
  );
}
