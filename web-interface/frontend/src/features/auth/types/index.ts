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
  username: string;  // Backend expects username field for the email
  password: string;
  grant_type: string;  // Required by backend OAuth flow
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
