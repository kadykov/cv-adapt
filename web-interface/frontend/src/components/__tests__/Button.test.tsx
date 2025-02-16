import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

describe('Button component tests', () => {
  it('should render a button', () => {
    // This is just a placeholder test to verify our testing setup
    render(<button>Click me</button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<button onClick={handleClick}>Click me</button>);

    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
