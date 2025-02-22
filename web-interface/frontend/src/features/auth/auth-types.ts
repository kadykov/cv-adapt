import type { AuthResponse } from '../../lib/api/generated-types';

export interface AuthContextType {
  user: AuthResponse['user'] | null;
  login: (response: AuthResponse) => Promise<void>;
  loginWithCredentials: (credentials: {
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
