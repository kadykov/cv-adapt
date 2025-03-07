import { formatDistanceToNow } from 'date-fns';
import type { DetailedCVResponse } from '../../../../lib/api/generated-types';
import { Badge } from '../../../../lib/components/Badge';

interface DetailedCVCardProps {
  cv: DetailedCVResponse;
  onClick?: () => void;
}

export function DetailedCVCard({ cv, onClick }: DetailedCVCardProps) {
  const timeAgo = cv.updated_at
    ? formatDistanceToNow(new Date(cv.updated_at), { addSuffix: true })
    : formatDistanceToNow(new Date(cv.created_at), { addSuffix: true });

  // Extract a preview of the content (first 100 characters)
  // The content field is expected to be a string that can be rendered as Markdown
  const contentPreview =
    typeof cv.content === 'string'
      ? (cv.content as string).substring(0, 100) + '...'
      : 'No content preview available';

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
          <div className="flex items-center gap-2">
            <Badge variant="outline">{cv.language_code}</Badge>
            {cv.is_primary && <Badge variant="default">Primary</Badge>}
          </div>
        </div>
        <p className="text-sm text-base-content/70 line-clamp-3 mt-2">
          {contentPreview}
        </p>
        <div className="card-actions justify-end mt-4">
          <span className="text-xs text-base-content/50">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
