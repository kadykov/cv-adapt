import { Button } from '@headlessui/react';
import { Icon } from '@iconify/react';
import { CVGenerationErrorBoundary } from '../CVGenerationErrorBoundary';

interface GenerateButtonProps {
  /**
   * ID of the job to generate CV for
   */
  jobId: number;


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
   * Click handler
   */
  onClick?: () => void;
}

/**
 * Button component that initiates CV generation for a specific job.
 */
export function GenerateButton({
  jobId,
  className = 'btn btn-primary gap-2',
  disabled = false,
  onClick,
}: GenerateButtonProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

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
