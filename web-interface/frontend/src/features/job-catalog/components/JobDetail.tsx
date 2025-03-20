import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Badge } from '../../../lib/components/Badge';
import { useJob } from '../hooks/useJob';
import { useJobMutations } from '../hooks/useJobMutations';
import { Button } from '@headlessui/react';
import { GenerateButton } from '../../../features/cv-generation/components/GenerateButton';
import { fromApiLanguage } from '../../../lib/language/adapters';
import type { components } from '../../../lib/api/types';

type Schema = components['schemas'];

interface JobDetailProps {
  id: number;
  onEdit?: () => void;
}

export function JobDetail({ id, onEdit }: JobDetailProps) {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState(true);
  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useJob(id, { enabled: isEnabled });
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
            <Button className="btn btn-primary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
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
      setIsEnabled(false); // Disable job query before deletion
      await deleteJob.mutateAsync(id);
      navigate(-1);
    } catch (error) {
      setIsEnabled(true); // Re-enable query if deletion fails
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
            {deleteJob.isPending ? (
              <span
                role="status"
                className="loading loading-spinner loading-lg"
                aria-label="Deleting job..."
              />
            ) : (
              <>
                <Button
                  className="btn btn-error"
                  onClick={handleDelete}
                  aria-label="Delete job"
                >
                  Delete
                </Button>
                <GenerateButton
                  jobId={id}
                  language={fromApiLanguage(job.language_code as Schema['LanguageCode'])}
                />
                {onEdit && (
                  <Button
                    className="btn btn-primary"
                    onClick={onEdit}
                    aria-label="Edit job"
                  >
                    Edit
                  </Button>
                )}
              </>
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
