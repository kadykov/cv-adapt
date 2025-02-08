import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RegistrationSchema } from "../validation/auth.validation";
import { registrationSchema } from "../validation/auth.validation";
import { useAuth } from "../context/AuthContext";
import { AuthenticationError } from "../api/auth.api";

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationSchema>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationSchema) => {
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      await registerUser(data.email, data.password);
    } catch (e) {
      let fieldErrors = {};

      if (e instanceof AuthenticationError) {
        // Handle structured error details
        if (e.details && typeof e.details === 'object') {
          const details = e.details as { message: string; code: string; field: string };
          if (details.field) {
            fieldErrors = { [details.field]: details.message };
            setError(null);
          } else {
            setError(details.message || e.message);
          }
        } else {
          setError(e.message);
        }

        // Log error details for debugging
        console.error('Registration error:', {
          message: e.message,
          status: e.statusCode,
          details: e.details
        });
      } else {
        // Log unexpected errors
        console.error('Unexpected registration error:', e);
        setError("An unexpected error occurred. Please try again.");
      }

      setFieldErrors(fieldErrors);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-control w-full">
          <label htmlFor="email" className="label">
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
          />
          {(errors.email || fieldErrors.email) && (
            <label className="label">
              <span className="label-text-alt text-error">
                {fieldErrors.email || errors.email?.message}
              </span>
            </label>
          )}
        </div>

        <div className="form-control w-full">
          <label htmlFor="password" className="label">
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
          />
          {(errors.password || fieldErrors.password) && (
            <label className="label">
              <span className="label-text-alt text-error">
                {fieldErrors.password || errors.password?.message}
              </span>
            </label>
          )}
          <label className="label">
            <span className="label-text-alt">
              Password must contain at least 8 characters, including uppercase, lowercase, and numbers
            </span>
          </label>
        </div>

        <div className="form-control">
          <label htmlFor="acceptTerms" className="label cursor-pointer">
            <span className="label-text">I accept the terms and conditions</span>
            <input
              type="checkbox"
              {...register("acceptTerms")}
              id="acceptTerms"
              className={`checkbox ${errors.acceptTerms ? "checkbox-error" : ""}`}
            />
          </label>
          {errors.acceptTerms && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.acceptTerms.message}
              </span>
            </label>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
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
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
