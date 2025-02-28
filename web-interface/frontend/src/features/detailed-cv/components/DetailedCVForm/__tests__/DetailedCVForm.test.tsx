import { vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../../../../lib/test/test-utils';
import { DetailedCVForm } from '../DetailedCVForm';
import type { DetailedCVResponse } from '../../../../../lib/api/generated-types';
import { LanguageCode } from '../../../../../lib/language/types';

// Mock the useDetailedCVMutations hook
vi.mock('../../../hooks/useDetailedCVMutations', () => ({
  useDetailedCVMutations: () => ({
    upsertCV: {
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null,
    },
  }),
}));

// Mock the getLanguageOptions function
vi.mock('../../../../../lib/language/config', () => ({
  getLanguageOptions: () => [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ],
}));

describe('DetailedCVForm', () => {
  const mockCV = {
    id: 1,
    user_id: 1,
    language_code: 'en',
    content: {
      markdown: '# Test CV\n\nThis is a test CV content.',
    } as unknown as Record<string, never>,
    is_primary: false,
    created_at: '2024-02-17T12:00:00Z',
    updated_at: null,
  } as DetailedCVResponse;

  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form in create mode', () => {
    render(
      <DetailedCVForm
        mode="create"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    // Check form elements
    expect(screen.getByText('Language')).toBeInTheDocument();
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
        initialData={mockCV}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    // Language should be disabled in edit mode
    const languageButton = screen.getByLabelText('Language');
    expect(languageButton).toHaveAttribute('disabled');

    // Content should be pre-filled
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('# Test CV\n\nThis is a test CV content.');
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <DetailedCVForm
        mode="create"
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
});
