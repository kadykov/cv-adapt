// API endpoints
export const CV_GENERATION_API = {
  BASE: '/v1/api/generations',
  GENERATE: '/v1/api/generations/cv',
  COMPETENCES: '/v1/api/generations/competences',
  STATUS: '/v1/api/generations/:id/generation-status',
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
