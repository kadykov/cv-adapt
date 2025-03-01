export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  JOBS: {
    LIST: '/jobs',
    CREATE: '/jobs/new',
    EDIT: (id: string | number) => `/jobs/${id}/edit`,
    DETAIL: (id: string | number) => `/jobs/${id}`,
  },
  DETAILED_CVS: {
    LIST: '/detailed-cvs',
    CREATE: '/detailed-cvs/new',
    EDIT: (languageCode: string) => `/detailed-cvs/${languageCode}/edit`,
    DETAIL: (languageCode: string) => `/detailed-cvs/${languageCode}`,
  },
} as const;
