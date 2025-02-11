export interface User {
  id: number;
  email: string;
  personal_info: null | Record<string, unknown>;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends LoginCredentials {
  confirmPassword: string;
}
