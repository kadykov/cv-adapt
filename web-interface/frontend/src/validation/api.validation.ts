import { z } from 'zod';

// Base schemas
export const contactSchema = z.object({
  value: z.string(),
  type: z.string(),
  icon: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

export const institutionSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

// Personal info schema
export const personalInfoSchema = z.object({
  full_name: z.string(),
  email: contactSchema.nullable().optional(),
  phone: contactSchema.nullable().optional(),
  location: contactSchema.nullable().optional(),
  linkedin: contactSchema.nullable().optional(),
  github: contactSchema.nullable().optional(),
});

// CV components schemas
export const coreCompetenceSchema = z.object({
  text: z.string(),
});

export const skillSchema = z.object({
  text: z.string(),
});

export const skillGroupSchema = z.object({
  name: z.string(),
  skills: z.array(skillSchema),
});

export const titleSchema = z.object({
  text: z.string(),
});

export const summarySchema = z.object({
  text: z.string(),
});

export const experienceSchema = z.object({
  company: institutionSchema,
  position: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

export const educationSchema = z.object({
  university: institutionSchema,
  degree: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  description: z.string().optional(),
});

export const languageCodeSchema = z.enum(['en', 'fr', 'de', 'es', 'it']);

export const languageSchema = z.object({
  code: languageCodeSchema,
  name: z.string(),
  native_name: z.string(),
  date_format: z.string().nullable().optional(),
  decimal_separator: z.string().nullable().optional(),
  thousands_separator: z.string().nullable().optional(),
});

// Complete CV schema
export const cvSchema = z.object({
  personal_info: personalInfoSchema,
  title: titleSchema,
  summary: summarySchema,
  core_competences: z.array(coreCompetenceSchema),
  experiences: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(skillGroupSchema),
  language: languageSchema,
});

// API request/response schemas
export const generateCompetencesResponseSchema = z.object({
  competences: z.array(z.string()),
});

export const generateCompetencesRequestSchema = z.object({
  cv_text: z.string(),
  job_description: z.string(),
  notes: z.string().nullable().optional(),
});

export const generateCVRequestSchema = z.object({
  cv_text: z.string(),
  job_description: z.string(),
  personal_info: personalInfoSchema,
  approved_competences: z.array(z.string()),
  notes: z.string().nullable().optional(),
});

// Validation functions
export function validateCV(data: unknown) {
  return cvSchema.parse(data);
}

export function validateGenerateCompetencesResponse(data: unknown) {
  return generateCompetencesResponseSchema.parse(data);
}

export function validateGenerateCompetencesRequest(data: unknown) {
  return generateCompetencesRequestSchema.parse(data);
}

export function validateGenerateCVRequest(data: unknown) {
  return generateCVRequestSchema.parse(data);
}
