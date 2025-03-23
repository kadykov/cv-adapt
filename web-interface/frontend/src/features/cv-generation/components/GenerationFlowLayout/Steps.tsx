import { Icon } from '@iconify/react';
import { Tab, TabGroup, TabList } from '@headlessui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import {
  GenerationStep,
  BaseStep,
  getBaseStep,
  getStepOrder,
  isStepAfter,
} from '../../utils/pathUtils';

interface StepsProps {
  /**
   * Current step in the generation flow
   */
  currentStep: GenerationStep;
}

interface StepConfig {
  id: BaseStep;
  label: string;
  icon: string;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'parameters',
    label: 'Parameters',
    icon: 'heroicons:document-text',
    description: 'Initial generation settings',
  },
  {
    id: 'competences',
    label: 'Core Competences',
    icon: 'heroicons:academic-cap',
    description: 'Key skills and experiences',
  },
  {
    id: 'cv',
    label: 'CV Content',
    icon: 'heroicons:document-duplicate',
    description: 'Full CV generation and editing',
  },
  {
    id: 'export',
    label: 'Export',
    icon: 'heroicons:arrow-down-tray',
    description: 'Download and share',
  },
];

/**
 * Component to display generation steps progress using HeadlessUI Tabs
 */
export function Steps({ currentStep }: StepsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const jobId = location.pathname.split('/')[2];
  const currentBase = getBaseStep(currentStep);
  const currentIndex = getStepOrder(currentBase);

  const navigateToStep = (stepId: BaseStep) => {
    // Don't navigate to future steps
    const currentBaseStep = getBaseStep(currentStep);
    if (isStepAfter(stepId, currentBaseStep)) {
      return;
    }

    switch (stepId) {
      case 'parameters':
        navigate(ROUTES.JOBS.GENERATE.PARAMETERS(jobId));
        break;
      case 'competences':
        navigate(ROUTES.JOBS.GENERATE.COMPETENCES.ROOT(jobId));
        break;
      case 'cv':
        navigate(ROUTES.JOBS.GENERATE.CV.ROOT(jobId));
        break;
      case 'export':
        navigate(ROUTES.JOBS.GENERATE.EXPORT(jobId));
        break;
    }
  };

  return (
    <nav role="navigation" aria-label="CV Generation Progress">
      <TabGroup
        selectedIndex={currentIndex}
        onChange={(index) => navigateToStep(STEPS[index].id)}
      >
        <TabList className="flex w-full justify-between items-center">
          {STEPS.map((step, index) => {
            const isUpcoming = isStepAfter(step.id, currentBase);
            const isCurrent = step.id === currentBase;
            const isCompleted = !isUpcoming && !isCurrent;

            return (
              <div key={step.id} className="flex items-center">
                <Tab
                  className={({ selected }) => `
                    group inline-flex flex-col items-center gap-2 px-4 py-2 rounded-lg
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    ${isUpcoming ? 'opacity-50 cursor-not-allowed' : ''}
                    ${selected ? 'bg-primary/10' : ''}
                  `}
                  disabled={isUpcoming}
                >
                  {({ selected }) => (
                    <>
                      <Icon
                        icon={step.icon}
                        className={`
                          w-6 h-6
                          ${isUpcoming ? 'text-gray-400' : ''}
                          ${isCurrent ? 'text-primary' : ''}
                          ${isCompleted ? 'text-success' : ''}
                        `}
                        aria-hidden="true"
                      />
                      <div className="flex flex-col items-center">
                        <span
                          className={`
                          text-sm font-medium
                          ${isUpcoming ? 'text-gray-400' : ''}
                          ${isCurrent ? 'text-primary' : ''}
                          ${isCompleted ? 'text-success' : ''}
                        `}
                        >
                          {step.label}
                        </span>
                        <span
                          className={`
                            text-xs
                            ${selected || isCurrent ? 'block' : 'hidden group-hover:block'}
                            ${isUpcoming ? 'text-gray-400' : 'text-gray-500'}
                          `}
                        >
                          {step.description}
                        </span>
                      </div>
                    </>
                  )}
                </Tab>
                {index < STEPS.length - 1 && (
                  <div
                    className={`
                      h-px w-16 mx-4
                      ${isCompleted ? 'bg-success' : 'bg-gray-300'}
                    `}
                    role="presentation"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </TabList>
      </TabGroup>
    </nav>
  );
}
