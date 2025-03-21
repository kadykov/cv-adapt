import { Icon } from '@iconify/react';
import { Button } from '@headlessui/react';
import type { PersonalInfoDTO, ContactDTO } from '@/lib/api/generated-types';

export interface PersonalInfoProps {
  personalInfo: PersonalInfoDTO;
  onEdit: () => void;
}

const CONTACT_ICON_MAP: Record<string, string> = {
  email: 'mail',
  phone: 'phone',
  location: 'map-pin',
  linkedin: 'linkedin',
  github: 'code-bracket-square',
} as const;

export function PersonalInfo({ personalInfo, onEdit }: PersonalInfoProps) {
  if (!personalInfo || !personalInfo.full_name) {
    return (
      <div
        role="alert"
        className="rounded-md bg-error-50 p-4 text-error-700"
      >
        <p>Error: Invalid personal information - Full name is required</p>
      </div>
    );
  }

  const getContactIcon = (type: string): string => {
    return `heroicons:${CONTACT_ICON_MAP[type] || 'link'}`;
  };

  const renderContact = (contact: ContactDTO) => (
    <div
      key={contact.type}
      className="flex items-center gap-1"
      data-testid={`contact-${contact.type}`}
    >
      <span className="size-4" aria-hidden="true">
        <Icon
          icon={getContactIcon(contact.type)}
          className="size-4"
          data-testid={`${contact.type}-icon`}
        />
      </span>
      {contact.url ? (
        <a
          href={contact.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          {contact.value}
        </a>
      ) : (
        <span className="text-sm text-gray-600">{contact.value}</span>
      )}
    </div>
  );

  const contacts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.github,
  ].filter(
    (contact): contact is ContactDTO =>
      contact !== null && contact !== undefined,
  );

  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-xl font-semibold">{personalInfo.full_name}</h3>
        {contacts.length > 0 && (
          <div
            className="flex flex-wrap gap-x-4 gap-y-2 mt-2"
            data-testid="contacts-list"
          >
            {contacts.map(renderContact)}
          </div>
        )}
      </div>
      <Button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={onEdit}
        title="Edit personal information"
      >
        <span
          className="size-4"
          data-testid="edit-icon"
          aria-hidden="true"
        >
          <Icon icon="heroicons:pencil" />
        </span>
        <span className="sr-only">Edit personal information</span>
      </Button>
    </div>
  );
}
