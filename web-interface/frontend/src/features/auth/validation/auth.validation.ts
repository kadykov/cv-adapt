import { z } from "zod";
import {
  loginFormSchema as baseLoginFormSchema,
  authResponseSchema,
  type LoginForm,
  type AuthResponse
} from "../../../validation/openapi";

// Export the auth response schema for use in API client
export { authResponseSchema };

// Re-export the schemas with our specific validation rules
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().default(false),
});

export const registrationSchema = loginSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  acceptTerms: z.boolean().refine(
    (val: boolean): val is true => val === true,
    "You must accept the terms and conditions"
  ),
});

// Export types
export type LoginSchema = LoginForm;
export type RegistrationSchema = LoginForm & { acceptTerms: boolean };
export type AuthResponseSchema = AuthResponse;
