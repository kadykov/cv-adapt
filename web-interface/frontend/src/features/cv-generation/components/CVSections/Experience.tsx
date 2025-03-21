import { Icon } from '@iconify/react';
import { Button } from '@headlessui/react';
import type { ExperienceDTO } from '@/lib/api/generated-types';

export interface ExperienceProps {
  experience: ExperienceDTO;
  onEdit: () => void;
}

export function Experience({ experience, onEdit }: ExperienceProps) {
  if (!experience) {
    return (
      <div
        role="alert"
        className="rounded-md bg-error-50 p-4 text-error-700"
      >
        <p>Invalid experience data provided</p>
      </div>
    );
  }

  const isValidDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  };

  if (!isValidDate(experience.start_date)) {
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
          <h4 className="font-medium">{experience.position}</h4>
          <p className="text-sm text-gray-600">{experience.company.name}</p>
          {experience.company.location && (
            <p className="text-sm text-gray-500">
              {experience.company.location}
            </p>
          )}
          <div
            className="flex items-center gap-2 mt-1 text-sm text-gray-500"
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
              {formatDate(experience.start_date)} -{' '}
              {experience.end_date
                ? formatDate(experience.end_date)
                : 'Present'}
            </span>
          </div>
        </div>
        <Button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onEdit}
          title="Edit experience details"
        >
          <span
            className="size-4"
            data-testid="edit-icon"
            aria-hidden="true"
          >
            <Icon icon="heroicons:pencil" />
          </span>
          <span className="sr-only">
            Edit experience at {experience.company.name}
          </span>
        </Button>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-700">{experience.description}</p>
        {experience.technologies && experience.technologies.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">Technologies:</p>
            <div className="flex flex-wrap gap-2">
              {experience.technologies.map((tech, techIndex) => (
                <span
                  key={techIndex}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
