import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ProtectedRoute } from "../ProtectedRoute";

describe("ProtectedRoute", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      enumerable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      enumerable: true,
      value: originalLocation,
    });
  });

  it("shows loading state initially", () => {
    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        isAuthenticated: false,
        isLoading: true,
      }),
    }));

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to login when not authenticated", async () => {
    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        isAuthenticated: false,
        isLoading: false,
      }),
    }));

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
    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        isAuthenticated: false,
        isLoading: false,
      }),
    }));

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
    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        isAuthenticated: true,
        isLoading: false,
      }),
    }));

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("does not redirect when authenticated", async () => {
    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        isAuthenticated: true,
        isLoading: false,
      }),
    }));

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
    const states = [
      { isAuthenticated: false, isLoading: true },
      { isAuthenticated: true, isLoading: false },
    ];
    let currentState = 0;

    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => states[currentState],
    }));

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Initially loading
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();

    // Update to authenticated state
    currentState = 1;
    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });
});
