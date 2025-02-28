import { vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../../lib/test/test-utils';
import { JobCard } from '../JobCard';

const mockJob = {
  id: 1,
  title: 'Software Engineer',
  description: 'Building amazing software',
  language_code: 'en',
  created_at: '2024-02-17T12:00:00Z',
  updated_at: null,
};

describe('JobCard', () => {
  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Building amazing software')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<JobCard job={mockJob} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when pressing Enter or Space', () => {
    const handleClick = vi.fn();
    render(<JobCard job={mockJob} onClick={handleClick} />);

    const card = screen.getByRole('button');

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(card, { key: 'Tab' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('shows updated time if available', () => {
    const jobWithUpdate = {
      ...mockJob,
      updated_at: '2024-02-17T13:00:00Z',
    };
    render(<JobCard job={jobWithUpdate} />);

    // Note: The exact text will depend on the current time due to formatDistanceToNow
    expect(screen.getByText(/ago$/i)).toBeInTheDocument();
  });
});
