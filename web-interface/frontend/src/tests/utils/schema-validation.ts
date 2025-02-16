import { z } from 'zod';

// Response schema names based on our OpenAPI spec
type ResponseSchemaName = 'LoginResponse' | 'RegisterResponse' | 'RefreshResponse' | 'ErrorResponse';

// Define schemas outside of the validation function to avoid lexical declaration errors
const authSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    created_at: z.string(),
    personal_info: z.record(z.unknown()).nullable()
  })
});

const errorSchema = z.object({
  detail: z.union([
    // Standard error message
    z.object({
      message: z.string()
    }),
    // Validation error array
    z.array(
      z.object({
        type: z.string(),
        msg: z.string(),
        loc: z.array(z.string()).optional()
      })
    )
  ])
});

/**
 * Validates data against a schema from our OpenAPI specification
 * @param schemaName The name of the schema to validate against
 * @param data The data to validate
 * @returns boolean indicating if the data matches the schema
 */
export function validateAgainstSchema(schemaName: ResponseSchemaName, data: unknown): boolean {
  try {
    switch (schemaName) {
      case 'LoginResponse':
      case 'RegisterResponse':
      case 'RefreshResponse':
        authSchema.parse(data);
        return true;

      case 'ErrorResponse':
        errorSchema.parse(data);
        return true;

      default:
        console.error(`Unknown schema name: ${schemaName}`);
        return false;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Schema validation failed:', error.errors);
    } else {
      console.error('Validation error:', error);
    }
    return false;
  }
}
