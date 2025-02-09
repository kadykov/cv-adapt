import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginSchema } from "../validation/auth.validation";
import { loginSchema } from "../validation/auth.validation";
import { useAuth } from "../context/AuthContext";
import { AuthenticationError } from "../api/auth.api";

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    console.log('[Login Form] Form submitted:', {
      email: data.email,
      remember: data.remember
    });

    setError(null);
    setFieldErrors({});

    try {
      console.log('[Login Form] Attempting login');
      await login(data.email, data.password, data.remember);
      console.log('[Login Form] Login successful, redirecting');
      window.location.href = "/jobs";
    } catch (e) {
      console.error('[Login Form] Login error:', e);
      if (e instanceof AuthenticationError && e.details) {
        console.log('[Login Form] Processing authentication error details:', e.details);
        const details = e.details as { message: string; code: string; field?: string };
        if (details.field) {
          setFieldErrors({ [details.field]: details.message });
        } else {
          setError(details.message);
        }
      } else {
        console.error('[Login Form] Unexpected error:', e);
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="form-control w-full">
          <label className="label" htmlFor="email">
            <span className="label-text">Email</span>
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={`input input-bordered w-full ${
              (errors.email || fieldErrors.email) ? "input-error" : ""
            }`}
            placeholder="Enter your email"
            aria-invalid={errors.email || fieldErrors.email ? "true" : "false"}
            aria-describedby={errors.email || fieldErrors.email ? "email-error" : undefined}
          />
          {(errors.email || fieldErrors.email) && (
            <div className="label" role="alert" id="email-error">
              <span className="label-text-alt text-error">
                {fieldErrors.email || errors.email?.message}
              </span>
            </div>
          )}
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="password">
            <span className="label-text">Password</span>
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className={`input input-bordered w-full ${
              (errors.password || fieldErrors.password) ? "input-error" : ""
            }`}
            placeholder="Enter your password"
            aria-invalid={errors.password || fieldErrors.password ? "true" : "false"}
            aria-describedby={errors.password || fieldErrors.password ? "password-error" : undefined}
          />
          {(errors.password || fieldErrors.password) && (
            <div className="label" role="alert" id="password-error">
              <span className="label-text-alt text-error">
                {fieldErrors.password || errors.password?.message}
              </span>
            </div>
          )}
        </div>

        <div className="form-control">
          <label className="label cursor-pointer" htmlFor="remember">
            <span className="label-text">Remember me</span>
            <input
              id="remember"
              type="checkbox"
              {...register("remember")}
              className="checkbox"
            />
          </label>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
