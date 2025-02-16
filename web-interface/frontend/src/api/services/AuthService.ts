import { ApiError } from '../core/ApiError';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    email: string;
  };
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export class AuthService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL;
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }
  }

  /**
   * Authenticate user and store tokens
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    const data = await response.json();
    this.storeTokens(data.access_token, data.refresh_token);
    return data;
  }

  /**
   * Remove tokens and notify server
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get new access token using refresh token
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw await ApiError.fromResponse(response);
    }

    const data = await response.json();
    this.storeTokens(data.access_token, data.refresh_token);
    return data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get current refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Store access and refresh tokens
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Get headers with authorization token
   */
  private getAuthHeaders(): HeadersInit {
    const accessToken = this.getAccessToken();
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}
