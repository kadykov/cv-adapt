import { Icon } from '@iconify/react';
import { Button } from '@headlessui/react';
import type { EducationDTO } from '@/lib/api/generated-types';

export interface EducationProps {
  education: EducationDTO;
  onEdit: () => void;
}

export function Education({ education, onEdit }: EducationProps) {
  if (!education) {
    return (
      <div
        role="alert"
        className="rounded-md bg-error-50 p-4 text-error-700"
      >
        <p>Invalid education data provided</p>
      </div>
    );
  }

  if (!education.degree) {
    return (
      <div
        role="alert"
        className="rounded-md bg-error-50 p-4 text-error-700"
      >
        <p>Missing required field: Degree</p>
      </div>
    );
  }

  const isValidDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  };

  if (!isValidDate(education.start_date)) {
    return (
      <div
        role="alert"
        className="rounded-md bg-error-50 p-4 text-error-700"
      >
        <p>Invalid date format: Start date is invalid</p>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="space-y-1" data-testid="education-content">
            <h4 className="font-medium">{education.university.name}</h4>
            <p className="text-sm font-medium text-gray-700">
              {education.degree}
            </p>
            {education.university.location && (
              <p className="text-sm text-gray-500">
                {education.university.location}
              </p>
            )}
            <div
              className="flex items-center gap-2 text-sm text-gray-500"
              data-testid="date-range"
              aria-label="Date range"
            >
              <span
                className="size-4"
                data-testid="calendar-icon"
                aria-hidden="true"
              >
                <Icon icon="heroicons:calendar" />
              </span>
              <span>
                {formatDate(education.start_date)} -{' '}
                {education.end_date
                  ? formatDate(education.end_date)
                  : 'Present'}
              </span>
            </div>
          </div>
          {education.university.description && (
            <p className="mt-3 text-sm text-gray-600">
              {education.university.description}
            </p>
          )}
        </div>
        <Button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onEdit}
          title="Edit education details"
        >
          <span
            className="size-4"
            data-testid="edit-icon"
            aria-hidden="true"
          >
            <Icon icon="heroicons:pencil" />
          </span>
          <span className="sr-only">
            Edit education at {education.university.name}
          </span>
        </Button>
      </div>
      {education.description && (
        <div className="mt-3">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {education.description}
          </p>
        </div>
      )}
    </div>
  );
}
