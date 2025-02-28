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
  content: string;
  is_primary: boolean;
}

/**
 * Mapping function to convert form data to API request
 */
export function mapFormToApiRequest(
  formData: DetailedCVFormData,
): Omit<DetailedCVCreate, 'content'> & { content: { markdown: string } } {
  return {
    language_code: formData.language_code,
    content: { markdown: formData.content }, // Store markdown content in a structured way
    is_primary: formData.is_primary,
  };
}

/**
 * Mapping function to convert API response to form data
 */
export function mapApiToFormData(
  response: DetailedCVResponse,
): DetailedCVFormData {
  return {
    language_code: response.language_code as LanguageCode,
    content:
      typeof response.content === 'object' &&
      response.content !== null &&
      'markdown' in response.content
        ? String(response.content.markdown)
        : '',
    is_primary: response.is_primary,
  };
}
