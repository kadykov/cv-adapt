import { useParams, useSearchParams } from 'react-router-dom';
import {
  Field,
  Fieldset,
  Textarea,
  Label,
  Legend,
  Button,
} from '@headlessui/react';
import { useStepState } from '@/features/cv-generation/hooks/useStepState';
import { useNavigationGuard } from '@/features/cv-generation/hooks/useNavigationGuard';
import { useCVGenerationFlow } from '@/features/cv-generation/hooks/useCVGenerationFlow';
import { GenerationFlowLayout } from '@/features/cv-generation/components/GenerationFlowLayout';

export function GenerationParametersPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const languageCode = searchParams.get('language');

  const {
    job,
    generateCompetences,
    isGeneratingCompetences,
    competencesError,
    competences,
  } = useCVGenerationFlow(Number(jobId));

  const { stepState, isCurrentStepComplete, updateStepNotes } = useStepState({
    jobId,
    currentStep: 'parameters',
  });

  // Protect against invalid navigation
  useNavigationGuard({
    jobId,
    currentStep: 'parameters',
    isStepCompleted: isCurrentStepComplete,
  });

  if (!jobId || !languageCode || !job) {
    return null;
  }

  const handleGenerateCompetences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generateCompetences({
        cv_text: 'Example CV text', // TODO: Get CV text
        job_description: job.description,
        notes: stepState.stepNotes.parameters,
      });
    } catch (error) {
      console.error('Failed to generate competences:', error);
    }
  };

  return (
    <GenerationFlowLayout
      heading={`Generate CV for ${job.title}`}
      disableNext={!isCurrentStepComplete}
    >
      <p className="py-4">
        We will use job description and your detailed CV to generate a
        customized CV that highlights your most relevant skills and experience.
      </p>

      <form
        id="generation-form"
        data-testid="generation-form"
        className="space-y-8"
        onSubmit={handleGenerateCompetences}
        noValidate
      >
        <Fieldset>
          <Legend className="text-lg font-medium">Generation Options</Legend>
          <Field className="mt-4">
            <Label htmlFor="notes">Notes for generation (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
              placeholder="Enter any specific requirements or preferences for CV generation..."
              value={stepState.stepNotes.parameters || ''}
              onChange={(e) => updateStepNotes(e.target.value)}
            />
            <p className="mt-2 text-sm text-gray-500">
              Add notes about specific requirements for CV generation, like
              style preferences or key aspects to emphasize
            </p>
          </Field>
        </Fieldset>

        <div className="flex justify-end">
          <Button
            type="submit"
            data-testid="generate-competences-button"
            className="btn btn-primary"
            disabled={isGeneratingCompetences}
            aria-busy={isGeneratingCompetences}
          >
            {isGeneratingCompetences ? (
              <>
                <span className="loading loading-spinner" aria-hidden="true" />
                <span>Generating Competences...</span>
              </>
            ) : (
              'Generate Competences'
            )}
          </Button>
        </div>

        {competencesError && (
          <div role="alert" className="alert alert-error">
            <span>
              {competencesError instanceof Error
                ? competencesError.message
                : 'Failed to generate competences'}
            </span>
          </div>
        )}

        {competences.length > 0 && (
          <div role="alert" className="alert alert-success">
            <span>
              Generated {competences.length} competences successfully. Please
              proceed to review them.
            </span>
          </div>
        )}
      </form>
    </GenerationFlowLayout>
  );
}
