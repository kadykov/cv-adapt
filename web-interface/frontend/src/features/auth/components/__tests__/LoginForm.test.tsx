import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "../LoginForm";
import { AuthenticationError } from "../../api/auth.api";

// Mock the auth context hooks
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
    isLoading: false,
  }),
}));

describe("LoginForm", () => {
  it("renders login form elements", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("displays validation errors for invalid input", async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("displays error message on authentication failure", async () => {
    const mockLogin = vi.fn().mockRejectedValue(
      new AuthenticationError("Invalid credentials")
    );

    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false,
      }),
    }));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("shows loading state during form submission", async () => {
    const mockLogin = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: true,
      }),
    }));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("calls login function with correct credentials", async () => {
    const mockLogin = vi.fn();

    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false,
      }),
    }));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberCheckbox = screen.getByLabelText(/remember me/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(rememberCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
        true
      );
    });
  });
});
