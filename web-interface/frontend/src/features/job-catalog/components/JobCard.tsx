import { formatDistanceToNow } from 'date-fns';
import type { JobDescriptionResponse } from '../api/types';
import { Badge } from '../../../lib/components/Badge';

interface JobCardProps {
  job: JobDescriptionResponse;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const timeAgo = job.updated_at
    ? formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })
    : formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <div
      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="card-body">
        <div className="flex justify-between items-start gap-4">
          <h3 className="card-title text-lg font-semibold truncate">{job.title}</h3>
          <Badge variant="outline">{job.language_code}</Badge>
        </div>
        <p className="text-sm text-base-content/70 line-clamp-2">{job.description}</p>
        <div className="card-actions justify-end mt-4">
          <span className="text-xs text-base-content/50">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
