import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { GenerationParametersPage } from '../GenerationParametersPage';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCVGenerationFlow } from '@/features/cv-generation/hooks/useCVGenerationFlow';
import { useStepState } from '@/features/cv-generation/hooks/useStepState';

// Mock hooks
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  useLocation: vi.fn().mockReturnValue({
    pathname: '/jobs/123/cv-generation/parameters',
    search: '?language=en',
    hash: '',
    state: null,
  }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/features/cv-generation/hooks/useCVGenerationFlow', () => ({
  useCVGenerationFlow: vi.fn(),
}));

vi.mock('@/features/cv-generation/hooks/useStepState', () => ({
  useStepState: vi.fn(),
}));

vi.mock('@/features/cv-generation/hooks/useNavigationGuard', () => ({
  useNavigationGuard: vi.fn(),
}));

describe('GenerationParametersPage', () => {
  const defaultJob = {
    id: 123,
    title: 'Software Engineer',
    description: 'Job description',
    language_code: 'en',
    created_at: '2024-03-23T10:36:06Z',
    updated_at: null
  };

  // User event setup
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock useParams
    vi.mocked(useParams).mockReturnValue({ jobId: '123' });

    // Mock useSearchParams
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams('?language=en'),
      vi.fn(),
    ]);

    // Mock useCVGenerationFlow with all required properties
    vi.mocked(useCVGenerationFlow).mockReturnValue({
      job: defaultJob,
      cv: null,
      generateCompetences: vi.fn().mockResolvedValue(undefined),
      generateCV: vi.fn().mockResolvedValue(undefined),
      updateCV: vi.fn().mockResolvedValue(undefined),
      isGeneratingCompetences: false,
      isGeneratingCV: false,
      competencesError: null,
      cvError: null,
      competences: [],
      approveCompetence: vi.fn(),
    });

    // Mock useStepState with all required properties
    vi.mocked(useStepState).mockReturnValue({
      stepState: {
        hasGeneratedCompetences: false,
        hasReviewedCompetences: false,
        hasGeneratedCV: false,
        hasReviewedCV: false,
        stepNotes: {
          parameters: '',
        },
      },
      isCurrentStepComplete: true,
      isStepAllowed: true,
      completeCurrentStep: vi.fn().mockResolvedValue(undefined),
      updateStepNotes: vi.fn(),
      resetState: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      error: null,
    });
  });

  test('renders generation form when job is available', () => {
    render(<GenerationParametersPage />);

    expect(screen.getByRole('heading')).toHaveTextContent('Generate CV for Software Engineer');
    expect(screen.getByTestId('generate-competences-button')).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  test('shows loading state during competence generation', async () => {
    // Mock generateCompetences to delay response
    vi.mocked(useCVGenerationFlow).mockReturnValue({
      job: defaultJob,
      cv: null,
      generateCompetences: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
      generateCV: vi.fn().mockResolvedValue(undefined),
      updateCV: vi.fn().mockResolvedValue(undefined),
      isGeneratingCompetences: true,
      isGeneratingCV: false,
      competencesError: null,
      cvError: null,
      competences: [],
      approveCompetence: vi.fn(),
    });

    render(<GenerationParametersPage />);

    screen.getByTestId('generation-form'); // verify form exists
    const generateButton = screen.getByTestId('generate-competences-button');
    await user.click(generateButton);

    expect(generateButton).toBeDisabled();
    expect(generateButton).toHaveTextContent(/generating competences/i);
  });

  test('updates notes when user types', async () => {
    const mockUpdateStepNotes = vi.fn();
    vi.mocked(useStepState).mockReturnValue({
      stepState: {
        hasGeneratedCompetences: false,
        hasReviewedCompetences: false,
        hasGeneratedCV: false,
        hasReviewedCV: false,
        stepNotes: {
          parameters: '',
        },
      },
      isCurrentStepComplete: true,
      isStepAllowed: true,
      completeCurrentStep: vi.fn().mockResolvedValue(undefined),
      updateStepNotes: mockUpdateStepNotes,
      resetState: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      error: null,
    });

    render(<GenerationParametersPage />);

    const notesInput = screen.getByLabelText(/notes/i);
    await user.type(notesInput, 'Test notes');

    expect(mockUpdateStepNotes).toHaveBeenCalledTimes(10); // One call per character
    expect(mockUpdateStepNotes.mock.calls.map(call => call[0]).join('')).toBe('Test notes');
  });

  test('shows error message when competence generation fails', async () => {
    const mockError = new Error('Failed to generate');
    vi.mocked(useCVGenerationFlow).mockReturnValue({
      job: defaultJob,
      cv: null,
      generateCompetences: vi.fn().mockRejectedValue(mockError),
      generateCV: vi.fn().mockResolvedValue(undefined),
      updateCV: vi.fn().mockResolvedValue(undefined),
      isGeneratingCompetences: false,
      isGeneratingCV: false,
      competencesError: mockError,
      cvError: null,
      competences: [],
      approveCompetence: vi.fn(),
    });

    render(<GenerationParametersPage />);

    screen.getByTestId('generation-form'); // verify form exists
    const generateButton = screen.getByTestId('generate-competences-button');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
    });
  });

  test('shows success message when competences are generated', () => {
    vi.mocked(useCVGenerationFlow).mockReturnValue({
      job: defaultJob,
      cv: null,
      generateCompetences: vi.fn().mockResolvedValue(undefined),
      generateCV: vi.fn().mockResolvedValue(undefined),
      updateCV: vi.fn().mockResolvedValue(undefined),
      isGeneratingCompetences: false,
      isGeneratingCV: false,
      competencesError: null,
      cvError: null,
      competences: [
        { id: 'comp-1', text: 'Skill 1', isApproved: false },
        { id: 'comp-2', text: 'Skill 2', isApproved: false }
      ],
      approveCompetence: vi.fn(),
    });

    render(<GenerationParametersPage />);

    expect(screen.getByText(/generated 2 competences successfully/i)).toBeInTheDocument();
  });

  test('returns null when jobId is missing', () => {
    vi.mocked(useParams).mockReturnValue({});

    const { container } = render(<GenerationParametersPage />);
    expect(container).toBeEmptyDOMElement();
  });

  test('returns null when language is missing', () => {
    vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(), vi.fn()]);

    const { container } = render(<GenerationParametersPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
