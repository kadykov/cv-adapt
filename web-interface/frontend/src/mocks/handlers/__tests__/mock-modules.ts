import { z } from 'zod';

const authUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  created_at: z.string(),
  personal_info: z.record(z.unknown()).nullable()
});

const authResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  user: authUserSchema
});

const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const mockModules = {
  '@/types/zod-schemas': {
    pathSchemas: {
      '/v1/auth/login': {
        post: {
          request: loginRequestSchema,
          response: authResponseSchema
        }
      }
    },
    errorSchemas: {
      validation: z.object({
        detail: z.array(z.object({
          loc: z.array(z.string()),
          msg: z.string(),
          type: z.string()
        }))
      }),
      unauthorized: z.object({
        detail: z.object({
          message: z.string()
        })
      }),
      notFound: z.object({
        detail: z.string()
      })
    }
  }
};
