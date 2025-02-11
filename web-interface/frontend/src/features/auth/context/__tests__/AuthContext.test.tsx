import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import { authService } from "../../../../api/services/auth.service";
import type { User } from "../../types";
import { ApiError } from "../../../../api/core/api-error";

// Mock js-cookie module with proper types
const mockCookieStore: { [key: string]: string } = {};

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn((name: string) => mockCookieStore[name]),
    set: vi.fn((name: string, value: string, _options?: object) => {
      mockCookieStore[name] = value;
    }),
    remove: vi.fn((name: string) => {
      delete mockCookieStore[name];
    }),
  },
}));

// Mock auth service
vi.mock("../../../../api/services/auth.service", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

// Import Cookies after mocking
import Cookies from 'js-cookie';

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  personal_info: null,
  created_at: "2024-01-01T00:00:00.000",
};

const mockToken = "mock-jwt-token";

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock cookie store
    Object.keys(mockCookieStore).forEach(key => delete mockCookieStore[key]);
  });

  it("initializes with null auth state", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });
  });

  it("loads auth state from cookies", async () => {
    // Set initial cookie values
    mockCookieStore['auth_token'] = mockToken;
    mockCookieStore['auth_user'] = JSON.stringify(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });
  });

  it("handles login success", async () => {
    const loginResponse = {
      access_token: mockToken,
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: mockUser,
    };

    vi.mocked(authService.login).mockResolvedValue(loginResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login("test@example.com", "password", false);
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 2000 });

    // Verify cookies were set
    expect(Cookies.set).toHaveBeenCalledWith(
      'auth_token',
      mockToken,
      expect.any(Object)
    );
    expect(Cookies.set).toHaveBeenCalledWith(
      'auth_user',
      JSON.stringify(mockUser),
      expect.any(Object)
    );
  });

  it("handles login with remember me", async () => {
    const loginResponse = {
      access_token: mockToken,
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: mockUser,
    };

    vi.mocked(authService.login).mockResolvedValue(loginResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login("test@example.com", "password", true);
    });

    // Verify refresh token was stored for remember me
    expect(Cookies.set).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.any(Object)
    );
  });

  it("handles login failure", async () => {
    const errorMessage = "Invalid credentials";
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(errorMessage, 401)
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    let error: ApiError | undefined;
    await act(async () => {
      try {
        await result.current.login("test@example.com", "password", true);
      } catch (e) {
        error = e as ApiError;
      }
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.message).toBe(errorMessage);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(Cookies.set).not.toHaveBeenCalled();
  });

  it("handles logout", async () => {
    // Setup initial authenticated state
    mockCookieStore['auth_token'] = mockToken;
    mockCookieStore['auth_user'] = JSON.stringify(mockUser);

    vi.mocked(authService.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    // Verify cookies were removed
    expect(Cookies.remove).toHaveBeenCalledWith('auth_token', expect.any(Object));
    expect(Cookies.remove).toHaveBeenCalledWith('auth_user', expect.any(Object));
    expect(Cookies.remove).toHaveBeenCalledWith('refresh_token', expect.any(Object));
  });

  it("handles registration", async () => {
    const registerResponse = {
      access_token: mockToken,
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: mockUser,
    };

    vi.mocked(authService.register).mockResolvedValue(registerResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.register("test@example.com", "password");
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 2000 });

    // Verify cookies were set
    expect(Cookies.set).toHaveBeenCalledWith(
      'auth_token',
      mockToken,
      expect.any(Object)
    );
    expect(Cookies.set).toHaveBeenCalledWith(
      'auth_user',
      JSON.stringify(mockUser),
      expect.any(Object)
    );
  });

  it("handles token refresh", async () => {
    const newToken = "new-mock-token";
    const refreshResponse = {
      access_token: newToken,
      refresh_token: "new-refresh-token",
      token_type: "bearer",
      user: mockUser,
    };

    // Setup initial state with refresh token
    mockCookieStore['auth_token'] = mockToken;
    mockCookieStore['auth_user'] = JSON.stringify(mockUser);
    mockCookieStore['refresh_token'] = 'old-refresh-token';

    vi.mocked(authService.refreshToken).mockResolvedValue(refreshResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    await act(async () => {
      await result.current.refreshToken();
    });

    await waitFor(() => {
      expect(result.current.token).toBe(newToken);
    }, { timeout: 2000 });

    expect(Cookies.set).toHaveBeenCalledWith(
      'auth_token',
      newToken,
      expect.any(Object)
    );
    expect(Cookies.set).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.any(Object)
    );
  });

  it("handles invalid stored data", async () => {
    // Setup cookies with invalid user data
    mockCookieStore['auth_token'] = mockToken;
    mockCookieStore['auth_user'] = 'invalid-json';

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    }, { timeout: 2000 });

    // Verify cookies were cleared
    expect(Cookies.remove).toHaveBeenCalledWith('auth_token', expect.any(Object));
    expect(Cookies.remove).toHaveBeenCalledWith('auth_user', expect.any(Object));
  });
});
