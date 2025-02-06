import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginSchema } from "../validation/auth.validation";
import { loginSchema } from "../validation/auth.validation";
import { useAuth } from "../context/AuthContext";
import { AuthenticationError } from "../api/auth.api";

export function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      await login(data.email, data.password, data.remember);
    } catch (e) {
      if (e instanceof AuthenticationError && e.details) {
        const details = e.details as { message: string; code: string; field: string };
        if (details.field) {
          setFieldErrors({ [details.field]: details.message });
        } else {
          setError(details.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
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
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <input
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
        </div>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Remember me</span>
            <input
              type="checkbox"
              {...register("remember")}
              className="checkbox"
            />
          </label>
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
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
