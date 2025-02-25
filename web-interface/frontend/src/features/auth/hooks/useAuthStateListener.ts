import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook to listen for authentication state changes
 * Forces a re-render when auth state changes through custom events
 */
export function useAuthStateListener() {
  const [updateCount, setUpdateCount] = useState(0);

  const handleAuthChange = useCallback(() => {
    setUpdateCount((v) => v + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('auth-state-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-state-change', handleAuthChange);
    };
  }, [handleAuthChange]);

  // Return the update count for testing purposes
  return updateCount;
}
