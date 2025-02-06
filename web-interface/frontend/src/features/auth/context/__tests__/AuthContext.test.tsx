import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import * as authApi from "../../api/auth.api";
import type { User } from "../../types";

vi.mock("../../api/auth.api", () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
}));

describe("AuthContext", () => {
  const mockUser: User = {
    id: 1,
    email: "test@example.com",
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
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: mockToken,
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
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: mockToken,
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
    vi.mocked(authApi.login).mockRejectedValue(
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
    vi.mocked(authApi.logout).mockResolvedValue();

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
    vi.mocked(authApi.register).mockResolvedValue({
      access_token: mockToken,
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
    vi.mocked(authApi.refreshToken).mockResolvedValue({
      access_token: newToken,
      user: mockUser,
    });

    localStorage.setItem("auth_token", mockToken);
    localStorage.setItem("auth_user", JSON.stringify(mockUser));

    render(<AuthProvider>
      <div>Test</div>
    </AuthProvider>);

    // Fast-forward time to trigger token refresh
    await act(async () => {
      vi.advanceTimersByTime(15 * 60 * 1000); // 15 minutes
    });

    await waitFor(() => {
      expect(localStorage.getItem("auth_token")).toBe(newToken);
    });
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
