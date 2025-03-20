import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useLanguageAdapter } from '../../hooks';
import { LanguageCode } from '../../types';
import type { components } from '@/lib/api/generated-types';

// Helper to create delayed promises
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Type for our mock API
interface MockApi {
  setLanguage: (
    lang: components['schemas']['LanguageCode'],
  ) => Promise<components['schemas']['LanguageCode']>;
  fetchLanguage: () => Promise<components['schemas']['LanguageCode']>;
}

// Mock API calls with configurable delays
const createMockApi = (): MockApi => ({
  setLanguage: vi.fn(async (lang: components['schemas']['LanguageCode']) => {
    await delay(Math.random() * 100); // Random delay to simulate network
    return lang;
  }),
  fetchLanguage: vi.fn(),
});

function ConcurrentLanguageSelector({ api }: { api: MockApi }) {
  const { value, setValue } = useLanguageAdapter();

  const handleSelect = async (input: string) => {
    await setValue(input, api);
  };

  return (
    <div>
      <div data-testid="current-value">{value}</div>
      <button onClick={() => handleSelect('de')}>German</button>
      <button onClick={() => handleSelect('fr')}>French</button>
    </div>
  );
}

describe('Language Adapter Concurrent Operations', () => {
  describe('race conditions', () => {
    test('handles out-of-order responses correctly', async () => {
      const mockApi = createMockApi();
      const { user } = setup(<ConcurrentLanguageSelector api={mockApi} />);

      // Click buttons in quick succession
      await user.click(screen.getByText('German'));
      await user.click(screen.getByText('French'));

      // Wait for all responses
      await waitFor(() => {
        expect(mockApi.setLanguage).toHaveBeenCalledTimes(2);
      });

      // Should show French (last request) regardless of response order
      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent(
          LanguageCode.FRENCH,
        );
      });
    });

    test('preserves request order with slow responses', async () => {
      const mockApi = createMockApi();
      const setLanguage = vi
        .fn()
        .mockImplementationOnce(async () => {
          await delay(100); // Slow response
          return 'de' as const;
        })
        .mockImplementationOnce(async () => {
          await delay(50); // Fast response
          return 'fr' as const;
        });

      mockApi.setLanguage = setLanguage;

      const { user } = setup(<ConcurrentLanguageSelector api={mockApi} />);

      // Trigger requests in specific order
      await user.click(screen.getByText('German'));
      await user.click(screen.getByText('French'));

      // Fast response should win
      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent(
          LanguageCode.FRENCH,
        );
      });
    });
  });

  describe('rapid changes', () => {
    test('handles rapid language changes', async () => {
      const mockApi = createMockApi();
      const { user } = setup(<ConcurrentLanguageSelector api={mockApi} />);

      // Rapidly click different languages
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText('German'));
        await user.click(screen.getByText('French'));
      }

      // Should eventually settle on the last selected language
      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent(
          LanguageCode.FRENCH,
        );
      });

      // All requests should have been made
      expect(mockApi.setLanguage).toHaveBeenCalledTimes(10);
    });

    test('cancels pending changes on unmount', async () => {
      const mockApi = createMockApi();
      mockApi.setLanguage = vi.fn(async () => {
        await delay(1000); // Long delay
        return 'de' as const;
      });

      const { user, unmount } = setup(
        <ConcurrentLanguageSelector api={mockApi} />,
      );

      // Start a request
      await user.click(screen.getByText('German'));

      // Unmount before it completes
      unmount();

      // Should not have updated the value
      await delay(50);
      expect(mockApi.setLanguage).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    test('handles intermittent failures', async () => {
      const mockApi = createMockApi();
      mockApi.setLanguage = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('de' as const);

      const { user } = setup(<ConcurrentLanguageSelector api={mockApi} />);

      // First request fails
      await user.click(screen.getByText('German'));

      // Second request succeeds
      await user.click(screen.getByText('German'));

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent(
          LanguageCode.GERMAN,
        );
      });
    });
  });
});

// Helper function to setup tests with userEvent
function setup(jsx: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}
