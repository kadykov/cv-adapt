import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@headlessui/react';
import { ROUTES } from '@/routes/paths';
import {
  GenerationStep,
  getBaseStep,
  getStepOrder,
} from '@/features/cv-generation/utils';

interface NavigationControlsProps {
  /**
   * Current step in the generation flow
   */
  currentStep: GenerationStep;

  /**
   * Whether to disable the next/continue button
   * @default false
   */
  disableNext?: boolean;
}

/**
 * Component to handle navigation between generation steps
 * Uses HeadlessUI Button for better accessibility
 */
export function NavigationControls({
  currentStep,
  disableNext = false,
}: NavigationControlsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const jobId = location.pathname.split('/')[2];
  const currentBase = getBaseStep(currentStep);
  const currentStepIndex = getStepOrder(currentBase);

  const navigateNext = () => {
    if (disableNext) return;

    switch (currentStep) {
      case 'parameters':
        navigate(ROUTES.JOBS.GENERATE.COMPETENCES.GENERATE(jobId));
        break;
      case 'competences.generate':
        navigate(ROUTES.JOBS.GENERATE.COMPETENCES.EDIT(jobId));
        break;
      case 'competences.edit':
        navigate(ROUTES.JOBS.GENERATE.CV.GENERATE(jobId));
        break;
      case 'cv.generate':
        navigate(ROUTES.JOBS.GENERATE.CV.EDIT(jobId));
        break;
      case 'cv.edit':
        navigate(ROUTES.JOBS.GENERATE.EXPORT(jobId));
        break;
      case 'export':
        navigate(ROUTES.JOBS.DETAIL(jobId));
        break;
    }
  };

  const getBackPath = (): string => {
    switch (currentStep) {
      case 'parameters':
        return ROUTES.JOBS.DETAIL(jobId);
      case 'competences.generate':
        return ROUTES.JOBS.GENERATE.PARAMETERS(jobId);
      case 'competences.edit':
        return ROUTES.JOBS.GENERATE.COMPETENCES.GENERATE(jobId);
      case 'cv.generate':
        return ROUTES.JOBS.GENERATE.COMPETENCES.EDIT(jobId);
      case 'cv.edit':
        return ROUTES.JOBS.GENERATE.CV.GENERATE(jobId);
      case 'export':
        return ROUTES.JOBS.GENERATE.CV.EDIT(jobId);
      default:
        return ROUTES.JOBS.DETAIL(jobId);
    }
  };

  const getNextButtonLabel = () => {
    if (currentStep === 'export') return 'Return to Job';
    if (currentStepIndex === 3) return 'Finish';
    return 'Continue';
  };

  return (
    <div className="flex justify-between items-center gap-4">
      {/* Back button, disabled on first step */}
      <Button
        type="button"
        className="btn btn-outline"
        onClick={() => navigate(getBackPath())}
        aria-label="Go back to previous step"
        disabled={currentStep === 'parameters'}
      >
        Back
      </Button>

      <div className="flex gap-2">
        {/* Cancel button always available */}
        <Button
          type="button"
          className="btn"
          onClick={() => navigate(ROUTES.JOBS.DETAIL(jobId))}
          aria-label="Cancel CV generation"
        >
          Cancel
        </Button>

        {/* Next/Continue button */}
        <Button
          type="button"
          className="btn btn-primary"
          onClick={navigateNext}
          disabled={disableNext}
          aria-label={`${disableNext ? 'Please complete current step before continuing' : getNextButtonLabel()}`}
        >
          {getNextButtonLabel()}
        </Button>
      </div>
    </div>
  );
}
