// Route path constants
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  JOBS: {
    LIST: '/jobs',
    NEW: '/jobs/new',
    DETAIL: (id: string | number) => `/jobs/${id}`,
    EDIT: (id: string | number) => `/jobs/${id}/edit`,
  },
} as const;

// Type-safe route params
export type RouteParams = {
  id?: string;
};
