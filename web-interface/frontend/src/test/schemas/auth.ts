import { z } from 'zod';

export const mockLoginSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal('bearer'),
  expires_in: z.number()
});

export type MockLoginSchema = z.infer<typeof mockLoginSchema>;
