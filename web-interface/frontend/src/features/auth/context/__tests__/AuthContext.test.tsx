import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import { authService } from "../../../../api/services/auth.service";
import type { User } from "../../types";

vi.mock("../../../../api/services/auth.service", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

describe("AuthContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    personal_info: null,
    created_at: "2024-01-01T00:00:00.000",
  };

  const mockToken = "mock-jwt-token";

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes with null auth state", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("loads auth state from localStorage", () => {
    localStorage.setItem("auth_token", mockToken);
    localStorage.setItem("auth_user", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("handles login success", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: mockToken,
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login("test@example.com", "password", true);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem("auth_token")).toBe(mockToken);
    expect(localStorage.getItem("auth_user")).toBe(JSON.stringify(mockUser));
  });

  it("handles login without remember me", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: mockToken,
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login("test@example.com", "password", false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });

  it("handles login failure", async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new Error("Invalid credentials")
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    try {
      await act(async () => {
        await result.current.login("test@example.com", "password", true);
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });

  it("handles logout", async () => {
    vi.mocked(authService.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Set initial authenticated state
    localStorage.setItem("auth_token", mockToken);
    localStorage.setItem("auth_user", JSON.stringify(mockUser));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });

  it("handles registration", async () => {
    vi.mocked(authService.register).mockResolvedValue({
      access_token: mockToken,
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.register("test@example.com", "password");
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("handles token refresh", async () => {
    const newToken = "new-mock-token";
    const refreshPromise = Promise.resolve({
      access_token: newToken,
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: mockUser,
    });

    vi.mocked(authService.refreshToken).mockReturnValue(refreshPromise);

    localStorage.setItem("auth_token", mockToken);
    localStorage.setItem("auth_user", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for initial auth state
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe(mockToken);

    // Trigger a token refresh by advancing time
    await act(async () => {
      vi.advanceTimersByTime(15 * 60 * 1000); // 15 minutes
      // Wait for the refresh promise to resolve
      await refreshPromise;
    });

    // Verify refresh was called
    expect(vi.mocked(authService.refreshToken)).toHaveBeenCalledWith(mockToken);

    // Verify state was updated
    expect(result.current.token).toBe(newToken);
  });

  it("handles invalid stored data", () => {
    localStorage.setItem("auth_token", mockToken);
    localStorage.setItem("auth_user", "invalid-json");

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });
});
