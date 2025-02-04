import type { CVDTO, GenerateCompetencesRequest, GenerateCVRequest, GenerateCompetencesResponse } from '../types/api';
import {
  validateCV,
  validateGenerateCompetencesResponse,
  validateGenerateCompetencesRequest,
  validateGenerateCVRequest
} from '../validation/api.validation';

const API_BASE_URL = 'http://localhost:8000/api';

export async function generateCompetences(
  request: GenerateCompetencesRequest,
  languageCode: string = 'en'
): Promise<GenerateCompetencesResponse> {
  try {
    try {
      // Validate request before sending
      validateGenerateCompetencesRequest(request);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ValidationError(`Invalid request: ${error.message}`);
      }
      throw new ValidationError('Invalid request: Unknown validation error');
    }

    const response = await fetch(`${API_BASE_URL}/generate-competences?language_code=${languageCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate response before returning
    return validateGenerateCompetencesResponse(data);
  } catch (error: unknown) {
    console.error('Error generating competences:', error);
    throw handleApiError(error);
  }
}

export async function generateCV(
  request: GenerateCVRequest,
  languageCode: string = 'en'
): Promise<CVDTO> {
  try {
    try {
      // Validate request before sending
      validateGenerateCVRequest(request);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ValidationError(`Invalid request: ${error.message}`);
      }
      throw new ValidationError('Invalid request: Unknown validation error');
    }

    const response = await fetch(`${API_BASE_URL}/generate-cv?language_code=${languageCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate response before returning
    return validateCV(data);
  } catch (error: unknown) {
    console.error('Error generating CV:', error);
    throw handleApiError(error);
  }
}

// Error type for validation failures
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Utility function to handle API errors
export function handleApiError(error: unknown): never {
  if (error instanceof Error) {
    if (error.name === 'ValidationError') {
      throw error;
    }
    throw new Error(`API Error: ${error.message}`);
  }
  throw new Error('An unknown error occurred');
}
