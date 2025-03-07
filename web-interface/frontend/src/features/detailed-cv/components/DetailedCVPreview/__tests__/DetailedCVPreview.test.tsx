import { vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../../../lib/test/test-utils';
import { DetailedCVPreview } from '..';
import type { DetailedCVResponse } from '../../../../../lib/api/generated-types';
import { LanguageCode } from '../../../../../lib/language/types';

// Mock the hooks
vi.mock('../../../hooks/useDetailedCVs', () => ({
  useDetailedCV: () => ({
    data: {
      id: 1,
      user_id: 1,
      language_code: 'en',
      content: '# Test CV\n\nThis is a test CV content.',
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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual: object = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}));

// Mock window.confirm
const originalConfirm = window.confirm;
window.confirm = vi.fn().mockReturnValue(true);

describe('DetailedCVPreview', () => {
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
        languageCode={LanguageCode.ENGLISH}
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

  it('navigates when edit button is clicked', async () => {
    render(
      <DetailedCVPreview
        languageCode={LanguageCode.ENGLISH}
        onBack={mockOnBack}
      />,
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockNavigate).toHaveBeenCalled();
  });
});
