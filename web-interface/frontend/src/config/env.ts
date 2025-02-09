interface Config {
  apiBaseUrl: string;
  apiVersion: string;
  authTokenKey: string;
}

const development: Config = {
  apiBaseUrl: "http://localhost:8000",  // Point directly to backend with /api path
  apiVersion: "v1",
  authTokenKey: "cv_adapt_auth_token",
};

const production: Config = {
  apiBaseUrl: "http://localhost:8000",  // Point directly to backend with /api path
  apiVersion: "v1",
  authTokenKey: "cv_adapt_auth_token",
};

const isDevelopment = process.env.NODE_ENV !== 'production';
const config: Config = isDevelopment ? development : production;

export default config;
