import { useCallback, useEffect, useState } from 'react';
import type { AuthResponse } from '../../../lib/api/generated-types';

interface AuthStateChangeEvent extends CustomEvent {
  detail: {
    isAuthenticated: boolean;
    user?: AuthResponse['user'] | null;
  };
}

/**
 * Custom hook to listen for authentication state changes
 * Forces a re-render when auth state changes through custom events
 * Also provides the latest auth state from the event
 */
export function useAuthStateListener() {
  const [authState, setAuthState] = useState<{
    updateCount: number;
    lastEventData: AuthStateChangeEvent['detail'] | null;
  }>({
    updateCount: 0,
    lastEventData: null,
  });

  const handleAuthChange = useCallback((event: AuthStateChangeEvent) => {
    setAuthState((current) => ({
      updateCount: current.updateCount + 1,
      lastEventData: event.detail,
    }));
  }, []);

  useEffect(() => {
    window.addEventListener(
      'auth-state-change',
      handleAuthChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        'auth-state-change',
        handleAuthChange as EventListener,
      );
    };
  }, [handleAuthChange]);

  return {
    updateCount: authState.updateCount,
    lastEvent: authState.lastEventData,
  };
}
