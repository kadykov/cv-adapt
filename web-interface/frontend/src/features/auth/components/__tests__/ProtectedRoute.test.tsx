import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ProtectedRoute } from "../ProtectedRoute";
import type { Mock } from "vitest";

// Mock the entire auth context module
vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute", () => {
  const originalLocation = window.location;
  let useAuth: Mock;

  beforeAll(async () => {
    const authContext = await import("../../context/AuthContext");
    useAuth = authContext.useAuth as ReturnType<typeof vi.fn>;
  });

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      enumerable: true,
      value: { href: "" },
    });
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      enumerable: true,
      value: originalLocation,
    });
  });

  it("shows loading state initially", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to login when not authenticated", async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to custom fallback URL when provided", async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <ProtectedRoute fallback="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(window.location.href).toBe("/custom-login");
    });
  });

  it("renders children when authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("does not redirect when authenticated", async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(window.location.href).toBe("");
    });
  });

  it("handles transition from loading to authenticated", async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Initially loading
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();

    // Update to authenticated state
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });
});
