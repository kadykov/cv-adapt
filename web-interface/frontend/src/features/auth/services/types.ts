export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  personal_info?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface ValidationResponse {
  valid: boolean;
  user?: {
    id: number;
    email: string;
    created_at: string;
    personal_info?: {
      first_name?: string;
      last_name?: string;
    } | null;
  };
  error?: string;
}
