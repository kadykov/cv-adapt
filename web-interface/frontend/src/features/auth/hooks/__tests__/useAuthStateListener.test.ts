import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStateListener } from '../useAuthStateListener';
import { ProvidersWrapper } from '../../../../test/setup/providers';

describe('useAuthStateListener', () => {
  beforeEach(() => {
    window.dispatchEvent(new Event('reset'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should increment update count on auth state change', async () => {
    const { result } = renderHook(() => useAuthStateListener(), {
      wrapper: ProvidersWrapper,
    });

    // Initial count should be 0
    expect(result.current).toBe(0);

    // Simulate login event
    await act(async () => {
      const loginEvent = new CustomEvent('auth-state-change', {
        detail: { isAuthenticated: true },
      });
      window.dispatchEvent(loginEvent);
    });

    // Verify count incremented
    expect(result.current).toBe(1);

    // Simulate logout event
    await act(async () => {
      const logoutEvent = new CustomEvent('auth-state-change', {
        detail: { isAuthenticated: false },
      });
      window.dispatchEvent(logoutEvent);
    });

    // Verify count incremented again
    expect(result.current).toBe(2);
  });
});
