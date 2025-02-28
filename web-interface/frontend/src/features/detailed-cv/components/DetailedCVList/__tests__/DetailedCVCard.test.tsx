import { vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../../../lib/test/test-utils';
import { DetailedCVCard } from '../DetailedCVCard';
import type { DetailedCVResponse } from '../../../../../lib/api/generated-types';

// Use type assertion with unknown to work around the Record<string, never> type constraint
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

describe('DetailedCVCard', () => {
  it('renders CV information correctly', () => {
    render(<DetailedCVCard cv={mockCV} />);

    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText(/This is a test CV content/)).toBeInTheDocument();
    // Primary badge should not be present
    expect(screen.queryByText('Primary')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<DetailedCVCard cv={mockCV} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when pressing Enter or Space', () => {
    const handleClick = vi.fn();
    render(<DetailedCVCard cv={mockCV} onClick={handleClick} />);

    const card = screen.getByRole('button');

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(card, { key: 'Tab' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('shows primary badge when CV is primary', () => {
    const primaryCV = { ...mockCV, is_primary: true };
    render(<DetailedCVCard cv={primaryCV} />);

    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('shows updated time if available', () => {
    const cvWithUpdate = {
      ...mockCV,
      updated_at: '2024-02-17T13:00:00Z',
    };
    render(<DetailedCVCard cv={cvWithUpdate} />);

    // Note: The exact text will depend on the current time due to formatDistanceToNow
    expect(screen.getByText(/ago$/i)).toBeInTheDocument();
  });
});
