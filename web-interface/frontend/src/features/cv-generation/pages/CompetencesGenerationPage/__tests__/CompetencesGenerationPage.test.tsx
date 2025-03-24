import { describe, test, expect, vi } from 'vitest';
import { screen, waitFor, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockJob } from '@/features/cv-generation/testing/fixtures';
import { CompetencesGenerationPage } from '../CompetencesGenerationPage';
import { useCVGenerationFlow } from '@/features/cv-generation/hooks/useCVGenerationFlow';

type CVGenerationFlowResult = ReturnType<typeof useCVGenerationFlow>;

vi.mock('@/features/cv-generation/hooks/useNavigationGuard', () => ({
  useNavigationGuard: vi.fn(),
}));

vi.mock('@/features/cv-generation/hooks/useStepState', () => ({
  useStepState: () => ({
    isCurrentStepComplete: false,
    completeCurrentStep: vi.fn(),
  }),
}));

vi.mock('@/features/cv-generation/hooks/useCVGenerationFlow');

interface Competence {
  id: string;
  text: string;
  isApproved: boolean;
}

const createMockState = (initialCompetences: Competence[] = []) => {
  let competences = [...initialCompetences];

  const mockImplementation: CVGenerationFlowResult = {
    job: mockJob,
    cv: null,
    competences,
    isGeneratingCompetences: false,
    isGeneratingCV: false,
    competencesError: null,
    cvError: null,
    approveCompetence: vi.fn().mockImplementation(async (id: string, isApproved: boolean) => {
      competences = competences.map(comp =>
        comp.id === id ? { ...comp, isApproved } : comp
      );
      updateMockState();
      return Promise.resolve();
    }),
    generateCompetences: vi.fn().mockResolvedValue(undefined),
    generateCV: vi.fn().mockResolvedValue(undefined),
    updateCV: vi.fn().mockResolvedValue(undefined),
  };

  function updateMockState() {
    vi.mocked(useCVGenerationFlow).mockImplementation(() => ({
      ...mockImplementation,
      competences: competences.map(comp => ({ ...comp })), // Deep clone
      job: mockJob,
      cv: null,
      isGeneratingCompetences: false,
      isGeneratingCV: false,
      competencesError: null,
      cvError: null,
    }));
  }

  return {
    competences,
    approveCompetence: mockImplementation.approveCompetence,
    setCompetences: (newCompetences: typeof competences) => {
      competences = [...newCompetences];
      updateMockState();
    },
    getCompetences: () => competences,
    getMockImplementation: () => ({ ...mockImplementation, competences: [...competences] }),
  };
};

const testCompetences: Competence[] = [
  { id: '1', text: 'Leadership', isApproved: false },
  { id: '2', text: 'Communication', isApproved: false },
];

describe('CompetencesGenerationPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderWithRouter = (jobId = '123', languageCode = 'en') => {
    const router = createMemoryRouter(
      [
        {
          path: '/jobs/:jobId/generate/competences',
          element: <CompetencesGenerationPage />,
        },
      ],
      {
        initialEntries: [
          `/jobs/${jobId}/generate/competences?language=${languageCode}`,
        ],
      },
    );

    const user = userEvent.setup();

    return {
      user,
      ...render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>,
      ),
    };
  };

  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('should show loading state when generating competences', async () => {
    const mockState = createMockState();

    vi.mocked(useCVGenerationFlow).mockImplementation(() => ({
      ...mockState.getMockImplementation(),
      isGeneratingCompetences: true,
    }));

    renderWithRouter();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/generating competences/i)).toBeInTheDocument();
  });

  test('should display generated competences', async () => {
    const mockState = createMockState(testCompetences);

    vi.mocked(useCVGenerationFlow).mockImplementation(() => mockState.getMockImplementation());

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Leadership')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
    });

    // Verify switches using role
    const leadershipSwitch = screen.getByRole('switch', {
      name: /approve competence: leadership/i,
    });
    const communicationSwitch = screen.getByRole('switch', {
      name: /approve competence: communication/i,
    });
    expect(leadershipSwitch).toBeInTheDocument();
    expect(communicationSwitch).toBeInTheDocument();
    expect(leadershipSwitch).toHaveAttribute('aria-checked', 'false');
  });

  test('should handle competence approval', async () => {
    const mockState = createMockState(testCompetences);

    vi.mocked(useCVGenerationFlow).mockImplementation(() => mockState.getMockImplementation());

    const { user } = renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Leadership')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', {
      name: /approve competence: leadership/i,
    });
    await user.click(toggle);
    await waitFor(() => {
      const competences = mockState.getCompetences();
      expect(competences[0].isApproved).toBe(true);
      expect(screen.getByTestId('switch-1')).toHaveClass('bg-primary');
    }, { timeout: 3000 });

    // Finally check the styling
    expect(toggle.closest('div')?.closest('div')).toHaveClass('border-primary');
  });

  test('should show error state', async () => {
    const mockState = createMockState();

    vi.mocked(useCVGenerationFlow).mockImplementation(() => ({
      ...mockState.getMockImplementation(),
      competencesError: new Error('Failed to generate competences'),
    }));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to generate competences',
      );
    });
  });

  test('should show empty state', async () => {
    const mockState = createMockState();

    vi.mocked(useCVGenerationFlow).mockImplementation(() => mockState.getMockImplementation());

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText(/no competences generated yet/i),
      ).toBeInTheDocument();
    });
  });

  test('should handle multiple competence selections', async () => {
    const mockState = createMockState(testCompetences);

    vi.mocked(useCVGenerationFlow).mockImplementation(() => mockState.getMockImplementation());

    const { user } = renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Leadership')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
    });

    const toggle1 = screen.getByRole('switch', {
      name: /approve competence: leadership/i,
    });
    const toggle2 = screen.getByRole('switch', {
      name: /approve competence: communication/i,
    });

    await Promise.all([
      user.click(toggle1),
      user.click(toggle2)
    ]);

    await waitFor(() => {
      const competences = mockState.getCompetences();
      expect(competences[0].isApproved).toBe(true);
      expect(competences[1].isApproved).toBe(true);
      expect(screen.getByTestId('switch-1')).toHaveClass('bg-primary');
      expect(screen.getByTestId('switch-2')).toHaveClass('bg-primary');
    }, { timeout: 3000 });
  });

  test('should maintain selection state', async () => {
    const mockState = createMockState(testCompetences);

    vi.mocked(useCVGenerationFlow).mockImplementation(() => mockState.getMockImplementation());

    const { user } = renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Leadership')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', {
      name: /approve competence: leadership/i,
    });

    await user.click(toggle);
    expect(mockState.approveCompetence).toHaveBeenCalledWith('1', true);
    await waitFor(() => {
      const competence = mockState.getCompetences()[0];
      expect(competence.isApproved).toBe(true);
    });

    // Verify both aria-checked and headlessui state
    await waitFor(() => {
      const competence = mockState.getCompetences()[0];
      expect(competence.isApproved).toBe(true);
      expect(screen.getByTestId('switch-1')).toHaveClass('bg-primary');
    }, { timeout: 3000 });

    await user.click(toggle);
    expect(mockState.approveCompetence).toHaveBeenCalledWith('1', false);
    await waitFor(() => {
      const competence = mockState.getCompetences()[0];
      expect(competence.isApproved).toBe(false);
    });

    await waitFor(() => {
      const competence = mockState.getCompetences()[0];
      expect(competence.isApproved).toBe(false);
      expect(screen.getByTestId('switch-1')).toHaveClass('bg-base-300');
    });

    await user.click(toggle);
    expect(mockState.approveCompetence).toHaveBeenCalledWith('1', true);
    await waitFor(() => {
      const competence = mockState.getCompetences()[0];
      expect(competence.isApproved).toBe(true);
    });

    await waitFor(() => {
      const competence = mockState.getCompetences()[0];
      expect(competence.isApproved).toBe(true);
      expect(screen.getByTestId('switch-1')).toHaveClass('bg-primary');
    });
  });
});
