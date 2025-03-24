import { useParams, useSearchParams } from 'react-router-dom';
import { Field, Fieldset, Legend, Switch } from '@headlessui/react';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import { GenerationFlowLayout } from '@/features/cv-generation/components/GenerationFlowLayout';
import { useStepState } from '@/features/cv-generation/hooks/useStepState';
import { useNavigationGuard } from '@/features/cv-generation/hooks/useNavigationGuard';
import { useCVGenerationFlow } from '@/features/cv-generation/hooks/useCVGenerationFlow';

export function CompetencesGenerationPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const languageCode = searchParams.get('language');

  const {
    job,
    competences,
    isGeneratingCompetences,
    competencesError,
    approveCompetence,
  } = useCVGenerationFlow(Number(jobId));

  const { isCurrentStepComplete, completeCurrentStep } = useStepState({
    jobId,
    currentStep: 'competences.generate',
  });

  // Protect against invalid navigation
  useNavigationGuard({
    jobId,
    currentStep: 'competences.generate',
    isStepCompleted: isCurrentStepComplete,
  });

  if (!jobId || !languageCode || !job) {
    return null;
  }

  const handleCompetenceToggle = (id: string, isApproved: boolean) => {
    // Update approved competences list
    approveCompetence(id, isApproved);

    // If we have at least one approved competence, mark step as complete
    if (competences.some((c) => c.isApproved)) {
      completeCurrentStep();
    }
  };

  return (
    <GenerationFlowLayout
      heading="Review Generated Competences"
      disableNext={!isCurrentStepComplete}
    >
      <div className="space-y-6">
        <Fieldset className="space-y-4">
          <Legend className="text-lg font-medium">
            Generated Core Competences
          </Legend>
          <p className="text-gray-600">
            Review and select the most relevant competences that match your
            experience and the job requirements. You must approve at least one
            competence to continue.
          </p>

          {competencesError && (
            <div role="alert" className="alert alert-error">
              <Icon icon="heroicons:exclamation-circle" className="size-5" />
              <span>
                {competencesError instanceof Error
                  ? competencesError.message
                  : 'Failed to generate competences'}
              </span>
            </div>
          )}

          {isGeneratingCompetences ? (
            <div
              role="status"
              className="flex items-center justify-center p-8 bg-gray-50 rounded-lg"
            >
              <Icon
                icon="heroicons:arrow-path"
                className="size-5 animate-spin text-primary"
                aria-hidden="true"
              />
              <span className="ml-2">Generating competences...</span>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {competences.map((competence) => (
                <Field as="div" key={competence.id}>
                  <div
                    className={`p-4 border rounded-lg transition-colors ${
                      competence.isApproved
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Switch
                        checked={competence.isApproved}
                        onChange={(checked: boolean) =>
                          handleCompetenceToggle(competence.id, checked)
                        }
                        data-testid={`switch-${competence.id}`}
                        className={clsx(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          competence.isApproved ? 'bg-primary' : 'bg-base-300'
                        )}
                      >
                        <span className="sr-only">
                          Approve competence: {competence.text}
                        </span>
                        <span
                          aria-hidden="true"
                          className={clsx(
                            'inline-block size-4 transform rounded-full bg-white transition duration-200 ease-in-out',
                            competence.isApproved ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </Switch>
                      <div className="flex-1">
                        <p className="text-sm">{competence.text}</p>
                      </div>
                    </div>
                  </div>
                </Field>
              ))}
            </div>
          )}
        </Fieldset>

        {!isGeneratingCompetences && competences.length === 0 && (
          <div className="alert alert-info">
            <Icon icon="heroicons:information-circle" className="size-5" />
            <span>
              No competences generated yet. Please go back and generate
              competences first.
            </span>
          </div>
        )}
      </div>
    </GenerationFlowLayout>
  );
}
