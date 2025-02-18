export { ProtectedRoute } from './ProtectedRoute';
export { useAuth } from './useAuth';
export { AUTH_KEYS } from './useAuth';

/**
 * @module Auth
 *
 * Authentication module provides route protection and token management for the application.
 *
 * @example
 * ```tsx
 * // Using the auth hook
 * const { isAuthenticated, token } = useAuth();
 *
 * // Protecting a route
 * <ProtectedRoute>
 *   <SecureContent />
 * </ProtectedRoute>
 * ```
 *
 * @see {@link ../docs/features/auth.md} for detailed documentation
 */
