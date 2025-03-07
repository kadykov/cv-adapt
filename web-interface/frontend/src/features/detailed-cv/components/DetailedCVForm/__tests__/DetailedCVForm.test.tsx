import { vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../../../../lib/test/test-utils';
import { DetailedCVForm } from '../DetailedCVForm';
import type { DetailedCVResponse } from '../../../../../lib/api/generated-types';
import { LanguageCode } from '../../../../../lib/language/types';

// Create a mock module
const mockUseDetailedCVMutations = vi.fn();

// Mock the module
vi.mock('../../../hooks/useDetailedCVMutations', () => ({
  useDetailedCVMutations: () => mockUseDetailedCVMutations(),
}));

describe('DetailedCVForm', () => {
  const createMockMutation = (mutateAsync = vi.fn().mockResolvedValue({})) => ({
    mutateAsync,
    mutate: vi.fn(),
    variables: undefined,
    data: undefined,
    error: null,
    isError: false as const,
    isPending: false as const,
    isSuccess: false as const,
    isIdle: true as const,
    failureCount: 0,
    failureReason: null,
    status: 'idle' as const,
    reset: vi.fn(),
    context: undefined,
    isPaused: false,
    submittedAt: 0,
  });

  const mockCV = {
    id: 1,
    user_id: 1,
    language_code: 'en',
    content: '# Test CV\n\nThis is a test CV content.',
    is_primary: false,
    created_at: '2024-02-17T12:00:00Z',
    updated_at: null,
  } as DetailedCVResponse;

  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock implementation
    mockUseDetailedCVMutations.mockReturnValue({
      upsertCV: createMockMutation(),
      deleteCV: createMockMutation(),
      setPrimary: createMockMutation(),
    });
  });

  it('renders the form in create mode', () => {
    render(
      <DetailedCVForm
        mode="create"
        languageCode={LanguageCode.ENGLISH}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    // Check form elements
    expect(screen.getByText('CV Content (Markdown)')).toBeInTheDocument();
    expect(screen.getByText('Set as primary CV')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create CV')).toBeInTheDocument();
  });

  it('renders the form in edit mode with initial data', () => {
    render(
      <DetailedCVForm
        mode="edit"
        languageCode={LanguageCode.ENGLISH}
        initialData={mockCV}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    // Content should be pre-filled
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('# Test CV\n\nThis is a test CV content.');

    // Primary switch should match initial data
    const primarySwitch = screen.getByRole('switch');
    expect(primarySwitch).not.toBeChecked();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <DetailedCVForm
        mode="create"
        languageCode={LanguageCode.ENGLISH}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('validates required fields', async () => {
    render(
      <DetailedCVForm
        mode="create"
        languageCode={LanguageCode.ENGLISH}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    // Submit with empty content
    fireEvent.click(screen.getByText('Create CV'));

    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText('Content is required')).toBeInTheDocument();
    });
  });

  it('submits the form with the correct language code', async () => {
    const mockUpsertCV = vi.fn().mockResolvedValue({});

    // Override the mock for this test
    mockUseDetailedCVMutations.mockReturnValue({
      upsertCV: createMockMutation(mockUpsertCV),
      deleteCV: createMockMutation(),
      setPrimary: createMockMutation(),
    });

    render(
      <DetailedCVForm
        mode="create"
        languageCode={LanguageCode.GERMAN}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    // Fill in content
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, {
      target: { value: '# New CV\n\nThis is new content.' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create CV'));

    // Check that upsertCV was called with the correct language code
    await waitFor(() => {
      expect(mockUpsertCV).toHaveBeenCalledWith({
        languageCode: LanguageCode.GERMAN,
        data: {
          content: '# New CV\n\nThis is new content.',
          language_code: LanguageCode.GERMAN,
          is_primary: false,
        },
      });
    });
  });
});
