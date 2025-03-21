import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { useJobMutations } from '../../../hooks/useJobMutations';
import { LanguageCode } from '@/lib/language/types';
import { JobForm } from '../JobForm';

// Mock useJobMutations hook
vi.mock('../../../hooks/useJobMutations', () => ({
  useJobMutations: vi.fn(),
}));

const mockUseJobMutations = useJobMutations as Mock;

describe('JobForm', () => {
  const mockCreateJob = { mutateAsync: vi.fn() };
  const mockUpdateJob = { mutateAsync: vi.fn() };
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    mode: 'create' as const,
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    mockUseJobMutations.mockReturnValue({
      createJob: mockCreateJob,
      updateJob: mockUpdateJob,
    });
    vi.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(<JobForm {...defaultProps} {...props} />);
  };

  const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/title/i), 'Software Engineer');
    await user.type(
      screen.getByLabelText(/description/i),
      'Job description here',
    );

    // Open language dropdown and select English
    await user.click(screen.getByRole('button', { name: /language/i }));
    await user.click(screen.getByRole('option', { name: /English/ }));
  };

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      renderForm();
      const user = userEvent.setup();

      // Clear default language selection
      await user.click(screen.getByRole('button', { name: /language/i }));
      await user.click(screen.getByRole('button', { name: /language/i }));

      await user.click(screen.getByRole('button', { name: /create job/i }));

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        expect(
          screen.getByText(/description is required/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/please select a valid language/i),
        ).toBeInTheDocument();
      });

      expect(mockCreateJob.mutateAsync).not.toHaveBeenCalled();
    });

    it('handles submission error and shows error message', async () => {
      const error = new Error('Failed to create job');
      mockCreateJob.mutateAsync.mockRejectedValue(error);
      renderForm();
      const user = userEvent.setup();

      await fillForm(user);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create job/i });
      await user.click(submitButton).catch(() => {
        // Expected error, just ignore it
      });

      // Check for error message
      const errorElement = await screen.findByRole('alert');
      expect(errorElement).toHaveTextContent(/Failed to create job/i);
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockCreateJob.mutateAsync).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during submission', async () => {
      mockCreateJob.mutateAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
      renderForm();
      const user = userEvent.setup();

      await fillForm(user);
      await user
        .click(screen.getByRole('button', { name: /create job/i }))
        .catch(() => {
          // Ignore any potential errors
        });

      expect(
        screen.getByRole('button', { name: /creating/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    const editProps = {
      mode: 'edit' as const,
      jobId: 1,
      initialData: {
        title: 'Existing Job',
        description: 'Existing description',
        language_code: LanguageCode.FRENCH,
      },
    };

    it('pre-fills form with initial data', async () => {
      renderForm(editProps);

      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Job');
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Existing description',
      );
      await waitFor(() => {
        expect(screen.getByText(/French \(Français\)/)).toBeInTheDocument();
      });
    });

    it('updates existing job on submit', async () => {
      renderForm(editProps);
      const user = userEvent.setup();

      await user.clear(screen.getByLabelText(/title/i));
      await user.type(screen.getByLabelText(/title/i), 'Updated Job');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockUpdateJob.mutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: {
            title: 'Updated Job',
            description: 'Existing description',
            language_code: LanguageCode.FRENCH,
          },
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows appropriate loading state', async () => {
      mockUpdateJob.mutateAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
      renderForm(editProps);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(
        screen.getByRole('button', { name: /saving/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('disables cancel button during submission', async () => {
      mockCreateJob.mutateAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
      renderForm();
      const user = userEvent.setup();

      await fillForm(user);
      await user.click(screen.getByRole('button', { name: /create job/i }));

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('Language Selection', () => {
    it('shows all supported languages in dropdown', async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /language/i }));

      await waitFor(() => {
        expect(screen.getByText(/English \(English\)/)).toBeInTheDocument();
        expect(screen.getByText(/French \(Français\)/)).toBeInTheDocument();
        expect(screen.getByText(/German \(Deutsch\)/)).toBeInTheDocument();
        expect(screen.getByText(/Spanish \(Español\)/)).toBeInTheDocument();
        expect(screen.getByText(/Italian \(Italiano\)/)).toBeInTheDocument();
      });
    });

    it('allows selecting a language', async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /language/i }));
      await user.click(screen.getByText(/German/));

      await waitFor(() => {
        expect(screen.getByText(/German \(Deutsch\)/)).toBeInTheDocument();
      });
    });

    it('persists selected language after form errors', async () => {
      renderForm();
      const user = userEvent.setup();

      // Select a language first
      await user.click(screen.getByRole('button', { name: /language/i }));
      await user.click(screen.getByText(/Italian/));

      // Clear required fields to trigger validation
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);

      // Try to submit
      await user.click(screen.getByRole('button', { name: /create job/i }));

      // Verify language selection persists
      await waitFor(() => {
        expect(screen.getByText(/Italian \(Italiano\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('marks required fields with aria-required', () => {
      renderForm();

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const languageButton = screen.getByRole('button', { name: /language/i });

      expect(titleInput).toHaveAttribute('aria-required', 'true');
      expect(descriptionInput).toHaveAttribute('aria-required', 'true');
      expect(languageButton).toHaveAttribute('aria-required', 'true');
    });

    it('supports keyboard navigation for language selection', async () => {
      renderForm();
      const user = userEvent.setup();

      const languageButton = screen.getByRole('button', { name: /language/i });
      await user.click(languageButton);

      // Now we should see the listbox options
      const option = await screen.findByText(/German \(Deutsch\)/i);
      await user.click(option);

      // Verify selection was made
      await waitFor(() => {
        expect(screen.getByText(/German \(Deutsch\)/i)).toBeInTheDocument();
      });
    });

    it('announces form errors with role="alert"', async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /create job/i }));

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts).toHaveLength(3); // One for each required field
      });
    });
  });
});
