import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { render } from '@/tests/test-utils';
import NotFound from '@/pages/notFound';

describe('NotFound Page', () => {
  it('renders 404 page content', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText("The page you're looking for doesn't exist or has been moved.")
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
  });

  it('navigates to home page when clicking Go Home link', async () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: /go home/i });
    await userEvent.click(homeLink);

    expect(window.location.pathname).toBe('/');
  });

  it('applies correct styles to link', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toHaveClass(
      'bg-indigo-600',
      'text-white',
      'rounded-lg',
      'hover:bg-indigo-700'
    );
  });

  it('maintains layout structure', () => {
    render(<NotFound />);

    // Check main container
    const container = screen.getByText('404').closest('div');
    expect(container).toHaveClass('flex', 'min-h-screen');

    // Check content container
    const contentContainer = screen.getByText('404').parentElement;
    expect(contentContainer).toHaveClass('text-center');

    // Check heading hierarchy
    const heading1 = screen.getByText('404');
    const heading2 = screen.getByText('Page Not Found');
    expect(heading1).toHaveClass('text-6xl');
    expect(heading2).toHaveClass('text-3xl');
  });
});
