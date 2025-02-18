import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  redirectTo?: string;
}

export const ProtectedRoute: FC<PropsWithChildren<ProtectedRouteProps>> = ({
  children,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Only update auth check after loading is complete
    if (!isLoading) {
      setIsAuthChecked(true);
    }
  }, [isLoading]);

  if (isLoading || !isAuthChecked) {
    // TODO: Replace with proper loading component once created
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL for redirect after login
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};
