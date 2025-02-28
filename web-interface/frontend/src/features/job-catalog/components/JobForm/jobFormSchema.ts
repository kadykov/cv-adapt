import { z } from 'zod';
import { Resolver } from 'react-hook-form';
import { LanguageCode } from '@/lib/language/types';

// Common type for language value handling
export type LanguageValue = LanguageCode | null;

// Base schema defines the form state
const baseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  language_code: z.nativeEnum(LanguageCode).nullable(),
});

// Schema that validates the final form state
export const jobFormSchema = baseSchema.superRefine((data, ctx) => {
  if (data.language_code === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a valid language',
      path: ['language_code'],
    });
  }
});

// Type for form input values
export type JobFormInput = z.infer<typeof baseSchema>;

// Type for validated output
export type JobFormData = Required<{
  title: string;
  description: string;
  language_code: LanguageCode;
}>;

// Resolver type with no unknown/any types
export type FormResolver = Resolver<JobFormInput>;
