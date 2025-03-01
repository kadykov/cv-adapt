import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../../../../lib/components/Badge';
import { useDetailedCV } from '../../hooks/useDetailedCVs';
import { useDetailedCVMutations } from '../../hooks/useDetailedCVMutations';
import { Button } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import { LanguageCode } from '../../../../lib/language/types';

interface DetailedCVPreviewProps {
  languageCode: LanguageCode;
  onEdit?: () => void;
  onBack?: () => void;
}

export function DetailedCVPreview({
  languageCode,
  onEdit,
  onBack,
}: DetailedCVPreviewProps) {
  const { data: cv, isLoading, isError, error } = useDetailedCV(languageCode);

  const { deleteCV, setPrimary } = useDetailedCVMutations();

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
              Error loading detailed CV:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </span>
          </div>
          <div className="card-actions justify-end mt-4">
            <Button className="btn btn-primary" onClick={onBack}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!cv) {
    return null;
  }

  const timeAgo = cv.updated_at
    ? formatDistanceToNow(new Date(cv.updated_at), { addSuffix: true })
    : formatDistanceToNow(new Date(cv.created_at), { addSuffix: true });

  // Extract markdown content from the CV
  // The content field is expected to be a string that can be rendered as Markdown
  const markdownContent =
    typeof cv.content === 'string'
      ? (cv.content as string)
      : 'No content available';

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this CV?')) {
      try {
        await deleteCV.mutateAsync(languageCode);
        onBack?.();
      } catch (error) {
        console.error('Failed to delete CV:', error);
      }
    }
  };

  const handleSetPrimary = async () => {
    if (!cv.is_primary) {
      try {
        await setPrimary.mutateAsync(languageCode);
        onBack?.(); // Navigate back to list after successful update
      } catch (error) {
        console.error('Failed to set CV as primary:', error);
      }
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl" role="article">
      <div className="card-body">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{cv.language_code}</Badge>
            {cv.is_primary && <Badge variant="default">Primary</Badge>}
          </div>
          <span className="text-sm text-base-content/70">{timeAgo}</span>
        </div>

        <div className="divider" role="separator" />

        <div className="prose max-w-none">
          <ReactMarkdown>{markdownContent}</ReactMarkdown>
        </div>

        <div className="divider" role="separator" />

        <div className="flex justify-end gap-2">
          {!cv.is_primary && (
            <Button
              className="btn btn-outline btn-success"
              onClick={handleSetPrimary}
              disabled={setPrimary.isPending}
              aria-label="Set as primary CV"
            >
              {setPrimary.isPending ? 'Setting...' : 'Set as Primary'}
            </Button>
          )}
          <Button
            className="btn btn-outline"
            onClick={onEdit}
            aria-label="Edit detailed CV"
          >
            Edit
          </Button>
          <Button
            className="btn btn-outline btn-error"
            onClick={handleDelete}
            disabled={deleteCV.isPending}
            aria-label="Delete detailed CV"
          >
            {deleteCV.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>

        {deleteCV.isError && (
          <div className="alert alert-error mt-4" role="alert">
            <span>
              Failed to delete CV:{' '}
              {deleteCV.error instanceof Error
                ? deleteCV.error.message
                : 'Unknown error'}
            </span>
          </div>
        )}

        {setPrimary.isError && (
          <div className="alert alert-error mt-4" role="alert">
            <span>
              Failed to set CV as primary:{' '}
              {setPrimary.error instanceof Error
                ? setPrimary.error.message
                : 'Unknown error'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
