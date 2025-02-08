import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegisterForm } from "../RegisterForm";
import { AuthenticationError } from "../../api/auth.api";

const mockRegister = vi.fn();
let mockIsLoading = false;

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
    isLoading: mockIsLoading,
  }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockIsLoading = false;
  });

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
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      expect(screen.getByText("You must accept the terms and conditions")).toBeInTheDocument();
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
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });

    // Test password without uppercase
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Password must contain at least one uppercase letter, one lowercase letter, and one number")).toBeInTheDocument();
    });

    // Test password without number
    fireEvent.change(passwordInput, { target: { value: "PasswordTest" } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Password must contain at least one uppercase letter, one lowercase letter, and one number")).toBeInTheDocument();
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
      expect(screen.getByText("You must accept the terms and conditions")).toBeInTheDocument();
    });
  });

  it("displays error message on registration failure", async () => {
    mockRegister.mockRejectedValue(
      new AuthenticationError("Email already exists")
    );

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
    const onSubmitPromise = new Promise(resolve => setTimeout(resolve, 100));
    mockRegister.mockReturnValue(onSubmitPromise);

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole("button", { name: /create account/i });

    // Fill form with valid data
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.click(termsCheckbox);

    // Submit form
    fireEvent.click(submitButton);

    // Wait for loading state
    await waitFor(() => {
      expect(screen.getByText("Creating account...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Wait for submission to complete
    await onSubmitPromise;
  });

  it("calls register function with correct data", async () => {
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
