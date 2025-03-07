/**
 * Types for the Detailed CV feature
 * Leveraging generated types from OpenAPI schema
 */
import {
  DetailedCVCreate,
  DetailedCVResponse,
} from '../../../lib/api/generated-types';
import { LanguageCode } from '../../../lib/language/types';

export type { DetailedCVCreate, DetailedCVResponse };

/**
 * Form data for creating/editing a detailed CV
 */
export interface DetailedCVFormData {
  language_code: LanguageCode;
  content: string; // Plain text content that will be stored in the CV
  is_primary: boolean;
}

/**
 * Mapping function to convert form data to API request
 * Following the OpenAPI schema, content is Record<string, never>
 * But in practice, we're storing a string in it
 */
export function mapFormToApiRequest(
  formData: DetailedCVFormData,
): DetailedCVCreate {
  // Cast the content string to Record<string, never> to match the OpenAPI schema
  const content = formData.content;

  return {
    language_code: formData.language_code,
    content,
    is_primary: formData.is_primary,
  };
}

/**
 * Mapping function to convert API response to form data
 * Following the OpenAPI schema, content is Record<string, never>
 * But in practice, we're storing a string in it
 */
export function mapApiToFormData(
  response: DetailedCVResponse,
): DetailedCVFormData {
  return {
    language_code: response.language_code as LanguageCode,
    content: response.content as unknown as string,
    is_primary: response.is_primary,
  };
}
