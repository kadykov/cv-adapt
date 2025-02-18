// Common API request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// Common API response types
export interface User {
  id: number;
  email: string;
  created_at: string;
  personal_info?: Record<string, never> | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}
