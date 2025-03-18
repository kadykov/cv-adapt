import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogPanel,
  Description,
  Field,
  Fieldset,
  Label,
  Legend,
  Textarea,
  Button,
  Switch
} from '@headlessui/react';
import { useGenerationStatus } from '../../hooks/useGenerationStatus';
import { useCVGenerationFlow } from '../../hooks/useCVGenerationFlow';

export function GenerationParametersPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const languageCode = searchParams.get('language');
  const [notes, setNotes] = useState('');
  const [selectedCompetences, setSelectedCompetences] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    job,
    generateCompetences,
    generateFullCV,
    isGeneratingCompetences,
    isGeneratingCV,
    competencesError,
    cvError,
    competences,
  } = useCVGenerationFlow(Number(jobId));

  // When new competences are generated, select all by default
  useEffect(() => {
    if (competences.length) {
      setSelectedCompetences(new Set(competences));
    }
  }, [competences]);

  const { isOpen, closeModal } = useGenerationStatus(Number(jobId));

  if (!jobId || !languageCode || !job) {
    return null;
  }

  const handleProceed = async () => {
    const selectedArray = Array.from(selectedCompetences);
    if (selectedArray.length === 0) {
      setValidationError('Please select at least one competence');
      return;
    }
    setValidationError(null);
    try {
      await generateFullCV({
        cvText: "Example CV text", // TODO: Get actual CV text
        notes
      });
      closeModal();
    } catch (error) {
      console.error('Failed to generate CV:', error);
    }
  };

  const handleGenerateCompetences = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    try {
      await generateCompetences({
        cvText: "Example CV text", // TODO: Get CV text
        notes
      });
    } catch (error) {
      console.error('Failed to generate competences:', error);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="card w-full max-w-2xl bg-base-100">
            <div className="card-body">
              <DialogTitle as="h2" className="card-title text-2xl font-bold">
                Generate CV for {job.title}
              </DialogTitle>

              <div className="divider" role="separator" />

              <Description as="p" className="py-4">
                We will use job description and your detailed CV to generate a customized CV
                that highlights your most relevant skills and experience.
              </Description>

              <form
                id="generation-form"
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
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Add notes about specific requirements for CV generation, like style preferences or key aspects to emphasize
                    </p>
                  </Field>
                </Fieldset>

                {competences.length > 0 && (
                  <Fieldset>
                    <Legend className="text-lg font-medium">Generated Competences</Legend>
                    <div className="mt-4 space-y-2">
                      {competences.map((competence, index) => (
                        <Field key={index} className="flex items-center justify-between py-2">
                          <Label htmlFor={`competence-${index}`} className="flex-grow">
                            {competence}
                          </Label>
                          <Switch
                            id={`competence-${index}`}
                            checked={selectedCompetences.has(competence)}
                            onChange={(checked) => {
                              setSelectedCompetences(prev => {
                                const newSelected = new Set(prev);
                                if (checked) {
                                  newSelected.add(competence);
                                } else {
                                  newSelected.delete(competence);
                                }
                                return newSelected;
                              });
                            }}
                            className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors data-[checked]:bg-primary"
                          >
                            <span
                              className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6"
                              aria-hidden="true"
                            />
                          </Switch>
                        </Field>
                      ))}
                    </div>
                  </Fieldset>
                )}

                {validationError && (
                  <div role="alert" aria-live="polite" className="text-error text-sm">
                    {validationError}
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    className="btn"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  {!competences.length ? (
                    <Button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isGeneratingCompetences}
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
                  ) : (
                    <Button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleProceed}
                      disabled={isGeneratingCV}
                    >
                      {isGeneratingCV ? (
                        <>
                          <span className="loading loading-spinner" aria-hidden="true" />
                          <span>Generating CV...</span>
                        </>
                      ) : (
                        `Proceed with ${selectedCompetences.size} Selected Competences`
                      )}
                    </Button>
                  )}
                </div>
              </form>

              {(competencesError || cvError) && (
                <div role="alert" className="alert alert-error mt-4">
                  <span>
                    {(competencesError || cvError) instanceof Error
                      ? (competencesError || cvError)?.message
                      : 'Unknown error'}
                  </span>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
