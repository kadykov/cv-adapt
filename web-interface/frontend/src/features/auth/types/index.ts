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
  email: string;
  password: string;
  remember?: boolean;
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
