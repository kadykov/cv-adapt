import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  personal_info: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});

// Auth schemas
export const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

export const authResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  user: userSchema,
});

// Export type definitions
export type User = z.infer<typeof userSchema>;
export type LoginForm = z.infer<typeof loginFormSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
