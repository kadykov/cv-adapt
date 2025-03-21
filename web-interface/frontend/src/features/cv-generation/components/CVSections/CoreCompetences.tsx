import { Icon } from '@iconify/react';
import { Button } from '@headlessui/react';
import type { CoreCompetenceDTO } from '@/lib/api/generated-types';

export interface CoreCompetencesProps {
  competences: CoreCompetenceDTO[];
  title?: string;
  onEdit?: () => void;
}

export function CoreCompetences({
  competences,
  title = 'Core Competences',
  onEdit,
}: CoreCompetencesProps) {
  if (!competences || !Array.isArray(competences)) {
    return (
      <div
        role="alert"
        className="rounded-md bg-error-50 p-4 text-error-700"
      >
        <p>Invalid competences data provided</p>
      </div>
    );
  }

  if (competences.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        {onEdit ? (
          <Button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onEdit}
            title="Edit competences"
          >
            <Icon
              icon="heroicons:pencil"
              className="size-4"
              data-testid="edit-icon"
              aria-hidden="true"
            />
            <span className="sr-only">Edit core competences</span>
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        <ul role="list" className="space-y-4">
          {competences.map((competence, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 size-5 flex items-center justify-center mt-0.5"
                aria-hidden="true"
              >
                <Icon
                  icon="heroicons:check-circle"
                  className="size-5 text-primary"
                />
              </span>
              <span className="text-sm text-gray-700">{competence.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
