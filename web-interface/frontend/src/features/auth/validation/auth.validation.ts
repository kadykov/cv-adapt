import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  remember: z.boolean().optional(),
});

export const registrationSchema = loginSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms and conditions"),
});

export const authResponseSchema = z.object({
  access_token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    personal_info: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegistrationSchema = z.infer<typeof registrationSchema>;
export type AuthResponseSchema = z.infer<typeof authResponseSchema>;
