import {
  MemoryRouter as RealMemoryRouter,
  type NavigateFunction,
} from 'react-router-dom';
import { mockNavigate } from './navigation';
import React from 'react';

// Re-export React Router components and types
export { Routes, Route } from 'react-router-dom';
export { mockNavigate };

// Custom Navigate component that uses the mock navigation
export const Navigate = ({ to }: { to: string }) => {
  const ref = React.useRef(false);

  React.useEffect(() => {
    if (!ref.current) {
      ref.current = true;
      mockNavigate(to);
    }
  }, [to]);

  return null;
};

// Export routers and navigation hooks
export const MemoryRouter = RealMemoryRouter;
export const BrowserRouter = RealMemoryRouter;
export const useNavigate = (): NavigateFunction => mockNavigate;
