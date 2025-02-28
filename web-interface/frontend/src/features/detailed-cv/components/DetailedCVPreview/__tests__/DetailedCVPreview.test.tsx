import { vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../../../lib/test/test-utils';
import { DetailedCVPreview } from '..';
import type { DetailedCVResponse } from '../../../../../lib/api/generated-types';

// Mock the hooks
vi.mock('../../../hooks/useDetailedCVs', () => ({
  useDetailedCV: () => ({
    data: {
      id: 1,
      user_id: 1,
      language_code: 'en',
      content: {
        markdown: '# Test CV\n\nThis is a test CV content.',
      } as unknown as Record<string, never>,
      is_primary: false,
      created_at: '2024-02-17T12:00:00Z',
      updated_at: null,
    } as DetailedCVResponse,
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('../../../hooks/useDetailedCVMutations', () => ({
  useDetailedCVMutations: () => ({
    deleteCV: {
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null,
    },
    setPrimary: {
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null,
    },
  }),
}));

// Mock window.confirm
const originalConfirm = window.confirm;
window.confirm = vi.fn().mockReturnValue(true);

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}));

describe('DetailedCVPreview', () => {
  const mockOnEdit = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    window.confirm = originalConfirm;
  });

  it('renders the CV preview with markdown content', () => {
    render(
      <DetailedCVPreview
        languageCode="en"
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    // Check language badge
    expect(screen.getByText('en')).toBeInTheDocument();

    // Check markdown content
    expect(screen.getByTestId('markdown-content')).toHaveTextContent(
      '# Test CV This is a test CV content.',
    );

    // Check buttons
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Set as Primary')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <DetailedCVPreview
        languageCode="en"
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });
});
