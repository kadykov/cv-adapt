import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../lib/components/Badge';
import { useJob } from '../hooks/useJob';
import { useJobMutations } from '../hooks/useJobMutations';

interface JobDetailProps {
  id: number;
  onEdit?: () => void;
}

export function JobDetail({ id, onEdit }: JobDetailProps) {
  const navigate = useNavigate();
  const { data: job, isLoading, isError, error } = useJob(id);
  const { deleteJob } = useJobMutations();

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl animate-pulse" role="article">
        <div className="card-body">
          <div className="h-8 bg-base-300 rounded w-3/4 mb-4" />
          <div className="h-4 bg-base-300 rounded w-1/4 mb-2" />
          <div className="h-24 bg-base-300 rounded mb-4" />
          <div className="flex justify-end gap-4">
            <div className="h-10 bg-base-300 rounded w-24" />
            <div className="h-10 bg-base-300 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card bg-base-100 shadow-xl" role="article">
        <div className="card-body">
          <div className="alert alert-error" role="alert">
            <span>
              Error loading job details:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </span>
          </div>
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const timeAgo = job.updated_at
    ? formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })
    : formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  const handleDelete = async () => {
    try {
      await deleteJob.mutateAsync(id);
      navigate(-1);
    } catch (error) {
      // Error will be handled by the mutation
      console.error('Failed to delete job:', error);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl" role="article">
      <div className="card-body">
        <div className="flex justify-between items-start gap-4">
          <h2 className="card-title text-2xl font-bold">{job.title}</h2>
          <Badge variant="outline">{job.language_code}</Badge>
        </div>

        <div className="divider" role="separator" />

        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="whitespace-pre-wrap">{job.description}</p>
        </div>

        <div className="divider" role="separator" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <span className="text-sm text-base-content/70">{timeAgo}</span>
          <div className="flex gap-2">
            <button
              className="btn btn-error"
              onClick={handleDelete}
              disabled={deleteJob.isPending}
              aria-label="Delete job"
            >
              {deleteJob.isPending ? (
                <>
                  <span className="loading loading-spinner" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
            {onEdit && (
              <button
                className="btn btn-primary"
                onClick={onEdit}
                aria-label="Edit job"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {deleteJob.isError && (
          <div className="alert alert-error mt-4" role="alert">
            <span>
              Failed to delete job:{' '}
              {deleteJob.error instanceof Error
                ? deleteJob.error.message
                : 'Unknown error'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
