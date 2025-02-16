import { JobDescriptionResponse } from '@/types/api';
import { z } from 'zod';

const jobSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  language_code: z.string().length(2),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable()
});

export function validateJobDescriptionResponse(response: unknown): response is JobDescriptionResponse {
  try {
    jobSchema.parse(response);
    return true;
  } catch (error) {
    console.debug('Job validation error:', error);
    return false;
  }
}
