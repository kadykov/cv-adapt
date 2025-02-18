import { z } from 'zod';

export const jobFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  language_code: z.string()
    .min(2, 'Language code must be at least 2 characters long')
    .max(2, 'Language code must be exactly 2 characters'),
});

export type JobFormData = z.infer<typeof jobFormSchema>;
