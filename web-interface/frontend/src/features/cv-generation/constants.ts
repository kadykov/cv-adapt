// API endpoints
export const CV_GENERATION_API = {
  BASE: '/v1/api/generated-cvs',
  GENERATE: '/v1/api/generated-cvs/generate',
  COMPETENCES: '/v1/api/generated-cvs/competences',
} as const;

// Generation status
export const GENERATION_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Supported export formats
export const EXPORT_FORMAT = {
  PDF: 'pdf',
  MARKDOWN: 'markdown',
} as const;

// API polling interval for generation status (in milliseconds)
export const STATUS_POLLING_INTERVAL = 2000;
