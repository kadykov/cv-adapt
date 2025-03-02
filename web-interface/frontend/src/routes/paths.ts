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
    FORM: (languageCode: string) => `/detailed-cvs/${languageCode}/form`,
    DETAIL: (languageCode: string) => `/detailed-cvs/${languageCode}`,
  },
} as const;
