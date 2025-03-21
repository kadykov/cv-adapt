import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGenerationStatus } from './useGenerationStatus';
import { GenerationStep } from '@/features/cv-generation/utils';

interface StepState {
  /**
   * Whether competences have been generated
   */
  hasGeneratedCompetences: boolean;

  /**
   * Whether competences have been reviewed/edited
   */
  hasReviewedCompetences: boolean;

  /**
   * Whether CV has been generated
   */
  hasGeneratedCV: boolean;

  /**
   * Whether CV has been reviewed/edited
   */
  hasReviewedCV: boolean;

  /**
   * Optional notes for each step
   */
  stepNotes: {
    [K in GenerationStep]?: string;
  };
}

interface UseStepStateProps {
  /** Job ID for the generation flow */
  jobId: string;

  /** Current step in generation process */
  currentStep: GenerationStep;

  /** Generated CV ID if available */
  cvId?: number;
}

/**
 * Keys for step state queries
 */
const stepStateKeys = {
  all: ['stepState'] as const,
  byJob: (jobId: string) => [...stepStateKeys.all, jobId] as const,
};

/**
 * Hook to manage generation flow step state
 */
export function useStepState({ jobId, currentStep, cvId }: UseStepStateProps) {
  const queryClient = useQueryClient();
  const generationStatus = useGenerationStatus(cvId || 0);

  // Get current state from storage/cache
  const { data: stepState = getInitialStepState() } = useQuery<StepState>({
    queryKey: stepStateKeys.byJob(jobId),
    queryFn: () => {
      const currentState = queryClient.getQueryData<StepState>(stepStateKeys.byJob(jobId));
      return Promise.resolve(currentState || getInitialStepState());
    },
    staleTime: Infinity,
    gcTime: 0,
  });

  // Helper to update cache and trigger refetch
  const updateCache = useCallback(
    (newState: StepState) => {
      // Cancel any in-flight queries
      queryClient.cancelQueries({ queryKey: stepStateKeys.byJob(jobId) }).then(() => {
        // Update cache
        queryClient.setQueryData<StepState>(stepStateKeys.byJob(jobId), newState);
        // Force refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: stepStateKeys.byJob(jobId) });
      });
    },
    [jobId, queryClient]
  );

  // Update step state with mutation
  const { mutateAsync: updateStepState } = useMutation({
    mutationFn: async (updates: Partial<StepState>) => {
      const currentState = queryClient.getQueryData<StepState>(stepStateKeys.byJob(jobId)) || getInitialStepState();

      const newState = {
        ...currentState,
        ...updates,
        stepNotes: {
          ...currentState.stepNotes,
          ...(updates.stepNotes || {}),
        },
      };

      updateCache(newState);
      return newState;
    },
  });

  // Mark current step as completed
  const completeCurrentStep = useCallback(async () => {
    const updates: Partial<StepState> = {};

    switch (currentStep) {
      case 'competences.generate':
        updates.hasGeneratedCompetences = true;
        break;
      case 'competences.edit':
        updates.hasReviewedCompetences = true;
        break;
      case 'cv.generate':
        updates.hasGeneratedCV = true;
        break;
      case 'cv.edit':
        updates.hasReviewedCV = true;
        break;
    }

    await updateStepState(updates);
  }, [currentStep, updateStepState]);

  // Update notes for current step
  const updateStepNotes = useCallback(
    async (notes: string) => {
      const currentState = queryClient.getQueryData<StepState>(stepStateKeys.byJob(jobId)) || getInitialStepState();
      await updateStepState({
        stepNotes: {
          ...currentState.stepNotes, // Preserve existing notes
          [currentStep]: notes,
        },
      });
    },
    [currentStep, jobId, queryClient, updateStepState]
  );

  // Reset state for a fresh start
  const resetState = useCallback(async () => {
    const initialState = getInitialStepState();
    await queryClient.cancelQueries({ queryKey: stepStateKeys.byJob(jobId) });
    // Reset to initial state
    queryClient.setQueryData(stepStateKeys.byJob(jobId), initialState);
    // Force refetch
    queryClient.invalidateQueries({ queryKey: stepStateKeys.byJob(jobId) });
  }, [jobId, queryClient]);

  return {
    stepState,
    isCurrentStepComplete: isStepComplete(currentStep, stepState),
    isStepAllowed: canAccessStep(currentStep, stepState),
    completeCurrentStep,
    updateStepNotes,
    resetState,
    // Additional status from generation
    isLoading: generationStatus.isLoading,
    error: generationStatus.error,
  };
}

// Helper functions
function getInitialStepState(): StepState {
  return {
    hasGeneratedCompetences: false,
    hasReviewedCompetences: false,
    hasGeneratedCV: false,
    hasReviewedCV: false,
    stepNotes: {},
  };
}

function isStepComplete(step: GenerationStep, state: StepState): boolean {
  switch (step) {
    case 'competences.generate':
      return state.hasGeneratedCompetences;
    case 'competences.edit':
      return state.hasReviewedCompetences;
    case 'cv.generate':
      return state.hasGeneratedCV;
    case 'cv.edit':
      return state.hasReviewedCV;
    default:
      return true; // Parameters and export don't have completion state
  }
}

function canAccessStep(step: GenerationStep, state: StepState): boolean {
  switch (step) {
    case 'parameters':
      return true;
    case 'competences.generate':
      return true;
    case 'competences.edit':
      return state.hasGeneratedCompetences;
    case 'cv.generate':
      return state.hasReviewedCompetences;
    case 'cv.edit':
      return state.hasGeneratedCV;
    case 'export':
      return state.hasReviewedCV;
    default:
      return false;
  }
}
