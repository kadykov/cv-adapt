import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useLanguageAdapter } from '../../hooks';
import { LanguageCode } from '../../types';
import { useState, useEffect } from 'react';

// Mock API calls
const mockApi = {
  setLanguage: vi.fn(),
  fetchLanguage: vi.fn().mockResolvedValue('en'), // Default successful response
};

// Test component using the language adapter
function LanguageSelector() {
  const [value, setValue] = useState<LanguageCode>(LanguageCode.ENGLISH);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toApi, handleApiLanguage, isValid } = useLanguageAdapter();

  // Simulate API data fetching
  useEffect(() => {
    const fetchInitialLanguage = async () => {
      setIsLoading(true);
      try {
        const apiLanguage = await mockApi.fetchLanguage();
        const language = handleApiLanguage(apiLanguage, LanguageCode.ENGLISH);
        if (language) {
          setValue(language);
        }
      } catch {
        setError('Failed to fetch language');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialLanguage();
  }, [handleApiLanguage]);

  const handleSelect = async (input: string) => {
    setError(null);
    setIsLoading(true);

    if (!isValid(input)) {
      setError('Invalid language selected');
      setIsLoading(false);
      return;
    }

    try {
      const language = handleApiLanguage(input, LanguageCode.ENGLISH);
      if (language) {
        setValue(language);
        await mockApi.setLanguage(toApi(language));
      }
    } catch {
      setError('Failed to update language');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => handleSelect(e.target.value)}
        aria-label="Language"
      >
        <option value="en">English</option>
        <option value="de">German</option>
        <option value="xyz">Invalid</option>
      </select>
      {error && <div role="alert">{error}</div>}
      <div data-testid="current-value">{value}</div>
    </div>
  );
}

describe('Language Adapter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('component interaction', () => {
    test('handles valid language selection', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      // Wait for loading to finish and combobox to appear
      await waitFor(() =>
        expect(screen.getByRole('combobox')).toBeInTheDocument(),
      );

      // Select German
      await user.selectOptions(screen.getByRole('combobox'), 'de');

      // Should update state and call API
      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent(
          LanguageCode.GERMAN,
        );
      });
      expect(mockApi.setLanguage).toHaveBeenCalledWith('de');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('handles invalid language selection', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      // Wait for loading to finish and combobox to appear
      await waitFor(() =>
        expect(screen.getByRole('combobox')).toBeInTheDocument(),
      );

      // Try to select invalid option
      await user.selectOptions(screen.getByRole('combobox'), 'xyz');

      // Should show error and not update state
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid language selected',
      );
      expect(screen.getByTestId('current-value')).toHaveTextContent(
        LanguageCode.ENGLISH,
      );
      expect(mockApi.setLanguage).not.toHaveBeenCalled();
    });
  });

  describe('API interaction', () => {
    test('handles successful API responses', async () => {
      mockApi.fetchLanguage.mockResolvedValue('de');

      render(<LanguageSelector />);

      // Should show loading state
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();

      // Wait for API response to be handled
      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent(
          LanguageCode.GERMAN,
        );
      });
      expect(mockApi.fetchLanguage).toHaveBeenCalled();
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument();
    });

    test('handles invalid API responses', async () => {
      // Temporarily suppress expected warning
      const originalWarn = console.warn;
      console.warn = vi.fn();

      mockApi.fetchLanguage.mockResolvedValue('invalid');

      render(<LanguageSelector />);

      // Should show loading state initially
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();

      // Should keep default value
      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent(
          LanguageCode.ENGLISH,
        );
      });
      expect(mockApi.fetchLanguage).toHaveBeenCalled();
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument();

      // Restore console.warn
      console.warn = originalWarn;
    });

    test('handles API errors', async () => {
      mockApi.fetchLanguage.mockRejectedValue(new Error('API Error'));

      render(<LanguageSelector />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Failed to fetch language',
        );
      });
      expect(screen.getByTestId('current-value')).toHaveTextContent(
        LanguageCode.ENGLISH,
      );
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument();
    });
  });

  describe('error recovery', () => {
    test('clears error on valid selection after error', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      // Wait for loading to finish and combobox to appear
      await waitFor(() =>
        expect(screen.getByRole('combobox')).toBeInTheDocument(),
      );

      // First make an invalid selection
      await user.selectOptions(screen.getByRole('combobox'), 'xyz');
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Then make a valid selection
      await user.selectOptions(screen.getByRole('combobox'), 'de');

      // Should clear error and update value (without checking loading state)
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByTestId('current-value')).toHaveTextContent(
          LanguageCode.GERMAN,
        );
      });
    });
  });

  describe('accessibility', () => {
    test('provides proper ARIA attributes', async () => {
      render(<LanguageSelector />);

      // Wait for loading to finish
      await waitFor(() =>
        expect(screen.getByRole('combobox')).toBeInTheDocument(),
      );
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-label',
        'Language',
      );
    });

    test('loading state is announced to screen readers', async () => {
      mockApi.fetchLanguage.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<LanguageSelector />);

      const loading = screen.getByLabelText('Loading');
      expect(loading).toBeInTheDocument();
      expect(loading).toHaveAttribute('aria-busy', 'true');
    });

    test('error messages are announced to screen readers', async () => {
      // Set up mock to return valid language first
      mockApi.fetchLanguage.mockResolvedValue('en');

      const user = userEvent.setup();
      render(<LanguageSelector />);

      // Wait for initial loading to finish and combobox to appear
      await waitFor(() =>
        expect(screen.getByRole('combobox')).toBeInTheDocument(),
      );

      await user.selectOptions(screen.getByRole('combobox'), 'xyz');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
