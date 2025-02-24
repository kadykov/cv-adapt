export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  JOBS: {
    LIST: '/jobs',
    CREATE: '/jobs/new',
    EDIT: (id: string | number) => `/jobs/${id}/edit`,
    DETAIL: (id: string | number) => `/jobs/${id}`,
  },
} as const;
