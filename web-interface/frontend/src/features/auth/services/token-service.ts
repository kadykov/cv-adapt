import type { AuthResponse } from '../../../lib/api/generated-types';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly EXPIRES_AT_KEY = 'tokenExpiresAt';
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
  private static readonly DEFAULT_TOKEN_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  storeTokens(response: AuthResponse): void {
    localStorage.setItem(TokenService.ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(
      TokenService.REFRESH_TOKEN_KEY,
      response.refresh_token,
    );

    // Use default token duration since expires_in is not provided in the response
    const expiresAt = Date.now() + TokenService.DEFAULT_TOKEN_DURATION;
    localStorage.setItem(TokenService.EXPIRES_AT_KEY, expiresAt.toString());
  }

  getStoredTokens(): StoredTokens | null {
    const accessToken = localStorage.getItem(TokenService.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(TokenService.REFRESH_TOKEN_KEY);
    const expiresAt = localStorage.getItem(TokenService.EXPIRES_AT_KEY);

    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAt, 10),
    };
  }

  clearTokens(): void {
    localStorage.removeItem(TokenService.ACCESS_TOKEN_KEY);
    localStorage.removeItem(TokenService.REFRESH_TOKEN_KEY);
    localStorage.removeItem(TokenService.EXPIRES_AT_KEY);
  }

  isTokenExpired(): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens) return true;

    return Date.now() >= tokens.expiresAt;
  }

  needsRefresh(): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    // Return true if token will expire within the refresh threshold
    return Date.now() >= tokens.expiresAt - TokenService.REFRESH_THRESHOLD;
  }

  getAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.refreshToken ?? null;
  }
}

export const tokenService = new TokenService();
