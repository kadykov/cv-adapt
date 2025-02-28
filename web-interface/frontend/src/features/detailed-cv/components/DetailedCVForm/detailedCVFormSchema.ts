import { z } from 'zod';
import { Resolver } from 'react-hook-form';
import { LanguageCode } from '../../../../lib/language/types';

// Common type for language value handling
export type LanguageValue = LanguageCode | null;

// Base schema defines the form state
const baseSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  language_code: z.nativeEnum(LanguageCode).nullable(),
  is_primary: z.boolean().default(false),
});

// Schema that validates the final form state
export const detailedCVFormSchema = baseSchema.superRefine((data, ctx) => {
  if (data.language_code === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a valid language',
      path: ['language_code'],
    });
  }
});

// Type for form input values
export type DetailedCVFormInput = z.infer<typeof baseSchema>;

// Type for validated output
export type DetailedCVFormData = Required<{
  content: string;
  language_code: LanguageCode;
  is_primary: boolean;
}>;

// Resolver type with no unknown/any types
export type FormResolver = Resolver<DetailedCVFormInput>;
