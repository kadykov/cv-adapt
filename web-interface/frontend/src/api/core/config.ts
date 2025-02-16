// API configuration
export const API_CONFIG = {
  baseURL: '',  // Empty for same-origin requests
  apiPrefix: '/v1',  // API version prefix

  // Build full URL for an endpoint
  getUrl: (endpoint: string) => {
    const prefix = API_CONFIG.apiPrefix;
    // Remove any leading slashes from endpoint and combine
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${API_CONFIG.baseURL}${prefix}/${cleanEndpoint}`;
  },

  // Auth endpoints
  endpoints: {
    auth: {
      login: 'auth/login',
      register: 'auth/register',
      logout: 'auth/logout',
      refresh: 'auth/refresh'
    }
  }
};
