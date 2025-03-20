import { describe, test, expect, vi, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { GenerateButton } from '../GenerateButton';
import { CVGenerationErrorBoundary } from '../../CVGenerationErrorBoundary';
import { renderWithRouter } from '../../../../../lib/test/render-utils';
import { LanguageCode } from '@/lib/language/types';

/**
 * GenerateButton Component Tests
 *
 * Testing Strategy:
 * - Component behavior tests (rendering, click handling)
 * - Accessibility compliance
 * - Error boundary functionality
 * - Language code validation
 *
 * Note: Navigation logic is tested at the integration level
 * in generation-flow.integration.test.tsx
 */

// Mock Iconify's Icon component for testing
vi.mock('@iconify/react', () => ({
  Icon: ({
    'data-testid': testId,
    className,
    icon,
  }: {
    'data-testid'?: string;
    className?: string;
    icon: string;
  }) => (
    <svg
      data-testid={testId}
      className={className}
      aria-hidden="true"
      data-icon={icon}
    />
  ),
}));

describe('GenerateButton', () => {
  const defaultProps = {
    jobId: 123,
    onClick: vi.fn(),
    language: LanguageCode.ENGLISH,
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    test('renders with default props', () => {
      renderWithRouter(<GenerateButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /generate cv/i });
      expect(button).toBeInTheDocument();
      expect(button).toMatchSnapshot();
    });

    test('renders with custom className', () => {
      const customClass = 'custom-button btn-secondary';
      renderWithRouter(
        <GenerateButton {...defaultProps} className={customClass} />,
      );

      const button = screen.getByRole('button', { name: /generate cv/i });
      expect(button).toHaveClass(customClass);
    });

    test('handles disabled state', () => {
      renderWithRouter(<GenerateButton {...defaultProps} disabled />);

      const button = screen.getByRole('button', { name: /generate cv/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    test.each(Object.values(LanguageCode))(
      'renders with valid language code: %s',
      (language) => {
        renderWithRouter(
          <GenerateButton {...defaultProps} language={language} />,
        );
        expect(screen.getByRole('button')).toBeInTheDocument();
      },
    );

    test('handles invalid language code', () => {
      const consoleError = vi.spyOn(console, 'error');
      const invalidLanguage = 'invalid' as LanguageCode;

      renderWithRouter(
        <GenerateButton {...defaultProps} language={invalidLanguage} />,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid language code'),
      );
    });
  });

  describe('click handling', () => {
    test('triggers onClick when clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(<GenerateButton {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate cv/i }));

      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    test('does not trigger onClick when disabled', async () => {
      const user = userEvent.setup();

      renderWithRouter(<GenerateButton {...defaultProps} disabled />);

      await user.click(screen.getByRole('button', { name: /generate cv/i }));

      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    test('has proper ARIA attributes', () => {
      renderWithRouter(<GenerateButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        `Generate CV for job ${defaultProps.jobId}`,
      );
      expect(button).toHaveAttribute('type', 'button');
    });

    test('icon is properly hidden from screen readers', () => {
      renderWithRouter(<GenerateButton {...defaultProps} />);

      const svg = screen.getByTestId('generate-cv-icon');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg.tagName.toLowerCase()).toBe('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });
  });

  describe('error handling', () => {
    test('shows error boundary when rendering fails', () => {
      const ThrowError = () => {
        throw new Error('Button render failed');
      };

      renderWithRouter(
        <CVGenerationErrorBoundary>
          <ThrowError />
        </CVGenerationErrorBoundary>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to render/i)).toBeInTheDocument();
    });

    test('recovers from error state', async () => {
      const user = userEvent.setup();

      // Component that throws on first render but not on rerender
      let shouldThrow = true;
      const ToggleError = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered content</div>;
      };

      renderWithRouter(
        <CVGenerationErrorBoundary>
          <ToggleError />
        </CVGenerationErrorBoundary>,
      );

      // Verify initial error state
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to render/i)).toBeInTheDocument();
      });

      // Click recovery button
      const retryButton = screen.getByRole('button', { name: /try.*again/i });
      shouldThrow = false;
      await user.click(retryButton);

      // Verify recovery
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByText('Recovered content')).toBeInTheDocument();
      });
    });
  });
});
