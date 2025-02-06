import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegisterForm } from "../RegisterForm";
import { AuthenticationError } from "../../api/auth.api";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    register: vi.fn(),
    isLoading: false,
  }),
}));

describe("RegisterForm", () => {
  it("renders registration form elements", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms and conditions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("displays validation errors for invalid input", async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
    });
  });

  it("validates password requirements", async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /create account/i });

    // Test short password
    fireEvent.change(passwordInput, { target: { value: "short" } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    // Test password without uppercase
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });

    // Test password without number
    fireEvent.change(passwordInput, { target: { value: "PasswordTest" } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one.*number/i)).toBeInTheDocument();
    });
  });

  it("requires terms acceptance", async () => {
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must accept the terms and conditions/i)).toBeInTheDocument();
    });
  });

  it("displays error message on registration failure", async () => {
    const mockRegister = vi.fn().mockRejectedValue(
      new AuthenticationError("Email already exists")
    );

    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        register: mockRegister,
        isLoading: false,
      }),
    }));

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it("shows loading state during form submission", async () => {
    const mockRegister = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        register: mockRegister,
        isLoading: true,
      }),
    }));

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitButton);

    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("calls register function with correct data", async () => {
    const mockRegister = vi.fn();

    vi.mock("../../context/AuthContext", () => ({
      useAuth: () => ({
        register: mockRegister,
        isLoading: false,
      }),
    }));

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "test@example.com",
        "Password123"
      );
    });
  });
});
