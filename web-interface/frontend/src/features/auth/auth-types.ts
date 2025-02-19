import type { AuthResponse } from '../../lib/api/generated-types';

export interface AuthContextType {
  user: AuthResponse['user'] | null;
  login: (response: AuthResponse) => void;
  loginWithCredentials: (credentials: {
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
