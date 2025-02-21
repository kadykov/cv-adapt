import React from 'react';
import { mockNavigate, mockLocation } from './mock-router-state';

type RouteProps = {
  path?: string;
  element: React.ReactNode;
};

export const Navigate = ({ to }: { to: string; replace?: boolean }) => {
  React.useEffect(() => {
    if (to === '/login') {
      mockNavigate(`/auth?returnTo=${mockLocation.pathname}`);
    } else {
      mockNavigate(to);
    }
  }, [to]);
  return null;
};

export const Routes = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const Route = ({ element }: RouteProps) => <>{element}</>;

export const MemoryRouter = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

// eslint-disable-next-line react-refresh/only-export-components
export { useNavigate, useLocation } from './mock-router-hooks';
