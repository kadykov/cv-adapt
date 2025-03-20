import { Button } from '@headlessui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { CVGenerationErrorBoundary } from '../CVGenerationErrorBoundary';
import { LanguageCode } from '@/lib/language/types';
import { isValidLanguageCode } from '@/lib/language/utils';
import { toApiLanguage } from '@/lib/language/adapters';

interface GenerateButtonProps {
  /**
   * ID of the job to generate CV for
   */
  jobId: number;

  /**
   * Language code for CV generation.
   * Uses our local LanguageCode enum but ensures API compatibility.
   */
  language: LanguageCode;

  /**
   * Optional class name for styling
   * @default 'btn btn-primary gap-2'
   */
  className?: string;

  /**
   * Optional disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Optional click handler override
   * By default, navigates to CV generation flow
   */
  onClick?: () => void;
}

/**
 * Button component that initiates CV generation for a specific job.
 * Navigates to the CV generation flow with the specified job and language.
 *
 * Uses a type adapter to ensure language codes are compatible with the API
 * while maintaining strong type safety in our codebase.
 */
export function GenerateButton({
  jobId,
  language,
  className = 'btn btn-primary gap-2',
  disabled = false,
  onClick,
}: GenerateButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;

    // Convert language to API type before using
    const apiLanguage = toApiLanguage(language);

    if (onClick) {
      onClick();
    } else {
      const searchParams = new URLSearchParams();
      searchParams.set('language', apiLanguage);
      const path = ROUTES.JOBS.GENERATE.PARAMETERS(jobId);
      navigate(`${path}?${searchParams.toString()}`);
    }
  };

  // Early validation return
  if (!isValidLanguageCode(language)) {
    console.error(`Invalid language code: ${language}`);
    return null;
  }

  return (
    <CVGenerationErrorBoundary>
      <Button
        onClick={handleClick}
        className={className}
        disabled={disabled}
        type="button"
        aria-label={`Generate CV for job ${jobId}`}
        aria-disabled={disabled}
      >
        <Icon
          icon="heroicons:document"
          className="w-5 h-5"
          aria-hidden="true"
          data-testid="generate-cv-icon"
        />
        <span>Generate CV</span>
      </Button>
    </CVGenerationErrorBoundary>
  );
}
