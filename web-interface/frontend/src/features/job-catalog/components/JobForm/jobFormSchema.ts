import { z } from 'zod';
import { LanguageCode } from '@/lib/language/types';

export const jobFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  language_code: z.nativeEnum(LanguageCode, {
    errorMap: () => ({ message: 'Please select a valid language' }),
  }),
});

export type JobFormData = z.infer<typeof jobFormSchema>;
