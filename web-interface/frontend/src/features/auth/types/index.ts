export interface User {
  id: number;
  email: string;
  personal_info?: Record<string, unknown>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;  // Used as username in OAuth2 password flow
  password: string;
  grant_type?: string;  // Required by backend OAuth flow, but set in auth.api.ts
  remember?: boolean;  // Frontend-only state
}

export interface RegistrationData {
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
